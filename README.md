# HistoryOut

**Find your way back.** Revisit useful pages, resume a saved view and export the browser history that matters. Free, local and account-free.

This repository contains the **2.0.0 release candidate** on `codex/historyout-v2`, the website and launch material. The existing Chrome Web Store release is **1.0.1**. No store publication or production website/DNS cutover has been performed as part of this branch.

## What v2 adds

- Today and Yesterday recaps with visit, page and site counts.
- A clickable recent trail, title/URL search and website filtering.
- Named local saved views for range, filter and export settings.
- Preview before export, latest matching visit per URL, and optional URL query/fragment removal.
- CSV, JSON and HTML with chosen columns, including opt-in Domain and Unix-millisecond Timestamp.
- Safer serialization, corrected date-range retrieval, progress, cancellation and explicit errors.
- A new visual identity and a full-page fallback for browsers without side-panel support.

History is read only when the user chooses Preview or export. Saved views store settings, not a history archive. The recap covers the loaded date range; the ready count covers matching export rows. Preview displays up to 100 rows, while export includes all matches from that loaded result. Refresh reads new visits.

HistoryOut cannot recover deleted history, guarantee older account records or measure time spent. URL cleanup is not anonymization. Existing valid v1 export preferences and column choices are preserved; new columns are opt-in.

## Permissions and packages

| Package | Permissions | Interface |
| --- | --- | --- |
| Chrome, Edge, Brave | `history`, `storage`, `sidePanel` | Side panel with a full-page fallback |
| Generic Chromium | `history`, `storage` | Full-page workspace |

The first three retain the v1 permission baseline. The generic package removes `sidePanel` and its manifest configuration. Opening the extension's own page does not require the `tabs` permission. No package adds host access, content scripts or another permission.

Prepared packages are not browser certifications or published store listings. See [browser compatibility](./launch/browser-compatibility.md).

## Develop and verify

Use Node.js, npm and a desktop Chromium browser. Packaging also uses the system `zip` and `unzip` commands.

```sh
npm ci
npm run typecheck
npm test
npm run build
```

For development, `npm run dev` watches source changes. Load `extension-unpacked/` from the browser's Extensions page with Developer mode enabled. Use a dedicated test profile so development does not touch the user's normal browsing history.

```sh
npx playwright install chromium
npm run test:browser
npm run pack
```

Browser QA uses Playwright and a disposable Chromium profile. It exercises both a synthetic API fixture and actual Manifest V3 history/storage/download behavior. The completion record is [browser-results.json](./launch/qa/browser-results.json). A passing automated run does not replace toolbar and store-signed checks in each named browser.

`npm run pack` builds and creates four root-manifest ZIPs under `releases/`: `historyout-2.0.0-chrome.zip`, `historyout-2.0.0-edge.zip`, `historyout-2.0.0-brave.zip` and `historyout-2.0.0-chromium.zip`. It excludes source maps and demo/fixture files. Current hashes are recorded in [packages.json](./launch/qa/packages.json). Release artifacts are ignored by Git; regenerate them from the reviewed source and refresh hashes after changes.

## Website

`website/` contains a static Node build with 11 prerendered pages and Sites configuration in `website/.openai/hosting.json`.

```sh
npm --prefix website run build
npm --prefix website test
npm --prefix website run dev
```

The local preview runs at [127.0.0.1:8766](http://127.0.0.1:8766). Default builds are preview builds with `noindex,nofollow` metadata and blocked robots crawling. Production output requires `RELEASE_V2=true` and an explicit `SITE_ORIGIN`; these flags do not deploy or change DNS. Hardcoded candidate notes also need review before public launch. Follow the [website migration handoff](./launch/migration/website.md).

## Repository guide

| Path | Purpose |
| --- | --- |
| `src/` | React/TypeScript extension UI and services |
| `extension-unpacked/` | Manifest, background script, local assets and compiled extension |
| `tests/`, `scripts/` | Core tests, browser QA and packaging |
| `website/` | Static website source, build and Sites configuration |
| `launch/` | Research, brand, store copy, video script, assets and release evidence |

The v2 icons replace the v1 icons in this branch. All new promotional visuals use the new identity; existing imagery is not reused. The v1 source is preserved at baseline `0272441`.

Before publishing, use the [release checklist](./launch/release-checklist.md), [store listing](./launch/store-listing.md), [brand guide](./launch/brand.md) and [GTM plan](./launch/gtm-plan.md). Keep product claims tied to actual behavior and browser evidence. Do not use em dashes in product copy, documentation or launch assets.
