import { NextFunction, Request, Response } from 'express';
import { setInterval } from 'node:timers';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { processUserQuery } from './api/controller.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.set('trust proxy', true);

// ---- CORS policy ----
// Configure allowed origins via CORS_ORIGIN (comma-separated). Example:
// CORS_ORIGIN=http://localhost:5173,https://example.edu
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (curl/Postman) where Origin header is absent.
      if (!origin) return callback(null, true);
      // If allowlist isn't configured, allow all origins (development-friendly default).
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
  })
);

// ---- Rate limiting ----
// In-memory limiter: defaults to 60 requests per minute per IP for /api/*
const rateWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const rateMax = Number(process.env.RATE_LIMIT_MAX || 60);

app.use('/api/', createRateLimiter({ windowMs: rateWindowMs, max: rateMax }));
app.use(express.json());

app.post('/api/chat', async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const reply = await processUserQuery(message);
    res.json({ reply });
  } catch (error: any) {
    const mapped = mapProviderError(error);
    console.error('Error:', { status: mapped.status, error: mapped.error, details: mapped.details });
    res.status(mapped.status).json({ error: mapped.error });
  }
});

// Express error handler for CORS rejections, etc.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (String(err?.message || '').includes('Not allowed by CORS')) {
    return res.status(403).json({ error: 'CORS policy blocked this request.' });
  }
  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => console.log(`Server running on port ${port}`));

function mapProviderError(error: any): { status: number; error: string; details?: string } {
  const msg = String(error?.message || error || '');
  const code = String(error?.code || '');
  const name = String(error?.name || '');

  // Missing API key / misconfiguration
  if (
    msg.includes('API_KEY is missing') ||
    msg.includes('OPENAI_API_KEY') ||
    msg.includes('GEMINI_API_KEY')
  ) {
    return { status: 503, error: 'LLM provider is not configured.' };
  }

  // Provider rate limit / overload
  if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
    return { status: 503, error: 'LLM provider is overloaded. Please retry later.' };
  }

  // Network / upstream failures
  const networkCodes = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN']);
  if (networkCodes.has(code) || name.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
    return { status: 502, error: 'LLM provider is temporarily unavailable.' };
  }

  // Default
  return { status: 500, error: 'Internal server error', details: msg.slice(0, 200) };
}

function createRateLimiter(opts: { windowMs: number; max: number }) {
  const { windowMs, max } = opts;
  type Entry = { count: number; resetAt: number };
  const store = new Map<string, Entry>();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }, Math.max(10000, Math.min(windowMs, 60000))).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const current = store.get(ip);
    if (!current || current.resetAt <= now) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - 1)));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));
      return next();
    }

    current.count += 1;

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - current.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)));

    if (current.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    return next();
  };
}
