# tools/render_bench.py
# Creates prettier benchmark graphs from autocannon JSON outputs.
# Inputs:
#   backend/bench-latency.json
#   backend/bench-parallel.json
# Outputs (in docs/bench/):
#   latency-percentiles-compare.png
#   rps-compare.png
#   throughput-compare.png
#   bench-summary.md

import json
from pathlib import Path
import math
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
LAT_PATH = ROOT / "backend" / "bench-latency.json"
PAR_PATH = ROOT / "backend" / "bench-parallel.json"
OUT_DIR = ROOT / "docs" / "bench"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def load(p: Path) -> dict:
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)


def get(d: dict, path: str, default=None):
    cur = d
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return default
        cur = cur[part]
    return cur


def fmt_num(x, decimals=2):
    if x is None:
        return "-"
    if isinstance(x, (int, float)):
        if isinstance(x, bool):
            return str(x)
        if isinstance(x, int):
            return str(x)
        return f"{x:.{decimals}f}"
    return str(x)


def pct_points(lat: dict):
    # autocannon JSON uses p97_5, p99_9, p99_99, etc
    keys = [
        ("p50", "p50"),
        ("p90", "p90"),
        ("p95", "p95"),       # may be absent
        ("p97.5", "p97_5"),
        ("p99", "p99"),
        ("max", "max"),
    ]
    out = []
    for label, k in keys:
        v = lat.get(k)
        if v is not None:
            out.append((label, v))
    # If p95 missing, keep p97.5; otherwise keep both.
    return out


def summary_row(name: str, d: dict):
    lat = d.get("latency", {}) or {}
    req = d.get("requests", {}) or {}
    thr = d.get("throughput", {}) or {}
    return {
        "name": name,
        "connections": d.get("connections"),
        "duration_s": d.get("duration"),
        "2xx": d.get("2xx"),
        "non2xx": d.get("non2xx"),
        "errors": d.get("errors"),
        "timeouts": d.get("timeouts"),
        "avg_latency_ms": lat.get("average"),
        "p50_ms": lat.get("p50"),
        "p90_ms": lat.get("p90"),
        "p99_ms": lat.get("p99"),
        "max_ms": lat.get("max"),
        "rps_avg": req.get("average"),
        "rps_max": req.get("max"),
        "thr_avg_bps": thr.get("average"),
        "thr_max_bps": thr.get("max"),
    }


def write_summary_md(rows: list[dict], out_path: Path):
    headers = [
        "Benchmark", "Connections", "Duration (s)",
        "2xx", "Non-2xx", "Errors", "Timeouts",
        "Avg latency (ms)", "p50 (ms)", "p90 (ms)", "p99 (ms)", "Max (ms)",
        "Avg RPS", "Max RPS",
        "Avg Throughput (B/s)", "Max Throughput (B/s)",
    ]
    lines = []
    lines.append("| " + " | ".join(headers) + " |")
    lines.append("|" + "|".join(["---"] * len(headers)) + "|")

    for r in rows:
        lines.append(
            "| " + " | ".join([
                fmt_num(r["name"]),
                fmt_num(r["connections"]),
                fmt_num(r["duration_s"]),
                fmt_num(r["2xx"]),
                fmt_num(r["non2xx"]),
                fmt_num(r["errors"]),
                fmt_num(r["timeouts"]),
                fmt_num(r["avg_latency_ms"]),
                fmt_num(r["p50_ms"]),
                fmt_num(r["p90_ms"]),
                fmt_num(r["p99_ms"]),
                fmt_num(r["max_ms"]),
                fmt_num(r["rps_avg"]),
                fmt_num(r["rps_max"]),
                fmt_num(r["thr_avg_bps"], 0),
                fmt_num(r["thr_max_bps"], 0),
            ]) + " |"
        )

    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def set_common_axes(ax, title: str, xlabel: str, ylabel: str):
    ax.set_title(title)
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    ax.grid(True, which="major", axis="y", linestyle="-", linewidth=0.5, alpha=0.3)


def annotate_bars(ax, bars):
    for b in bars:
        h = b.get_height()
        if h is None or (isinstance(h, float) and math.isnan(h)):
            continue
        ax.annotate(
            f"{h:.0f}",
            (b.get_x() + b.get_width() / 2, h),
            xytext=(0, 4),
            textcoords="offset points",
            ha="center",
            va="bottom",
            fontsize=9
        )


