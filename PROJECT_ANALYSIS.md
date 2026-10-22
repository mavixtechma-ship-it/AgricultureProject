# PROJECT_ANALYSIS — AgriSense

> Part of the **MyProgram** portfolio workspace. This document records what the project was when it entered the
> workspace (the "Before" sections) and what was changed to make it a standalone demo (the "Transformation" section).
> Identifying strings from the original code base (author name, e-mail, social profile, hostnames, IP, previous brand
> name) are intentionally **not** reproduced here — they are described generically.

## 1. Purpose (before)

A marketing landing page plus a small "smart farm" dashboard for an IoT agriculture product. Visitors could read about
the product, register, sign in, and then see three dashboard tabs (water, electricity, fertilizer) showing sensor
readings and two device toggles (irrigation pump, fertilizer doser).

## 2. Stack (before)

| Area | Technology |
|---|---|
| Framework | Angular 17 (standalone components, `@angular-devkit/build-angular:application` builder) |
| Styling | Tailwind CSS 3 with a custom lime / forest-green / orange palette, self-hosted woff2 fonts |
| HTTP | `HttpClient` against a remote REST API |
| Analytics | Two third-party hosting-vendor analytics/speed-insight packages injected in `main.ts` |
| Tests | Karma + Jasmine (generated spec stubs only) |
| Deploy | Multi-stage `Dockerfile` (node build → nginx), `docker-compose.yml`, minimal `nginx.conf` (SPA fallback only) |

## 3. Structure & routes (before)

```
src/app/
  app.component.*        navbar + router-outlet + footer
  app.routes.ts          routes (below)
  components/
    home/                long landing page (hero photo, services, features, testimonials)
    login/  register/    e-mail + password forms
    dashboard/           tab switcher → water-dash / electricity-dash / fertilizer-dash
    navbar/  footer/
  guards/auth.guard.ts   reads AuthService.isLoggedIn()
  services/auth.service.ts
src/environments/environment.ts   API base URL
src/assets/images, src/assets/fonts
```

| Path | Component | Guard |
|---|---|---|
| `''`, `about` | HomeComponent | – |
| `login` | LoginComponent | – |
| `register` | RegisterComponent | – |
| `dashboard` | DashboardComponent (tabs: water / electricity / fertilizer) | `authGuard` |
| `**` | redirect to `''` | – |

## 4. Data shapes (before)

All dashboard values were **hard-coded literals** in component classes — there was no data fetching:

| Tab | Fields |
|---|---|
| Water | `isPumpOn: boolean`, `flowRate`, `humidity`, `temperature`, `rainFall`, `soilMoisture` |
| Electricity | `temperature`, `lightIntensity`, `conductivity`, `battery` |
| Fertilizer | `soilMoisture`, `phLevel`, `humidity`, `isFertilizerOn: boolean` |

Toggles only flipped a local boolean.

## 5. Endpoints (before)

| Method | Path | Body |
|---|---|---|
| POST | `{apiURL}login` | `{ email, password }` → `{ success }` |
| POST | `{apiURL}adduser` | `{ email, password, first_name, last_name }` |

## 6. Sensitive findings (before)

| # | Severity | Location | Finding |
|---|---|---|---|
| 1 | High | `src/environments/environment.ts` | API base URL was a hard-coded **public IPv4 address over plain HTTP** (port 5000) — leaks infrastructure, mixed content, credentials sent unencrypted. |
| 2 | High | `services/auth.service.ts` → `setLoggedIn()` | Always wrote `'true'` to storage regardless of the argument, so a **failed login still marked the user as logged in**. |
| 3 | High | `guards/auth.guard.ts` + `localStorage['loggedIn']` | The guard only read a boolean flag; anyone could set it in DevTools — **trivial bypass**, no expiry, no role. |
| 4 | Medium | `components/footer/footer.component.html` | Original author's **personal e-mail** (`mailto:`) and **personal social-network profile** link. |
| 5 | Medium | `src/index.html` | Open Graph / Twitter meta tags pointed to the original author's **hosting-vendor deployment URL**; previous product branding everywhere (title, description, logos, `package.json` name, `angular.json` project name, Docker image/container names, README). |
| 6 | Medium | `src/main.ts`, `package.json` | **Third-party analytics** and speed-insight scripts injected on every page (tracking, outbound requests). |
| 7 | Low | `angular.json` | No CSP; production source-map policy not explicit; `nginx.conf` sent no security headers. |
| 8 | Low | `components/register/*` | Rendered raw server error arrays to the user; open self-registration. |
| 9 | Info | `package.json` | Angular 17 CLI does not support Node 24 (workspace runtime). |

