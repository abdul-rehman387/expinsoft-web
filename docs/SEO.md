# SEO system

How search-engine metadata, prerendering, sitemaps and monitoring work on aeseller.com.

## How it works

| Piece | File | What it does |
|---|---|---|
| Route table | `src/seo/routes.js` | One entry per public URL: title, description, breadcrumb, Service name, `noindex`, `updated`. Single source of truth. |
| Site constants | `src/seo/site.js` | Domain, org name, emails, logo, `SAME_AS` profiles. Only verified facts. |
| Head builder | `src/seo/head.js` | Turns a route into title/meta/canonical/OG/Twitter tags and JSON-LD (Organization, WebSite, BreadcrumbList, Service, BlogPosting). |
| Client sync | `src/components/SeoManager.jsx` | Updates `<head>` on client-side navigation. |
| SSR entry | `src/entry-server.jsx` | Renders the app with `StaticRouter` at build time. |
| Prerender | `scripts/prerender.mjs` | Writes `dist/<route>.html` (real content + head), `404.html`, `sitemap.xml`, `robots.txt`. |
| Hosting | `firebase.json`, `.firebaserc` | Firebase Hosting: clean URLs, no trailing slash, real 404s, 301s for legacy equivalents. |

`npm run build` = client build -> SSR build -> prerender. The browser hydrates the prerendered HTML (`src/main.jsx`).

## Adding or changing a page

1. Add the `<Route>` in `src/App.jsx`.
2. Add an entry in `src/seo/routes.js` (unique title <= 60 chars, unique description 120-160 chars, `crumbs` matching the visible breadcrumb, `service` only if it is a real service).
3. When content changes meaningfully, set `updated: 'YYYY-MM-DD'` (becomes `<lastmod>`). Never guess dates.
4. `npm run build && npm run test:seo` must pass.

Components must not read `window`/`document` during render (only in effects) or prerendering will fail. Pages whose output depends on the URL query (e.g. `/checkout`) use `prerender: false`.

## Commands

| Command | Purpose |
|---|---|
| `npm run build` | Build + prerender + sitemap/robots |
| `npm run test:seo` | Static checks on `dist/`: titles, descriptions, canonicals, one H1, JSON-LD, OG tags, alt text, internal links, sitemap/noindex consistency |
| `npm run check` | lint + build + test:seo |
| `node scripts/seo-live-check.mjs [url]` | Crawl a live/preview deployment: status codes, redirects, legacy 404s, robots/sitemap content types |
| `GSC_CREDENTIALS=key.json node scripts/gsc-report.mjs [--inspect]` | Search Console report (needs owner setup below) |

`.github/workflows/seo-monitor.yml` runs the build checks on every PR and the live check weekly (read-only).

## Legacy URLs

The domain previously hosted a WooCommerce store and an unrelated blog (~570 URLs in the Wayback Machine). `firebase.json` 301-redirects the few with a real equivalent (`/about-us`, `/contact-2`, `/privacy-policy(-2)`, `/terms-and-conditions`, `/blog`, `/brand/ae-seller` -> `/about`). Everything else returns 404 from `404.html` (Firebase Hosting cannot send 410; Google treats 404 the same in practice). Never redirect obsolete URLs to the homepage.

## Hosting: Firebase (project `ae-seler`, free Spark plan)

Spark limits: 10 GB storage, ~360 MB/day transfer. The site is ~47 MB; the heaviest page is /portfolio (~8 MB of PNGs), so compress those images to stay well inside the daily limit.

**One-time GitHub deploy setup** (lets the workflows deploy):
1. `npx firebase-tools login`
2. `npx firebase-tools init hosting:github` in this repo - choose `abdul-rehman387/aeseller`. It creates a service account and stores it as a GitHub secret; make sure the secret is named `FIREBASE_SERVICE_ACCOUNT_AE_SELER` (the name the workflows use) and **decline** its offer to overwrite the existing workflow files and `firebase.json`.
3. Every PR now gets a preview URL (`ae-seler--pr...web.app`); every merge to `main` deploys to live (`ae-seler.web.app`).

