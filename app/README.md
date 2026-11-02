# Geldstart

Geldstart is a mobile-first learning app about money and investing for young people aged roughly 16–20. The interface and all content are in German.

Learning flow: **Lernen → Verstehen → Ausprobieren → Wissen prüfen → Fortschritt sehen**

Main navigation (bottom bar on phones, top bar on larger screens): **Start · Lernen · Depot · Mehr**

- **Start**: learning progress, a "Weiterlernen" action, a compact Übungsdepot summary (or "Starte dein Übungsdepot"), quick access to the calculator, a daily quiz question and an overview of all topics
- **Lernen**: six lessons (Grundlagen, Zinseszins, Anlageklassen, Sparen mit kleinen Beträgen / Kindergeld, Altersvorsorge, Hilfe vom Staat). Each lesson has an introduction, reading time, short sections, an example, an interactive element, a "Merke" summary and a quiz with explanatory feedback. "Anlageklassen" and "Zinseszins" link to the Übungsdepot.
- **Depot**: the virtual practice portfolio ("Übungsdepot", see [below](#übungsdepot-practice-portfolio)) – simulated buying and selling with virtual money
- **Mehr**: tools (Zinseszins-Rechner, Übungsdepot), about the app, disclaimer, market-data notes, privacy and local storage, separate resets for learning progress and portfolio, sources and limitations
- **Rechner** (`/rechner`, a tool linked from Start, the Zinseszins lesson and Mehr): compound-interest calculator

> Nur zu Bildungszwecken – keine Anlageberatung. Alle Käufe und Verkäufe sind Simulationen. Geldanlagen können an Wert verlieren.

## Technology stack

| Area                 | Technology                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Framework            | React 19, [TanStack Start](https://tanstack.com/start) (used as a static site generator: every page is prerendered at build time) |
| Routing              | TanStack Router, file-based routes in `src/routes`                                                                                |
| Build tool           | Vite 8                                                                                                                            |
| Styling              | Tailwind CSS 4 with design tokens in `src/styles.css`, Radix UI (alert dialog), lucide-react icons                                |
| Language             | TypeScript (strict)                                                                                                               |
| Tests                | Vitest, Testing Library, jsdom                                                                                                    |
| Linting / formatting | ESLint 9 (typescript-eslint, react-hooks), Prettier                                                                               |
| Package manager      | Bun (`bun.lock`)                                                                                                                  |
| Persistence          | `localStorage` only (no backend, no accounts); optional separate market-data proxy                                                |

## Prerequisites

- [Bun](https://bun.sh) 1.x (tested with 1.4.4)
- Node.js 22.12 or newer (tested with 24.x). Vite runs on Node, even when started through `bun run`.

No environment variables or secrets are required: without configuration the app runs with the built-in sample data ("Beispieldaten"). All variables are optional – see [Environment variables](#environment-variables).

## Installation

```bash
bun install
```

`bunfig.toml` only installs package versions that have been published for at least 24 hours (supply-chain protection). Remove `minimumReleaseAge` there if you need a version that was released very recently.

## Commands

| Command              | What it does                                                                     |
| -------------------- | -------------------------------------------------------------------------------- |
| `bun run dev`        | Starts the development server at http://localhost:5173 with hot reload           |
| `bun run build`      | Builds the production version and prerenders all pages into `dist/client`        |
| `bun run preview`    | Serves the production build at http://localhost:4173 (run `bun run build` first) |
| `bun run test`       | Runs all unit and component tests once                                           |
| `bun run test:watch` | Runs tests in watch mode                                                         |
| `bun run typecheck`  | TypeScript check (`tsc --noEmit`)                                                |
| `bun run lint`       | ESLint including Prettier formatting rules                                       |
| `bun run format`     | Formats all files with Prettier                                                  |
| `bun run check`      | Typecheck, lint, tests and build in one go                                       |
| `bun run proxy:dev`  | Starts the reference market-data proxy locally (Node ≥ 22.18, see below)         |

## Project structure

```text
src/
  routes/                 Pages (file-based routing)
    index.tsx             Start
    lernen/index.tsx      Topic overview
    lernen/$lessonId.tsx  Lesson page (all lessons share one layout)
    rechner.tsx           Compound-interest calculator
    depot/index.tsx       Übungsdepot: onboarding or overview
    depot/kaufen.tsx      Buy flow (search → amount → preview → confirm)
    depot/verkaufen.tsx   Sell flow
    depot/wertpapier.tsx  Instrument detail (?id=…)
    depot/transaktionen.tsx  All transactions, CSV export
    mehr.tsx              Tools, about, privacy, resets, sources
    $.tsx                 Not-found page for unknown URLs
    __root.tsx            HTML document, meta tags, app shell
  components/
    layout/               App shell, header, bottom and top navigation, brand
    lesson/               Lesson layout, quiz, lesson list, interactive elements
    calculator/           Calculator inputs, chart, result
    depot/                Übungsdepot screens and building blocks
    common/               Shared building blocks (callout, disclaimer, badges, ...)
    ui/                   Button and alert dialog (shadcn/ui-based)
  content/                Typed lesson content, asset classes, government programmes, sources
  config/                 Site texts, navigation, market-data selection
  lib/finance/            Calculation logic (compound interest, inflation, budget)
  lib/progress/           Progress model, localStorage wrapper and store
  lib/depot/              Portfolio engine (pure functions), analysis, CSV, schema/migrations, store
  lib/market-data/        Provider interface, demo provider, HTTP adapter, cache/rate-limit service
  hooks/                  React hooks (progress, hydration, depot, market data)
server/market-data-proxy/ Reference server-side proxy for Twelve Data (not part of the static site)
public/                   Favicons, web app manifest, robots.txt, .nojekyll
```

Lessons are plain typed data (`src/content/lessons/*.ts`), so content changes don't require component changes. Time-sensitive information (Kindergeld, pension reform, government programmes) was checked in **November 2026** (`SITE.contentReviewedAt` in `src/config/site.ts`) and has to be reviewed regularly.

## How the calculator works

- Monthly contributions are paid at the **start** of each month.
- The annual return is converted into an equivalent monthly rate `(1 + r)^(1/12) − 1`, so 100 € at 5 % become exactly 105 € after one year.
- The return is the same every year. Taxes, fees, inflation and market volatility are not included. The app says this next to every result.
- Allowed input: initial amount 0–1,000,000 €, monthly 0–10,000 €, return 0–15 %, duration 0–60 years. Invalid input shows a message, and the result keeps using the last valid value.

The logic lives in `src/lib/finance/compound-interest.ts` and is covered by unit tests.

## Progress and privacy

Progress is stored in the browser under the `localStorage` key `geldstart.progress` (versioned JSON): completed lessons, quiz results from the first attempt, opened lessons, the last opened lesson and the last calculator values. Budget planner entries are not stored. Malformed data or blocked storage (for example in private mode) never crashes the app. In that case progress is only kept in memory. Users can delete it in **Mehr → Lernfortschritt zurücksetzen** after a confirmation; the Übungsdepot is not touched.

The Übungsdepot uses its own key `geldstart.depot` (see [Storage](#storage)). It is reset separately in **Mehr → Übungsdepot zurücksetzen**; learning progress is only deleted as well if the user ticks "Auch Lernfortschritt löschen" (off by default).

The app has no tracking, analytics, cookies or external fonts. In the default demo mode it makes no external API calls at all. With a configured market-data proxy it calls only that proxy, sending search terms and instrument ids – never portfolio data.

## Übungsdepot (practice portfolio)

A virtual portfolio for learning. Everything is simulated: no real orders, no real money, no account.

**Flow**

1. **Onboarding** (4 steps): what a simulation is → starting balance (1.000 / 5.000 / 10.000 €) → risks (fluctuation, diversification, delayed prices, no advice) → name and create.
2. **Overview** (`/depot`): virtual value, gain/loss (€ and %), cash, positions value, unrealised/realised result, data status and last update, "Investieren"/"Verkaufen", one deterministic insight ("Depot analysieren"), position cards, history chart, allocation, weekly report, recent transactions, data source and disclaimer.
3. **Buy** (`/depot/kaufen`): search → amount in € or quantity (fractions down to 0.0001) → preview (price, timestamp, data status, quantity, order value, remaining cash, weight after purchase, risk note) → "Virtuell kaufen" → success with the reflection question "Welches Risiko entsteht, wenn diese Position einen großen Anteil deines Depots bildet?" (optional note, stored locally).
4. **Sell** (`/depot/verkaufen`): choose position → quantity ("Hälfte", "Alles") → preview (quantity, price, proceeds, share of cost basis, realised result, remaining quantity, cash afterwards) → "Virtuell verkaufen" → success with a reflection question. Overselling, short selling and leverage are impossible.
5. **Instrument detail** (`/depot/wertpapier?id=…`): type, symbol, exchange, currency, price with status and timestamp, own position, neutral description and facts, price history (1/6/12 months), actions "Im Übungsdepot testen" / "Virtuell kaufen" / "Virtuell verkaufen" / "Risiko verstehen". No recommendations, ratings or price targets.
6. **Transactions** (`/depot/transaktionen`): full list, newest first, and CSV export (semicolon-separated, German decimals, UTF-8 BOM, spreadsheet-formula protection, column "Simulation").

**Calculation rules** (`src/lib/depot/engine.ts`, pure functions, unit-tested)

- Money is stored as integer **euro cents**, quantities as integer **units of 1/10,000 share**. Value = `round(units × price / 100)` cents.
- Buying by amount uses the largest quantity whose value does not exceed the amount (rounded down to 0.0001 shares). Minimum order 1 €. Orders above the available cash are rejected.
- Average-cost method: repeat purchases add quantity and cost basis; the average purchase price is cost basis ÷ quantity.
- Selling removes the proportional cost basis (a full sale removes all of it, so no rounding residue stays behind). Realised result = proceeds − removed cost basis.
- Total gain = realised + unrealised = total value − starting balance; performance = total gain ÷ starting balance.
- No fees, taxes, spreads or dividends. EUR instruments only (see [Currencies](#currencies)).
- Every order is re-validated against the current portfolio when it is confirmed; a quote must be recent enough (demo: same day, market data: ≤ 15 min) or the user is asked to refresh it.

**History, insight and weekly report** (`src/lib/depot/analysis.ts`)

- The history chart uses only **snapshots recorded by the app** (start, every buy/sell, each quote refresh that touches held positions; one refresh snapshot per day). Nothing before the portfolio was created is ever filled in. With values from fewer than two days it shows "Für diesen Zeitraum gibt es noch nicht genügend Daten." Periods (7 Tage, 30 Tage, Seit Start) only appear when the snapshots cover them.
- The allocation by asset type is always available; by sector only if the data source provides sectors.
- Exactly one rule-based insight is shown (e.g. only cash, missing prices, one stock ≥ 25 %, one sector dominates, many single stocks). The rules are ordered and deterministic; they describe facts and never give advice.
- The weekly report compares the current value with the latest snapshot that is at least seven days old. Without one it says "Noch nicht genügend Daten für einen Wochenbericht." It never invents causes for price moves.

### Storage

`localStorage` key **`geldstart.depot`**, JSON with `version: 1`: portfolio (name, start date, starting balance, cash, positions, up to 2,000 transactions, up to 500 snapshots), the last known quote per instrument and the time of the last refresh. On load the data is validated strictly (`src/lib/depot/schema.ts`): the ledger must be consistent (cash = start − purchases + sales), otherwise the data is discarded with a visible notice instead of showing wrong numbers. Data from a newer app version is shown read-only. Migrations are registered in `MIGRATIONS`. Learning progress (`geldstart.progress`) is completely independent.

## Market data

### Current status

**The app ships in demo mode. No real market data is connected.** All instruments in demo mode are fictional (e.g. "Welt-Aktien-ETF", "Nordwind Energie AG") with deterministic sample prices that change once per weekday (`src/lib/market-data/demo/`). Every screen shows "Beispieldaten – keine aktuellen Marktdaten", every price carries the status badge "Beispieldaten", and the history chart on the detail page is labelled "Beispielverlauf – keine echten Kurse".

Why: the app is a static site on GitHub Pages. A static site cannot keep an API key secret, has no server to cache requests and no scheduled jobs. Calling a vendor directly from the browser would expose the key. In addition, the free tiers that were evaluated do not allow showing data to app users (see below).

### Architecture

```text
UI components ─▶ hooks (use-market-data) ─▶ MarketDataService (cache, in-flight de-duplication, rate-limit cooldown, offline detection)
                                              └─▶ MarketDataProvider
                                                   ├─ demo provider (default, fictional data, in the browser)
                                                   └─ HTTP adapter ─▶ your server-side proxy ─▶ vendor (e.g. Twelve Data)
```

- `MarketDataProvider` (`src/lib/market-data/types.ts`): `searchInstruments`, `getQuote`, `getHistoricalPrices`, `getInstrumentDetails`, `getExchangeRate`. UI components never call a vendor.
- Every quote carries price, currency, timestamp (`asOf`, day or minute precision), the time it was fetched, status (`realtime`, `delayed`, `eod`, `demo`) and provider id. The UI derives `cached` (> 15 min old), `stale` (> 24 h) and `unavailable`.
- Caching in the browser: search 10 min, quotes 60 s, history 1 h, details 24 h. Quotes are refreshed automatically once when the depot opens and they are outdated, otherwise only on "Kurse aktualisieren". **No polling.**
- **No silent fallback**: if the configured provider fails, the app shows the error and the last stored values with their timestamp – it never switches to demo data. A portfolio created with one data source is read-only under another (notice with reset link).

Behaviour when the provider is unavailable:

| Situation                  | What the user sees                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Loading                    | "Kurs wird geladen …" (status region)                                                                                  |
| Rate limit (HTTP 429)      | "Zu viele Anfragen" with wait time; no further requests during the cooldown (`Retry-After`, default 60 s)              |
| Provider error / timeout   | "Datenanbieter nicht erreichbar" + retry; last stored price with timestamp and status "Zwischengespeichert"/"Veraltet" |
| Offline                    | "Du bist offline"; requests are not sent, last values stay visible                                                     |
| Non-EUR instrument         | Shown in search but marked "Nicht unterstützt"; no buy possible                                                        |
| Quote too old for an order | Preview asks to refresh the price; confirm button disabled                                                             |

### Provider evaluation (November 2026)

| Provider      | Free tier                     | Relevant limits                                                                                                                                                                                                                                                                                                         |
| ------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Twelve Data   | Basic: 8 credits/min, 800/day | Basic = US markets only and "internal non-display usage only". EOD global + internal display from Grow; **external display (showing data to app users) requires Business plans** (from about 149 $/month). Real-time EU data from Pro. Good API: search with MIC codes, quotes with `is_market_open`, timestamps, CORS. |
| Alpha Vantage | 25 requests/day               | Realtime/15-min delayed US data only on premium plans; `GLOBAL_QUOTE` gives only the trading day, no timestamp; no CORS.                                                                                                                                                                                                |

Twelve Data was chosen for the reference proxy because its API provides everything the contract needs (exchange-specific ids, timestamps, open/closed status, EUR listings such as `SAP:XETR`). **Before connecting it publicly you need a plan that permits external display for the exchanges you show.** Check the current terms yourself; this README is not legal advice.

### Connecting real data (optional)

1. Deploy the proxy (`server/market-data-proxy/`), e.g. as a Cloudflare Worker:
   ```bash
   npx wrangler secret put TWELVE_DATA_API_KEY
   npx wrangler deploy server/market-data-proxy/worker.ts --name geldstart-kurse \
     --var ALLOWED_ORIGINS:https://<user>.github.io
   ```
   Locally: `TWELVE_DATA_API_KEY=… ALLOWED_ORIGINS=http://localhost:5173 bun run proxy:dev` (port 8787).
2. Build the app with `VITE_MARKET_DATA_API_URL=https://<your-proxy>` (and optionally `VITE_MARKET_DATA_PROVIDER_NAME`, `VITE_MARKET_DATA_PROVIDER_URL`). For GitHub Pages, create repository **variables** (not secrets) `MARKET_DATA_API_URL`, `MARKET_DATA_PROVIDER_NAME`, `MARKET_DATA_PROVIDER_URL`.
3. Existing demo portfolios become read-only; users can reset them under Mehr.

Proxy contract (`/v1/search?q=`, `/v1/quote?id=`, `/v1/history?id=&range=1M|6M|1J`, `/v1/instrument?id=`, `/v1/fx?from=&to=`) is documented in `src/lib/market-data/http-provider.ts`. Any other vendor can be connected by implementing the same contract.

What the reference proxy does: key only as a server secret and sent in the `Authorization` header (never in URLs or responses), strict input validation (`SYMBOL:MIC` ids), CORS allow-list (`ALLOWED_ORIGINS`, other origins get 403), in-memory caching (quotes 60 s, search 1 h, history 6 h, details 24 h), its own upstream budget (`UPSTREAM_CALLS_PER_MINUTE`, default 8) plus a 60 s pause after a vendor 429, vendor error messages are not forwarded, unsupported plan/exchange → 422 "unsupported". Status mapping: market closed → `eod`; market open → `delayed`, or `realtime` only if `OPEN_MARKET_STATUS=realtime` is set because your plan really delivers real-time data. Daily history excludes today's unfinished bar.

### Environment variables

| Variable                         | Where      | Secret?                                | Purpose                                                                                                             |
| -------------------------------- | ---------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `BASE_PATH`                      | app build  | no                                     | Sub-path, e.g. `/my-repo/`                                                                                          |
| `VITE_MARKET_DATA_API_URL`       | app build  | **no** (public, ends up in the bundle) | URL of your proxy. Empty = demo mode. URLs containing `apikey`/`token`/`key` parameters are rejected at build time. |
| `VITE_MARKET_DATA_PROVIDER_NAME` | app build  | no                                     | Name shown as "Datenquelle"                                                                                         |
| `VITE_MARKET_DATA_PROVIDER_URL`  | app build  | no                                     | Link to the provider                                                                                                |
| `TWELVE_DATA_API_KEY`            | proxy only | **yes**                                | Vendor key. Platform secret / `.dev.vars`, never in the repo or a `VITE_` variable                                  |
| `ALLOWED_ORIGINS`                | proxy only | no                                     | Comma-separated allowed origins                                                                                     |
| `OPEN_MARKET_STATUS`             | proxy only | no                                     | `delayed` (default) or `realtime`                                                                                   |
| `UPSTREAM_CALLS_PER_MINUTE`      | proxy only | no                                     | Upstream budget, default 8                                                                                          |

### Currencies

The portfolio is kept in EUR. Only instruments that are quoted in EUR can be bought; others appear in search as "Nicht unterstützt". A currency conversion would need a reliable exchange rate with timestamp for every valuation and is not implemented (the contract already contains `/v1/fx`).

## Deployment

`bun run build` creates a fully static site in **`dist/client`**:

- one prerendered HTML file per page (`index.html`, `lernen/index.html`, `lernen/grundlagen/index.html`, …, `rechner/index.html`, `depot/index.html`, `depot/kaufen/index.html`, …, `mehr/index.html`). Depot pages are rendered as a skeleton and filled in the browser from `localStorage`.
- `404.html`: an app shell that static hosts serve for unknown URLs. The client-side router then shows the "Seite nicht gefunden" page.
- hashed assets in `assets/`, plus favicons and `manifest.webmanifest`

Upload `dist/client` to any static host. You don't need a server or rewrite rules. The optional market-data proxy is deployed separately (see [Connecting real data](#connecting-real-data-optional)).

### Base path

By default the app expects to be served from the domain root (`/`). If it's served from a sub-path, set `BASE_PATH` at build time:

```bash
BASE_PATH=/my-repo/ bun run build
```

All asset URLs and internal links then use this prefix. You can also put `BASE_PATH` into a `.env` file (see `.env.example`). The repository name isn't hard-coded anywhere.

### GitHub Pages

`.github/workflows/deploy-pages.yml` builds, tests and deploys the app on every push to `main`:

1. In the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
2. Push to `main` (or start the workflow manually).

The workflow sets `BASE_PATH=/<repository-name>/` automatically. For a user/organisation site (`<name>.github.io`) or a custom domain, create the repository variable `BASE_PATH` with the value `/`. Without the repository variable `MARKET_DATA_API_URL` the deployed app runs in demo mode.

Direct links and page reloads work because every page exists as `…/index.html`. GitHub Pages redirects `/lernen` to `/lernen/`, and unknown URLs get the `404.html` shell. `public/.nojekyll` stops GitHub Pages from processing the files with Jekyll.

## Limitations

- **No real market data is connected.** The Übungsdepot runs with fictional sample data. Connecting real data needs the separately hosted proxy and a vendor plan that allows showing data to users.
- The Übungsdepot ignores fees, taxes, spreads, dividends, corporate actions and order execution; it supports EUR instruments only.
- Portfolio history exists only from the creation of the portfolio and only at moments when the app was used (no background updates).
- With real data, quotes are delayed or closing prices depending on the plan, and can differ from executable prices.
- The content is simplified and intended for education. It's not financial advice.
- Government programmes, amounts and laws reflect the status of November 2026 and can change.
- Calculator results are examples with a constant return. Taxes, fees and inflation aren't included.
- Progress is stored per browser and device only. There's no sync and no account.
- No offline mode (no service worker). The web app manifest only enables "Add to Home Screen".
- Light mode only.

## Extension points

- **Navigation**: `src/config/navigation.ts` holds the four main destinations. Tools such as `/rechner` are listed in `alsoActiveFor` of "Mehr".
- **Market data**: implement `MarketDataProvider` or serve the HTTP contract from another proxy. Supported currencies: `SUPPORTED_CURRENCIES` in `src/config/market-data.ts`.
- **Depot data**: new stored fields need `DEPOT_VERSION + 1` and a migration in `MIGRATIONS` (`src/lib/depot/schema.ts`).
- **Progress**: `src/lib/progress/` is independent from the UI. New stored data needs a new `PROGRESS_VERSION` and a migration in `parseProgress`.
- **Lessons**: add a typed lesson file in `src/content/lessons/`, register its id in `LESSON_IDS` (`src/content/types.ts`) and in `src/content/lessons/index.ts`. Interactive elements are registered in `src/components/lesson/interactive/index.tsx`.
- **UI components**: `components.json` is the shadcn/ui configuration, so more components can be added with the shadcn CLI.