---

## 7. Transformation

The project is now **AgriSense**, a standalone smart-farm demo (landing page plus sensor console) that runs only on mock data.

### 7.1 Platform

| Before | After |
|---|---|
| Angular 17, TS 5.2, zone.js 0.14 | Angular **19.2**, TS ~5.6, zone.js ~0.15 (works with the Node 24 / npm 11 workspace runtime) |
| Tailwind 3 with a lime / forest-green / orange theme | Tailwind 3 + `tailwindcss-primeui`, **PrimeNG 19** + `@primeng/themes` (custom Aura preset: teal/cyan primary, amber accent, deep-slate dark mode), PrimeIcons, Chart.js via `p-chart` |
| Two hosting-vendor analytics packages | Removed, so the app makes no third-party requests |
| `moduleResolution: node` | `bundler` |

### 7.2 Traces removed

- Public IP API URL: the `environments/` folder is deleted and there is no remote API.
- Author e-mail and social profile links: the old footer is deleted. The new footer has only in-page anchors.
- Hosting-vendor URLs in meta tags: replaced with relative URLs to the new `assets/images/meta.png`.
- Previous brand name, logos, favicon and meta image: replaced everywhere (package name `agrisense`, Angular project `agrisense`, output `dist/agrisense`, Docker image/container `agrisense`, title, meta, README rewritten). New SVG logo (`src/assets/images/logo.svg`, `logo-mark.svg`), `public/favicon.svg`, `favicon.png`, `apple-touch-icon.png` and a generated 1200×630 `meta.png`.
- Old decorative SVGs, branded photos and an unused commercial font are deleted. Two neutral stock photos are kept and renamed (`field-scout.webp`, `seedling.webp`).
- Verification: the agreed trace-pattern grep (former employer, IP prefix, author surname, social network, hosting vendor, old brand) returns **no hits** outside `node_modules`, `dist` and `.angular`. The only build-output hit is the third-party PrimeIcons font, which ships a social-network brand glyph; that glyph is not used.

### 7.3 Mock data & backend

- `scripts/generate-mock-data.mjs` (`npm run gen:mock`) writes `src/assets/mock/`:
  - `farms.json`: 2 farms and 4 fields.
  - `sensors-{water,electricity,fertilizer}.json`: 192 hourly points per field, stored column-wise.
  - `devices.json`: 4 pumps and 4 dosers.
  - `alerts.json`: 14 alerts.
- `core/data/mock-backend.interceptor.ts` (`HttpInterceptorFn`, prefix `/mock-api`):
  - It answers every request from those files and returns **401** without a valid session.
  - **Write rules:** every write (non-GET) returns **403** for the viewer role. Input (ids, body shape) is validated (400/404).
  - **Device and alert changes:** `PATCH /devices/:id {on}` and `PATCH /alerts/:id {acknowledged:true}` are kept only in memory.
  - **Sensor time ranges:** sensor series are re-anchored so they cover the **last 7 days, hourly, ending at the current hour**.
- `core/data/data.service.ts` is the dashboard's only data entry point. It also holds the selected field, saved in localStorage as a convenience.

### 7.4 Auth

- Registration is removed. `/register` redirects to `/login`, which says: "No self-registration … contact your farm administrator".
- There are exactly two accounts, `admin` and `viewer`, with random 14-character passwords generated by `scripts/generate-credentials.mjs` using node `crypto.randomInt`.
- The source contains only **salted PBKDF2-SHA256 (310,000 iterations, 16-byte salt, 32-byte key)** hashes, in `src/app/core/auth/auth.config.ts`.
- Passwords are verified with **WebCrypto** `deriveBits`, using a constant-time compare. Unknown usernames still run the key derivation, so login time does not reveal which usernames exist. After 5 failed attempts, sign-in is locked for 30 seconds.
- The session is stored in **sessionStorage** with username, role, issuedAt and expiresAt (2-hour lifetime). It is re-validated on every read: the account must be known, the role must match the account, and the session must be unexpired with a lifetime no longer than 2 hours.
- `authGuard` (`canActivate` + `canActivateChild`) requires a valid session. `guestGuard` keeps signed-in users away from `/login`. `returnUrl` only accepts `/app…` paths, which prevents open redirects.
- **Bugs fixed:** a failed login no longer logs the user in. Setting a flag in storage no longer bypasses the login.
- **Viewer restrictions:** for the viewer, device toggles and the "Acknowledge" button are disabled, and the mock backend refuses writes with 403.
- Plaintext credentials are only in the git-ignored `CREDENTIALS.md`. `.gitignore` covers `node_modules/`, `dist/`, `.angular/` and `CREDENTIALS.md`.

