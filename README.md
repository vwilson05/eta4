# eta4.org

Website for eta4 (English Through Academics, Athletics and Arts Abroad), a 501(c)(3) running free five-week
English summer camps in Hue, Vietnam since 2009. Returning July 2027.

## Stack
- `server.ts`: Bun server, no dependencies. Renders `site/layout.html` + `site/pages/*.html`, serves `site/assets`,
  and exposes `/api/volunteer`, `/api/newsletter`, `/api/checkout` (Stripe Checkout), `/api/admin/export`, `/api/health`.
- SQLite at `/data/eta4.db` (Railway volume) for form submissions and checkout attempts.
- Design system in `site/assets/styles.css`; behaviour in `site/assets/app.js`; logo set in `site/assets/*.svg`.
- Pages: `/`, `/volunteer`, `/programs`, `/donate`, `/impact`, `/journal`, `/journal/why-we-paused`, `/about`,
  Vietnamese: `/vi`, `/vi/programs`, `/vi/volunteer`.

## Run locally
```
DEV=1 PORT=8091 DATA_DIR=./data ADMIN_TOKEN=dev bun run server.ts
```
`DEV=1` re-reads pages on every request (otherwise they are cached in memory).

## Deploy
Railway project `eta4`, service `eta4`, not GitHub-connected: `railway up --service eta4`.
Env vars: `SITE_URL`, `ADMIN_TOKEN`, `STRIPE_SECRET_KEY` (set in the Railway dashboard).

## Design
- Identity: kite mark (Hue kites, four panels for the four A's), Bricolage Grotesque + Be Vietnam Pro,
  palette lacquer `#8A2B3A`, river `#1D4E5F`, summer `#E9B44C`, rice paper `#F5F1E8`.
- Logo concepts sheet: `design/logo-concepts.html`.
- Photos in `site/assets/img` are frames from the eta4 YouTube channel.
