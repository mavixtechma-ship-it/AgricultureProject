# AgriSense

Smart-farm landing page and sensor dashboard — a **portfolio demo** running entirely on mock data.

AgriSense shows soil moisture, irrigation, solar power and nutrient sensors for four simulated fields across two farms,
raises threshold alerts, and lets an administrator start or stop pumps and fertilizer dosers.

## Stack

- Angular 19 (standalone components, signals, lazy routes, `OnPush`)
- PrimeNG 19 + `@primeng/themes` (custom teal/amber preset, deep-slate dark mode) + PrimeIcons
- Tailwind CSS 3 (+ `tailwindcss-primeui`), Chart.js via `p-chart`
- No backend: a functional `HttpInterceptor` answers `/mock-api/*` from `src/assets/mock/*.json`

## Run

```bash
npm install
npm start            # http://localhost:4200
npm run build        # production build → dist/agrisense/browser
```

Docker (nginx with security headers):

```bash
docker compose up --build   # http://localhost:8081
```

## Accounts

There are exactly two accounts — `admin` (full access) and `viewer` (read-only). Passwords are stored in source only as
salted PBKDF2-SHA256 hashes (310,000 iterations) and verified in the browser with WebCrypto. Plain credentials are in the
git-ignored `CREDENTIALS.md`. Rotate them with:

```bash
npm run gen:credentials
```

> WebCrypto needs a secure context: use `localhost` or HTTPS.
> This is a demo access gate, not real security — everything runs client-side.

## Mock API

| Method | Path | Notes |
|---|---|---|
| GET | `/mock-api/farms` | Farms and their fields |
| GET | `/mock-api/sensors/{water\|electricity\|fertilizer}?fieldId=` | 7 days of hourly readings, re-anchored to the current hour |
| GET | `/mock-api/devices[?fieldId=]` | Pumps and dosers |
| PATCH | `/mock-api/devices/{id}` | `{ "on": boolean }` — admin only (viewer → 403), in-memory |
| GET | `/mock-api/alerts[?fieldId=]` | Alerts |
| PATCH | `/mock-api/alerts/{id}` | `{ "acknowledged": true }` — admin only, in-memory |

Regenerate the mock data with `npm run gen:mock`.

## Project layout

```
src/app/
  core/auth       auth service (PBKDF2/WebCrypto, sessionStorage session with expiry), guards, hashed accounts
  core/data       models, DataService, mock backend interceptor
  core/theme      PrimeNG preset, ThemeService (light/dark)
  layout/         dashboard shell (sidebar, top bar, field selector, theme toggle)
  features/       landing, login, overview, irrigation, energy, nutrients, alerts
  shared/ui       panel, KPI tile, device controls, severity tag, logo
  shared/util     chart theming, formatting, loadable state helpers
```

See `PROJECT_ANALYSIS.md` for the full analysis and transformation notes.

## Developed by Mavix Tech

[![Mavix Tech](docs/mavix-logo.png)](https://mavixtechma-ship-it.github.io/Mavix/)

**Systems · Automation · Graduation Projects**

Custom business systems, workflow automation and complete graduation projects. ASP.NET, Angular, SQL Server.
Have an idea? Let's build it — <https://mavixtechma-ship-it.github.io/Mavix/>

The owner credit, link and logo paths live in `src/app/core/owner.ts`; the self-hosted logos are in `public/brand/mavix/`.