### 7.5 UI (fully redesigned)

- **Landing** (`features/landing`): dark grid hero with a product preview built from markup, stats strip, bento layout of platform tiles, 4-step "how it works", sensor families, FAQ (`p-accordion`), CTA band, minimal footer, and a light/dark toggle.
- **Login**: split screen with a brand panel and the form (`pInputText`, `p-password` with toggle mask, `p-message`).
- **Console shell** (`layout/shell`): dark slate sidebar with an alert count badge and an account card showing the role, a drawer on mobile, a sticky top bar with a grouped field selector (`p-select`), a "last updated" indicator and a theme toggle, plus toasts.
- **Pages.** Each page has one job and mixes widget types:

  | Page | Contents |
  |---|---|
  | Overview | KPI tiles, 7-day moisture/humidity `p-chart`, device toggles (`p-toggleswitch`), gauges (`p-knob`), latest alerts |
  | Irrigation | Moisture vs pump-flow chart, daily rainfall bars, pump control, irrigation log table |
  | Energy & climate | Battery and irradiance gauges, solar charging cycle, enclosure temperature, conductivity bars |
  | Nutrients | pH chart with target band, doser control, hour-by-day doser heat grid |
  | Alerts | Summary bar, filter bar (search, severity, open/all, field scope), sortable and paginated `p-table`, acknowledge action (admin only) |
- **Shared components:**
  - `app-panel` handles loading, error-with-retry and empty states for every widget.
  - The other shared components are `app-kpi-tile`, `app-device-controls`, `app-severity-tag` and `app-logo`.
  - Charts take their colours from CSS tokens and switch with the theme.

### 7.6 Security hardening

- A **CSP** meta tag in `index.html`: `default-src 'self'`, `script-src 'self'`, no third-party origins, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`. Critical-CSS inlining is turned off so that no inline `onload` handler is needed.
- **No third-party requests:** fonts (Mona Sans woff2) and icons are self-hosted, and the analytics packages are removed.
- **No `innerHTML`, `bypassSecurityTrust*` or `eval`.** All data is rendered through Angular bindings. HTTP errors are mapped to generic messages, and raw server bodies are never shown.
- **Production build:** `sourceMap: false`, `namedChunks: false`, license extraction, hashed output.
- **`nginx.conf`:**
  - Headers: CSP including `frame-ancestors 'none'`, `X-Content-Type-Options`, `X-Frame-Options DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP and CORP. HSTS is ready to enable for HTTPS.
  - `server_tokens off`, and `.map` files and dotfiles are denied.
  - Caching: hashed assets are cached long-term, while `index.html` and the mock data are not cached.
- **Docker:** `docker-compose.yml` runs the container read-only with tmpfs mounts and `no-new-privileges`. The Dockerfile builds with `node:22-alpine`, and `.dockerignore` excludes `CREDENTIALS.md` and `scripts/`.
- `robots.txt` disallows `/app/` and `/login`.

### 7.7 Verification

- `npm run build`: succeeds with no warnings. The initial bundle is about 508 kB raw (about 123 kB transferred), and the feature pages are lazy-loaded.
- The production build was checked headlessly in Chrome:
  - Visiting `/app` without a session redirects to `/login?returnUrl=/app`.
  - A forged session with an invalid lifetime is rejected.
  - A wrong password shows an error and does not sign in.
  - **admin:** signs in, sees data on all pages, and can toggle devices.
  - **viewer:** toggles are disabled.
  - Light, dark and mobile (390 px) layouts render with no console errors.

### 7.8 Known limitations

- This is a **client-side demo access gate**. Anyone with DevTools can read the bundled hashes or write a well-formed session into sessionStorage. There is no backend to enforce access.
- WebCrypto PBKDF2 needs a secure context (`localhost` or HTTPS). Over plain HTTP on another host, login shows a clear message instead.
- `@primeng/themes@19` is marked deprecated upstream in favour of `@primeuix/themes`. It still works with PrimeNG 19 and is used here as requested.
