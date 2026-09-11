// eta4.org server: page rendering (layout + pages) + static assets + JSON endpoints.
// Runs on Bun. No dependencies.
//
//   POST /api/volunteer   { name, email, country?, summer?, message? }  -> stored
//   POST /api/newsletter  { email }                                     -> stored
//   POST /api/checkout    { amount (cents), interval: null | "month" }  -> { url } Stripe Checkout
//   GET  /api/admin/export?token=ADMIN_TOKEN                            -> JSON dump of submissions
//   GET  /api/health
//
// Env: PORT, STRIPE_SECRET_KEY, SITE_URL (default https://eta4.org), ADMIN_TOKEN,
//      DATA_DIR (default /data if it exists, else ./data)

import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = Number(process.env.PORT || 8080);
const SITE_URL = (process.env.SITE_URL || "https://eta4.org").replace(/\/$/, "");
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const DATA_DIR = process.env.DATA_DIR || (existsSync("/data") ? "/data" : join(import.meta.dir, "data"));
const SITE = join(import.meta.dir, "site");
const DEV = process.env.NODE_ENV !== "production" && !!process.env.DEV;

// ---------- Database ----------
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
  CREATE TABLE IF NOT EXISTS alumni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    name TEXT NOT NULL, email TEXT, year TEXT NOT NULL, city TEXT NOT NULL, role TEXT NOT NULL,
    line TEXT NOT NULL, consent INTEGER NOT NULL DEFAULT 0, approved INTEGER NOT NULL DEFAULT 0, ip TEXT
  );
  CREATE TABLE IF NOT EXISTS checkout_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    amount_cents INTEGER NOT NULL, interval TEXT, session_id TEXT, ip TEXT
  );