def plot_latency_percentiles_compare(lat_name: str, lat: dict, par_name: str, par: dict, out_path: Path):
    lat_pts = pct_points(lat.get("latency", {}) or {})
    par_pts = pct_points(par.get("latency", {}) or {})

    # Align labels intersection to avoid mismatch when p95 is absent
    labels = [l for (l, _) in lat_pts]
    par_map = {l: v for (l, v) in par_pts}
    lat_map = {l: v for (l, v) in lat_pts}
    labels = [l for l in labels if l in par_map]

    lat_vals = [lat_map[l] for l in labels]
    par_vals = [par_map[l] for l in labels]

    x = list(range(len(labels)))
    w = 0.38

    plt.figure(figsize=(11, 6))
    ax = plt.gca()
    bars1 = ax.bar([i - w/2 for i in x], lat_vals, width=w, label=lat_name)
    bars2 = ax.bar([i + w/2 for i in x], par_vals, width=w, label=par_name)

    ax.set_xticks(x, labels)
    set_common_axes(ax, "Latency percentiles comparison", "Percentile", "Latency (ms)")
    ax.legend()
    ax.set_ylim(0, max(max(lat_vals), max(par_vals)) * 1.15)

    annotate_bars(ax, bars1)
    annotate_bars(ax, bars2)

    plt.tight_layout()
    plt.savefig(out_path, dpi=180)
    plt.close()


def plot_rps_throughput_compare(lat_name: str, lat: dict, par_name: str, par: dict, out_path: Path):
    rows = [
        (lat_name, lat.get("requests", {}) or {}, lat.get("throughput", {}) or {}),
        (par_name, par.get("requests", {}) or {}, par.get("throughput", {}) or {}),
    ]

    labels = [r[0] for r in rows]
    rps_avg = [r[1].get("average", 0) or 0 for r in rows]
    rps_max = [r[1].get("max", 0) or 0 for r in rows]
    thr_avg = [r[2].get("average", 0) or 0 for r in rows]
    thr_max = [r[2].get("max", 0) or 0 for r in rows]

    x = list(range(len(labels)))
    w = 0.35

    plt.figure(figsize=(11, 6))
    ax = plt.gca()
    bars1 = ax.bar([i - w/2 for i in x], rps_avg, width=w, label="Avg RPS")
    bars2 = ax.bar([i + w/2 for i in x], rps_max, width=w, label="Max RPS")

    ax.set_xticks(x, labels)
    set_common_axes(ax, "Requests per second", "Benchmark", "Requests/sec")
    ax.legend()
    annotate_bars(ax, bars1)
    annotate_bars(ax, bars2)
    plt.tight_layout()
    plt.savefig(out_path, dpi=180)
    plt.close()

    plt.figure(figsize=(11, 6))
    ax = plt.gca()
    bars1 = ax.bar([i - w/2 for i in x], thr_avg, width=w, label="Avg throughput (B/s)")
    bars2 = ax.bar([i + w/2 for i in x], thr_max, width=w, label="Max throughput (B/s)")

    ax.set_xticks(x, labels)
    set_common_axes(ax, "Throughput", "Benchmark", "Bytes/sec")
    ax.legend()
    annotate_bars(ax, bars1)
    annotate_bars(ax, bars2)
    plt.tight_layout()
    plt.savefig(OUT_DIR / "throughput-compare.png", dpi=180)
    plt.close()

    # keep a single entry point name for README convenience
    # this file points to the RPS chart
    Path(out_path).write_bytes((OUT_DIR / "rps-compare.png").read_bytes())

def main():
    lat = load(LAT_PATH)
    par = load(PAR_PATH)

    lat_name = f"latency (c={get(lat,'connections','?')})"
    par_name = f"parallel (c={get(par,'connections','?')})"

    plot_latency_percentiles_compare(
        lat_name, lat, par_name, par,
        OUT_DIR / "latency-percentiles-compare.png"
    )

    plot_rps_throughput_compare(
        lat_name, lat, par_name, par,
        OUT_DIR / "rps-compare.png"
    )

    rows = [summary_row("bench-latency", lat), summary_row("bench-parallel", par)]
    write_summary_md(rows, OUT_DIR / "bench-summary.md")


if __name__ == "__main__":
    main()
