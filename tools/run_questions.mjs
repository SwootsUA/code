// tools/run_questions.mjs
// Node 18+ (built-in fetch)
// Reads questions from a JSON file in the format:
// { "correct": [...], "ambiguous": [...], "wrong": [...], "off_topic": [...] }
// Sends each message to your backend POST /api/chat and logs results.
//
// Usage:
//   node tools/run_questions.mjs --in questions.json --out results.jsonl
//   node tools/run_questions.mjs --in questions.json --out results.jsonl --base http://localhost:5000 --path /api/chat
//
// Options:
//   --in        Input JSON file with questions (required)
//   --out       Output JSONL file (default: results.jsonl)
//   --base      Base URL (default: http://localhost:5000)
//   --path      API path (default: /api/chat)
//   --delayMs   Delay between requests (default: 200)
//   --timeoutMs Request timeout (default: 60000)
//   --retries   Retries for 502/503/504 (default: 2)

import fs from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

function nowIso() {
  return new Date().toISOString();
}

function flattenQuestions(obj) {
  const categories = ["correct", "ambiguous", "wrong", "off_topic"];
  const items = [];
  let idx = 0;

  for (const cat of categories) {
    const arr = obj?.[cat];
    if (!Array.isArray(arr)) continue;

    for (const msg of arr) {
      if (typeof msg !== "string" || !msg.trim()) continue;
      idx += 1;
      items.push({
        id: idx,
        category: cat,
        message: msg.trim(),
      });
    }
  }
  return items;
}

async function postJson(url, body, timeoutMs) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ac.signal,
    });

    const ms = Date.now() - started;
    const text = await res.text();

    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    return {
      ok: res.ok,
      status: res.status,
      elapsedMs: ms,
      rawText: text,
      json,
    };
  } finally {
    clearTimeout(t);
  }
}

function backoffDelayMs(attempt) {
  // attempt: 1..n
  return Math.min(2000, 250 * 2 ** (attempt - 1));
}

async function main() {
  const args = parseArgs(process.argv);

  const inFile = args.in;
  if (!inFile) {
    console.error("Missing --in questions.json");
    process.exit(1);
  }

  const outFile = args.out || "results.jsonl";
  const base = (args.base || "http://localhost:5000").replace(/\/+$/, "");
  const apiPath = args.path || "/api/chat";
  const delayMs = Number(args.delayMs || 200);
  const timeoutMs = Number(args.timeoutMs || 60000);
  const retries = Number(args.retries || 2);

  const fullUrl = `${base}${apiPath}`;

  const inputText = fs.readFileSync(inFile, "utf-8");
  const inputJson = JSON.parse(inputText);
  const items = flattenQuestions(inputJson);

  if (items.length === 0) {
    console.error("No questions found in input JSON.");
    process.exit(1);
  }

  // Ensure output dir exists
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });

  const out = fs.createWriteStream(outFile, { flags: "a", encoding: "utf-8" });

  console.log(`Target: ${fullUrl}`);
  console.log(`Questions: ${items.length}`);
  console.log(`Output: ${outFile}`);
  console.log("");

  let okCount = 0;
  let failCount = 0;

  for (const item of items) {
    const recordBase = {
      ts: nowIso(),
      id: item.id,
      category: item.category,
      message: item.message,
      url: fullUrl,
    };

    let attempt = 0;
    let result = null;

    while (attempt <= retries) {
      attempt += 1;
      try {
        const r = await postJson(fullUrl, { message: item.message }, timeoutMs);

        const status = r.status;
        const retryable = [502, 503, 504].includes(status);

        result = {
          ...recordBase,
          attempt,
          status,
          ok: r.ok,
          elapsedMs: r.elapsedMs,
          reply: r.json?.reply ?? null,
          error: r.json?.error ?? (r.ok ? null : r.rawText?.slice(0, 500) || null),
        };

        if (!r.ok && retryable && attempt <= retries) {
          await sleep(backoffDelayMs(attempt));
          continue;
        }
        break;
      } catch (e) {
        const msg = e?.name === "AbortError" ? "timeout" : String(e?.message || e);
        result = {
          ...recordBase,
          attempt,
          status: 0,
          ok: false,
          elapsedMs: null,
          reply: null,
          error: msg,
        };

        // Retry on network/timeout
        if (attempt <= retries) {
          await sleep(backoffDelayMs(attempt));
          continue;
        }
        break;
      }
    }

    out.write(JSON.stringify(result) + "\n");

    if (result.ok) okCount += 1;
    else failCount += 1;

    const short = result.ok
      ? `OK ${result.status} ${result.elapsedMs}ms`
      : `FAIL ${result.status || "ERR"} ${result.error || ""}`.trim();

    console.log(`[${item.id}/${items.length}] ${item.category} -> ${short}`);

    if (delayMs > 0) await sleep(delayMs);
  }

  out.end();
  console.log("");
  console.log(`Done. OK: ${okCount}, FAIL: ${failCount}`);
  console.log(`Saved: ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