Manual deploy instead: `npm run build && npx firebase-tools deploy --only hosting`.

**Custom domain from Hostinger** (only after the live `ae-seler.web.app` looks right):
1. Firebase console > Hosting > **Add custom domain** > `aeseller.com`.
2. Copy the TXT record and A record(s) Firebase shows. In Hostinger hPanel > Domains > DNS / Nameservers > DNS records: **delete** the old `@` A record (216.198.79.1, Vercel) and any `@` AAAA record, then add Firebase's TXT and A records exactly as shown.
3. Add `www.aeseller.com` as a second custom domain, choose **Redirect to aeseller.com**, and add the record Firebase shows for `www` (replace the existing www CNAME).
4. DNS + SSL usually take from minutes up to 24 hours. Then run `node scripts/seo-live-check.mjs` - all checks should pass - and submit `https://aeseller.com/sitemap.xml` in Search Console.
5. Disconnect the old Vercel project (Vercel > Project > Settings > Git > Disconnect, then delete the project) so it stops commenting on PRs.

### Status 2026-10-18 and the remaining www fix

Production is on Firebase (`aeseller.com` -> 199.36.158.100, TXT `hosting-site=ae-seler`). The live crawl (`node scripts/seo-live-check.mjs`) passes 78/79: everything except **www**. `www.aeseller.com` is a CNAME to the apex, so it reaches Firebase, but it is not registered as a custom domain on the site - Firebase has no certificate for it (browsers get `ERR_CERT_COMMON_NAME_INVALID`; `http://www` 301s to that broken `https://www`). `firebase.json` cannot redirect by hostname, so this is fixed in the console only:

1. Firebase console > Hosting > site `ae-seler` > **Add custom domain** > `www.aeseller.com`.
2. Tick **Redirect www.aeseller.com to an existing website** and choose `aeseller.com`.
3. Add the DNS record(s) Firebase shows in Hostinger hPanel > DNS (it may ask you to replace the current `www` CNAME with its own record). Wait for "Connected" and the certificate (minutes to 24 h).
4. Verify: `curl -I https://www.aeseller.com/some/path?x=1` -> `301` with `Location: https://aeseller.com/some/path?x=1` (path and query preserved, single hop); `http://www` -> one hop to `https://www`, then one to the apex. Then `node scripts/seo-live-check.mjs` should pass 79/79.

## Search Console API setup (owner)

1. Verify a **Domain property** `aeseller.com` in Search Console via DNS TXT record (covers http/https/www).
2. Google Cloud console: create a project, enable **Google Search Console API**, create a **service account**, download its JSON key. Keep the key out of git (`gsc-service-account*.json` is ignored).
3. Search Console > Settings > Users and permissions: add the service-account email with **Restricted** (read) permission.
4. Run the report command above. Do not use the Google Indexing API for these pages - it only supports JobPosting/BroadcastEvent content.

## Rollback

All changes are build-time. To revert prerendering only: set `"build": "vite build"` in `package.json` and restore the catch-all rewrite `{ "source": "**", "destination": "/index.html" }` in `firebase.json` (this also restores the soft-404 problem).

## Changelog - 2026-10-18 SEO implementation

**Added**
- `src/seo/site.js`, `src/seo/routes.js`, `src/seo/head.js` - centralized metadata + JSON-LD for 58 indexable URLs.
- `src/components/SeoManager.jsx` - client head sync.
- `src/pages/NotFound.jsx` + catch-all route - real 404 page (noindex).
- `src/entry-server.jsx`, `scripts/prerender.mjs` - static HTML per route, `404.html`, `sitemap.xml`, `robots.txt`.
- `src/lib/firebase.js` - Firebase app initialization (project `ae-seler`); `firebase` npm package.
- `scripts/seo-check.mjs`, `scripts/seo-live-check.mjs`, `scripts/gsc-report.mjs`, `.github/workflows/seo-monitor.yml`.