`);

// ---------- i18n strings for the shared layout ----------
const STRINGS: Record<string, Record<string, string>> = {
  en: {
    T_SKIP: "Skip to content",
    T_STRIP_LONG: "We are back in Hue for Summer 2027. Volunteer applications open November 2, 2026.",
    T_STRIP_SHORT: "Back in Hue, Summer 2027",
    T_STRIP_CTA: "Get notified",
    T_NAV_PROGRAMS: "Programs", T_NAV_VOLUNTEER: "Volunteer", T_NAV_IMPACT: "Impact", T_NAV_JOURNAL: "Journal", T_NAV_ABOUT: "About",
    T_DONATE: "Donate",
    T_FOOT_MISSION: "Free five-week English summer camps in Vietnam, taught through academics, athletics and arts, since 2009.",
    T_FOOT_INVOLVED: "Get involved", T_FOOT_LEARN: "Learn", T_FOOT_NEWS: "Updates from Hue", T_FOOT_ALUMNI: "Alumni",
    T_EMAIL_PH: "Your email", T_SUBSCRIBE: "Subscribe",
    P_HOME: "/", P_PROGRAMS: "/programs", P_VOLUNTEER: "/volunteer",
    ALT_LANG: "vi", ALT_LANG_LABEL: "Tiếng Việt", ALT_LANG_SHORT: "VI",
  },
  vi: {
    T_SKIP: "Đến nội dung chính",
    T_STRIP_LONG: "eta4 trở lại Huế mùa hè 2027. Đăng ký cho học sinh mở vào đầu năm 2027.",
    T_STRIP_SHORT: "Trở lại Huế, hè 2027",
    T_STRIP_CTA: "Nhận thông báo",
    T_NAV_PROGRAMS: "Chương trình", T_NAV_VOLUNTEER: "Tình nguyện viên", T_NAV_IMPACT: "Impact", T_NAV_JOURNAL: "Journal", T_NAV_ABOUT: "About",
    T_DONATE: "Donate",
    T_FOOT_MISSION: "Trại hè tiếng Anh miễn phí 5 tuần tại Việt Nam, học qua học thuật, thể thao và nghệ thuật, từ năm 2009.",
    T_FOOT_INVOLVED: "Tham gia", T_FOOT_LEARN: "Tìm hiểu", T_FOOT_NEWS: "Tin từ Huế", T_FOOT_ALUMNI: "Cựu học sinh",
    T_EMAIL_PH: "Email của bạn", T_SUBSCRIBE: "Đăng ký",
    P_HOME: "/vi", P_PROGRAMS: "/vi/programs", P_VOLUNTEER: "/vi/volunteer",
    ALT_LANG: "en", ALT_LANG_LABEL: "English", ALT_LANG_SHORT: "EN",
  },
};

// ---------- Routes ----------
type Page = { file: string; title: string; desc: string; lang?: "en" | "vi"; og?: string; alt?: string; leaflet?: boolean; story?: boolean };
const PAGES: Record<string, Page> = {
  "/": { file: "home.html", title: "eta4 | Free English summer camps in Hue, Vietnam", desc: "Since 2009, eta4 volunteers have taught 14,250 students in Vietnam through free five-week summer camps. We return to Hue in July 2027. Volunteer or give.", og: "/assets/img/hue-courtyard.jpg", alt: "/vi", story: true },
  "/volunteer": { file: "volunteer.html", title: "Volunteer in Hue, Summer 2027 | eta4", desc: "Teach English for five weeks in Hue, Vietnam. Dates, costs, what is covered, and how to apply for the Summer 2027 camp.", og: "/assets/img/volunteers-group.jpg", alt: "/vi/volunteer" },
  "/programs": { file: "programs.html", title: "The camp: academics, athletics, arts | eta4", desc: "How a five-week eta4 English camp works: who it is for, what a day looks like, and how families in Hue enroll for Summer 2027.", og: "/assets/img/hue-games.jpg", alt: "/vi/programs", story: true },
  "/donate": { file: "donate.html", title: "Give to eta4 | 501(c)(3), EIN 26-3633243", desc: "Fund free English education in Hue. One-time or monthly, secure checkout by Stripe, tax-deductible in the United States.", og: "/assets/img/students-smile.jpg" },
  "/impact": { file: "impact.html", title: "Impact since 2009 | eta4", desc: "14,250 students, 700 volunteers, five cities, ten summers. Year-by-year numbers, the map, and the alumni wall.", og: "/assets/img/hue-courtyard.jpg", leaflet: true },
  "/journal": { file: "journal.html", title: "Journal | eta4", desc: "Letters and updates from eta4, including why we paused and why we are coming back to Hue in 2027.", og: "/assets/img/announcement-2019.jpg" },
  "/journal/why-we-paused": { file: "journal-why-we-paused.html", title: "Why we paused, and why we are coming back | eta4", desc: "A letter from eta4's founder on the pause since 2019, what we learned, and the return to Hue in Summer 2027.", og: "/assets/img/announcement-2019.jpg" },
  "/about": { file: "about.html", title: "About eta4 | Team, transparency, 501(c)(3)", desc: "Who runs eta4, our legal status (EIN 26-3633243), public filings, and how to reach us.", og: "/assets/img/volunteers-group.jpg" },
  "/thank-you": { file: "thank-you.html", title: "Thank you | eta4", desc: "Your gift to eta4 is on its way to a classroom in Hue." },
  "/vi": { file: "vi-home.html", lang: "vi", title: "eta4 | Trại hè tiếng Anh miễn phí tại Huế", desc: "Từ 2009, tình nguyện viên eta4 đã dạy 14.250 học sinh Việt Nam qua các trại hè tiếng Anh miễn phí 5 tuần. Chúng tôi trở lại Huế tháng 7 năm 2027.", og: "/assets/img/hue-courtyard.jpg", alt: "/", story: true },
  "/vi/programs": { file: "vi-programs.html", lang: "vi", title: "Trại hè tiếng Anh eta4 tại Huế, hè 2027 | Dành cho phụ huynh và học sinh", desc: "Trại hè tiếng Anh miễn phí 5 tuần tại Huế cho học sinh 8 đến 18 tuổi: thời gian, địa điểm, một ngày ở trại, và cách đăng ký.", og: "/assets/img/hue-games.jpg", alt: "/programs", story: true },
  "/vi/volunteer": { file: "vi-volunteer.html", lang: "vi", title: "Tình nguyện viên địa phương | eta4 Huế 2027", desc: "Sinh viên và giáo viên tại Huế: cùng eta4 dạy tiếng Anh mùa hè 2027. Bạn nhận được gì và cách đăng ký.", og: "/assets/img/volunteers-group.jpg", alt: "/volunteer" },
};

const layout = readFileSync(join(SITE, "layout.html"), "utf8");
const pageCache = new Map<string, string>();

function renderPage(path: string, page: Page, status = 200): Response {
  const key = path;
  let html = pageCache.get(key);
  if (!html || DEV) {
    const lang = page.lang || "en";
    const s = STRINGS[lang];
    const content = readFileSync(join(SITE, "pages", page.file), "utf8");
    const altPath = page.alt || (lang === "en" ? "/vi" : "/");
    const hreflang = page.alt
      ? `<link rel="alternate" hreflang="${lang}" href="${SITE_URL}${path}"><link rel="alternate" hreflang="${lang === "en" ? "vi" : "en"}" href="${SITE_URL}${page.alt}">`
      : "";
    const headExtra = page.leaflet ? `<link rel="stylesheet" href="/assets/vendor/leaflet.css">` : "";
    const bodyExtra = (page.leaflet ? `<script src="/assets/vendor/leaflet.js"></script>` : "") + (page.story ? `<script src="/assets/story.js" defer></script>` : "");
    const vars: Record<string, string> = {
      ...s,
      LANG: lang, TITLE: page.title, DESC: page.desc, PATH: path === "/" ? "/" : path,
      OG_IMAGE: page.og || "/assets/img/hue-courtyard.jpg",
      HREFLANG: hreflang, HEAD_EXTRA: headExtra, BODY_EXTRA: bodyExtra,
      ALT_LANG_PATH: altPath,
      CONTENT: content,
    };
    html = layout.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => (k in vars ? vars[k] : ""));
    pageCache.set(key, html);
  }
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300", ...SECURITY_HEADERS } });
}

// Leaflet must load before app.js runs the map; app.js is deferred and leaflet is a plain script at the end of body,
// so order is: leaflet.js (body end, sync) -> app.js (defer). Good.

const MIME: Record<string, string> = {
  ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".webp": "image/webp", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8",
  ".woff2": "font/woff2", ".json": "application/json; charset=utf-8", ".pdf": "application/pdf",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS } });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 600_000);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 20;
}

async function createCheckoutSession(amountCents: number, interval: "month" | null, ip: string): Promise<Response> {
  if (!STRIPE_SECRET_KEY) {
    return json({ error: "Online giving is being switched on. Please email info@eta4.org and we will send you a way to give today." }, 503);
  }
  const p = new URLSearchParams();
  p.set("mode", interval ? "subscription" : "payment");
  p.set("success_url", `${SITE_URL}/thank-you?session_id={CHECKOUT_SESSION_ID}`);
  p.set("cancel_url", `${SITE_URL}/donate`);
  p.set("line_items[0][quantity]", "1");
  p.set("line_items[0][price_data][currency]", "usd");
  p.set("line_items[0][price_data][unit_amount]", String(amountCents));
  p.set("line_items[0][price_data][product_data][name]", interval ? "Monthly gift to eta4" : "Gift to eta4");
  p.set("line_items[0][price_data][product_data][description]", "Free English summer camps in Hue, Vietnam. eta4 is a 501(c)(3), EIN 26-3633243.");
  if (interval) p.set("line_items[0][price_data][recurring][interval]", interval); else p.set("submit_type", "donate");
  p.set("metadata[source]", "eta4.org");
  p.set("metadata[interval]", interval || "one-time");
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST", headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" }, body: p.toString(),
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
    let path = url.pathname.replace(/\/+$/, "") || "/";

    // ---- API ----
    if (path.startsWith("/api/")) {
      if (path === "/api/stats" && req.method === "GET") {
        const vi = (db.query("SELECT COUNT(*) AS n FROM volunteer_interest").get() as { n: number }).n;
        const nl = (db.query("SELECT COUNT(*) AS n FROM newsletter").get() as { n: number }).n;
        const alumni = db.query("SELECT name, year, city FROM alumni WHERE approved = 1 AND consent = 1 ORDER BY id DESC LIMIT 60").all();
        return new Response(JSON.stringify({ volunteer_interest: vi, newsletter: nl, alumni }), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60", ...SECURITY_HEADERS } });
      }
      if (path === "/api/alumni" && req.method === "GET") {
        const rows = db.query("SELECT id, name, year, city, role, line FROM alumni WHERE approved = 1 AND consent = 1 ORDER BY year ASC, id ASC LIMIT 500").all();
        return new Response(JSON.stringify({ alumni: rows }), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60", ...SECURITY_HEADERS } });
      }
      if (path === "/api/admin/alumni") {
        if (!ADMIN_TOKEN || url.searchParams.get("token") !== ADMIN_TOKEN) return json({ error: "Unauthorized" }, 401);
        if (req.method === "POST") {
          const b = (await req.json().catch(() => ({}))) as { id?: number; approved?: boolean };
          if (!b.id) return json({ error: "id required" }, 400);
          db.query("UPDATE alumni SET approved = ? WHERE id = ?").run(b.approved === false ? 0 : 1, b.id);
          return json({ ok: true });
        }
        return json({ alumni: db.query("SELECT * FROM alumni ORDER BY id DESC").all() });
      }
      if (path === "/api/health") return json({ ok: true, stripe: Boolean(STRIPE_SECRET_KEY), data_dir: DATA_DIR, pages: Object.keys(PAGES).length });
      if (path === "/api/admin/export") {
        if (!ADMIN_TOKEN || url.searchParams.get("token") !== ADMIN_TOKEN) return json({ error: "Unauthorized" }, 401);
        return json({
          volunteer_interest: db.query("SELECT * FROM volunteer_interest ORDER BY id DESC").all(),
          newsletter: db.query("SELECT * FROM newsletter ORDER BY id DESC").all(),
          alumni: db.query("SELECT * FROM alumni ORDER BY id DESC").all(),
          checkout_attempts: db.query("SELECT * FROM checkout_attempts ORDER BY id DESC").all(),
        });
      }
      if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
      if (rateLimited(ip)) return json({ error: "Too many requests. Please try again in a few minutes." }, 429);
      let body: Record<string, unknown> = {};
      try { body = (await req.json()) as Record<string, unknown>; } catch { return json({ error: "Invalid JSON" }, 400); }

      if (path === "/api/volunteer") {
        const name = clean(body.name, 120), email = clean(body.email, 200).toLowerCase();
        if (!name) return json({ error: "Name is required" }, 400);
        if (!EMAIL_RE.test(email)) return json({ error: "A valid email is required" }, 400);
        db.query("INSERT INTO volunteer_interest (name, email, country, summer, message, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run(name, email, clean(body.country, 100), clean(body.summer, 10), clean(body.message, 2000), ip, req.headers.get("user-agent") || "");
        console.log(`volunteer interest: ${name} <${email}> summer=${clean(body.summer, 10)}`);
        return json({ ok: true });
      }
      if (path === "/api/alumni") {
        const name = clean(body.name, 120), year = clean(body.year, 12), city = clean(body.city, 80), role = clean(body.role, 20), line = clean(body.line, 280), email = clean(body.email, 200).toLowerCase();
        const consent = body.consent === true || body.consent === "yes" ? 1 : 0;
        if (!name || !year || !city || !line) return json({ error: "Name, year, city and your one line are required" }, 400);
        if (!/^(20(09|1[0-9]))$/.test(year)) return json({ error: "Year must be between 2009 and 2019" }, 400);
        if (!["student", "volunteer", "local volunteer", "teacher"].includes(role)) return json({ error: "Pick student, volunteer, local volunteer or teacher" }, 400);
        if (email && !EMAIL_RE.test(email)) return json({ error: "That email does not look right" }, 400);
        db.query("INSERT INTO alumni (name, email, year, city, role, line, consent, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(name, email || null, year, city, role, line, consent, ip);
        console.log(`alumni: ${name} ${year} ${city} (${role}) consent=${consent}`);
        return json({ ok: true });
      }
      if (path === "/api/newsletter") {
        const email = clean(body.email, 200).toLowerCase();
        if (!EMAIL_RE.test(email)) return json({ error: "A valid email is required" }, 400);
        db.query("INSERT OR IGNORE INTO newsletter (email, ip) VALUES (?, ?)").run(email, ip);
        return json({ ok: true });
      }
      if (path === "/api/checkout") {
        const amount = Number(body.amount), interval = body.interval === "month" ? "month" : null;
        if (!Number.isInteger(amount) || amount < 100 || amount > 99_999_900) return json({ error: "Amount must be between $1 and $999,999" }, 400);
        return createCheckoutSession(amount, interval, ip);
      }
      return json({ error: "Not found" }, 404);
    }

    // ---- Legacy anchors from the single-page site ----
    if (path === "/index.html") return Response.redirect(`${SITE_URL}/`, 301);

    // ---- Pages ----
    const page = PAGES[path];
    if (page) return renderPage(path, page);

    // ---- Static ----
    if (path === "/robots.txt") return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${SITE_URL}/sitemap.xml\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    if (path === "/sitemap.xml") {
      const urls = Object.keys(PAGES).filter((p) => p !== "/thank-you").map((p) => `  <url><loc>${SITE_URL}${p === "/" ? "/" : p}</loc></url>`).join("\n");
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
    }
    if (path === "/favicon.svg" || path === "/favicon.ico") path = "/assets/favicon.svg";
    if (path.startsWith("/assets/") && !path.includes("..")) {
      const file = Bun.file(join(SITE, path));
      if (await file.exists()) {
        return new Response(file, { headers: { "Content-Type": MIME[extname(path)] || "application/octet-stream", "Cache-Control": "public, max-age=604800", ...SECURITY_HEADERS } });
      }
    }
    return renderPage("/404", { file: "404.html", title: "Page not found | eta4", desc: "That page is not here." }, 404);
  },
});

console.log(`eta4 server on :${PORT} (data: ${DATA_DIR}, stripe: ${STRIPE_SECRET_KEY ? "configured" : "NOT configured"}, pages: ${Object.keys(PAGES).length})`);
