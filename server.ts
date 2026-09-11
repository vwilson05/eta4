// eta4.org server: static files + three small JSON endpoints.
// Runs on Bun. No dependencies.
//
//   POST /api/volunteer   { name, email, country?, summer?, message? }  -> stored
//   POST /api/newsletter  { email }                                     -> stored
//   POST /api/checkout    { amount (cents), interval: null | "month" }  -> { url } Stripe Checkout
//   GET  /api/admin/export?token=ADMIN_TOKEN                            -> JSON dump of submissions
//   GET  /api/health
//
// Env: PORT, STRIPE_SECRET_KEY, SITE_URL (default https://eta4.org), ADMIN_TOKEN, DATA_DIR (default /data if it exists, else ./data)

import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const PORT = Number(process.env.PORT || 8080);
const SITE_URL = (process.env.SITE_URL || "https://eta4.org").replace(/\/$/, "");
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const DATA_DIR = process.env.DATA_DIR || (existsSync("/data") ? "/data" : join(import.meta.dir, "data"));

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(join(DATA_DIR, "eta4.db"));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS volunteer_interest (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    name TEXT NOT NULL, email TEXT NOT NULL, country TEXT, summer TEXT, message TEXT,
    ip TEXT, user_agent TEXT
  );
  CREATE TABLE IF NOT EXISTS newsletter (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    email TEXT NOT NULL UNIQUE, ip TEXT
  );
  CREATE TABLE IF NOT EXISTS checkout_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    amount_cents INTEGER NOT NULL, interval TEXT, session_id TEXT, ip TEXT
  );
`);

const STATIC_FILES: Record<string, string> = {
  "/": "index.html",
  "/index.html": "index.html",
  "/styles.css": "styles.css",
  "/script.js": "script.js",
  "/favicon.svg": "favicon.svg",
  "/thank-you": "thank-you.html",
  "/thank-you.html": "thank-you.html",
  "/robots.txt": "robots.txt",
  "/sitemap.xml": "sitemap.xml",
  "/og.jpg": "og.jpg",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Tiny in-memory rate limit per IP: 20 API calls per 10 minutes.
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 600_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 20;
}

async function createCheckoutSession(amountCents: number, interval: "month" | null, ip: string): Promise<Response> {
  if (!STRIPE_SECRET_KEY) {
    return json({ error: "Online donations are being set up. Please email info@eta4.org and we will send you a way to give." }, 503);
  }
  const params = new URLSearchParams();
  params.set("mode", interval ? "subscription" : "payment");
  params.set("success_url", `${SITE_URL}/thank-you?session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${SITE_URL}/#donate`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(amountCents));
  params.set("line_items[0][price_data][product_data][name]", interval ? "Monthly gift to eta4" : "Gift to eta4");
  params.set("line_items[0][price_data][product_data][description]", "Free English summer camps in Hue, Vietnam. eta4 is a 501(c)(3), EIN 26-3633243.");
  if (interval) params.set("line_items[0][price_data][recurring][interval]", interval);
  else params.set("submit_type", "donate");
  params.set("metadata[source]", "eta4.org");
  params.set("metadata[interval]", interval || "one-time");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const data = (await res.json()) as { url?: string; id?: string; error?: { message?: string } };
  if (!res.ok || !data.url) {
    console.error("stripe error", res.status, data.error?.message);
    return json({ error: "Stripe could not start checkout. Please try again or email info@eta4.org." }, 502);
  }
  db.query("INSERT INTO checkout_attempts (amount_cents, interval, session_id, ip) VALUES (?, ?, ?, ?)").run(amountCents, interval, data.id ?? null, ip);
  return json({ url: data.url });
}

Bun.serve({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || server.requestIP(req)?.address || "unknown";

    // ---- API ----
    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/health") return json({ ok: true, stripe: Boolean(STRIPE_SECRET_KEY), data_dir: DATA_DIR });

      if (url.pathname === "/api/admin/export") {
        if (!ADMIN_TOKEN || url.searchParams.get("token") !== ADMIN_TOKEN) return json({ error: "Unauthorized" }, 401);
        return json({
          volunteer_interest: db.query("SELECT * FROM volunteer_interest ORDER BY id DESC").all(),
          newsletter: db.query("SELECT * FROM newsletter ORDER BY id DESC").all(),
          checkout_attempts: db.query("SELECT * FROM checkout_attempts ORDER BY id DESC").all(),
        });
      }

      if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
      if (rateLimited(ip)) return json({ error: "Too many requests. Please try again in a few minutes." }, 429);

      let body: Record<string, unknown> = {};
      try { body = (await req.json()) as Record<string, unknown>; } catch { return json({ error: "Invalid JSON" }, 400); }

      if (url.pathname === "/api/volunteer") {
        const name = clean(body.name, 120);
        const email = clean(body.email, 200).toLowerCase();
        if (!name) return json({ error: "Name is required" }, 400);
        if (!EMAIL_RE.test(email)) return json({ error: "A valid email is required" }, 400);
        db.query("INSERT INTO volunteer_interest (name, email, country, summer, message, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run(name, email, clean(body.country, 100), clean(body.summer, 10), clean(body.message, 2000), ip, req.headers.get("user-agent") || "");
        console.log(`volunteer interest: ${name} <${email}> summer=${clean(body.summer, 10)}`);
        return json({ ok: true });
      }

      if (url.pathname === "/api/newsletter") {
        const email = clean(body.email, 200).toLowerCase();
        if (!EMAIL_RE.test(email)) return json({ error: "A valid email is required" }, 400);
        db.query("INSERT OR IGNORE INTO newsletter (email, ip) VALUES (?, ?)").run(email, ip);
        return json({ ok: true });
      }

      if (url.pathname === "/api/checkout") {
        const amount = Number(body.amount);
        const interval = body.interval === "month" ? "month" : null;
        if (!Number.isInteger(amount) || amount < 100 || amount > 99_999_900) return json({ error: "Amount must be between $1 and $999,999" }, 400);
        return createCheckoutSession(amount, interval, ip);
      }

      return json({ error: "Not found" }, 404);
    }

    // ---- Static ----
    const name = STATIC_FILES[url.pathname];
    if (!name) {
      return new Response(Bun.file(join(import.meta.dir, "404.html")), { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", ...SECURITY_HEADERS } });
    }
    const file = Bun.file(join(import.meta.dir, name));
    if (!(await file.exists())) return new Response("Not found", { status: 404 });
    const isHtml = name.endsWith(".html");
    return new Response(file, {
      headers: {
        "Cache-Control": isHtml ? "public, max-age=300" : "public, max-age=86400",
        ...SECURITY_HEADERS,
      },
    });
  },
});

console.log(`eta4 server listening on :${PORT} (data: ${DATA_DIR}, stripe: ${STRIPE_SECRET_KEY ? "configured" : "NOT configured"})`);