**Changed**
- `index.html` - static title/description replaced by `<!--seo-head-->` placeholder filled per route.
- `src/main.jsx` - hydrate prerendered HTML.
- `src/App.jsx` - `AppRoutes` split out for SSR; `SeoManager`; 404 route; Checkout lazy-loaded (Stripe/PayPal no longer load on every page).
- `src/pages/Home.jsx` - hero eyebrow/H1/lead and services H2 repositioned to "software development company"; blog cards link to their articles; privacy link fixed.
- `src/pages/BlogArticle.jsx` - unknown slug renders the shared 404 page.
- 45 "Book a Free Consultation"/"Start Your Project" CTAs across pages, footer and MobileApp now go to `/contact` (were `/`).
- `src/pages/Checkout.jsx` - Terms link fixed (`href="#"`).
- `Header.jsx`, `Footer.jsx` - logo alt "AE Seller Center" -> "AE Seller".
- `public/portfolio/*/*.html` (6 demo bundles) - `noindex` meta added.
- `firebase.json`, `.firebaserc`, Firebase workflows - hosting moved from Vercel to Firebase project `ae-seler`; cleanUrls, no trailing slash, removed catch-all rewrite, legacy 301s, asset caching. `vercel.json` removed.
- `package.json` - build pipeline, `test:seo`, `check` scripts. `.gitignore` - GSC keys and reports.

## Changelog - 2026-10-18 (round 2: on-page, images, performance)

Measured against the live Firebase site and a local A/B of the previous commit; see the report for numbers.

- **Headings:** footer column titles h4 -> h3 (all pages); sidebar/contact form titles h3 -> h2 (`.form-title`); About "Our Mission" h3 -> h2; homepage AI list h4 -> h3; sitemap columns h4 -> h2. CSS selectors extended so rendering is pixel-identical (verified by screenshot diff). `npm run test:seo` now fails on any skipped heading level.
- **H1 / title alignment:** /insights, /technologies, /portfolio (removed the unverified "800+ Projects" claim, which also contradicted the page's own "110+" stat), /about. Titles for /saas-development, /aws-solutions, /contact now match page copy.
- **Internal redirects:** 5 portfolio demo links pointed at `.html` URLs that Firebase 301s; now link to the clean URL. Test now fails on `.html` or trailing-slash internal links.
- **Images:** 10 portfolio mockups converted to WebP 1200w/640w with `srcset`, intrinsic `width`/`height` and specific alt text written from the actual images (9.3 MB of originals -> 0.47 MB at 1200w; originals kept). 57 decorative/redundant images now use `alt=""` (stock photos labelled "Team"/"AE Seller team", thumbnails repeating the adjacent heading). Unsplash URLs get `auto=format` (AVIF/WebP; hero 67 KB -> 17 KB). Logos get intrinsic dimensions.
- **Fonts:** self-hosted latin WOFF2 (Poppins 400-800, Inter variable) in `public/fonts`, `@font-face` in `src/index.css`, 3 preloads; removed the render-blocking Google Fonts stylesheet and unused weight 900.
- **Caching:** 30-day cache for images, 1-year for `/fonts`, immutable `/assets` kept (rule order matters in `firebase.json`).
- **GA4:** `src/lib/analytics.js` - inert unless `VITE_GA_MEASUREMENT_ID` is set; `generate_lead` fired by all four forms.
- **Lint:** fixed the 3 pre-existing errors (Header effect, PayPal constant moved to `src/lib/paypal.js`, unused Stripe prop); Firebase-generated `functions/` and `src/dataconnect-generated/` excluded from root lint. CI now runs lint and uploads `seo-reports/`.
- **QC:** `npm run test:seo` writes `seo-reports/seo-check.json` + `.md` (per-page words, headings, images, JSON-LD types); new checks for heading order, prerendered word count, missing alt attributes, redirecting internal links and legacy URLs in the sitemap.
