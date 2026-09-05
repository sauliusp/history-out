# Browser compatibility

HistoryOut **2.0.0 release candidate**, checked 5 September 2026. The brand is browser-neutral; browser support claims follow evidence. Packaging a build does not certify it or publish it in a browser store.

## Prepared packages

Run `npm run pack` to create these four ZIPs. Each contains a root manifest and production extension assets, excluding source maps and demo fixtures.

| ZIP under `releases/` | Permissions | Expected interface | Distribution status |
| --- | --- | --- | --- |
| `historyout-2.0.0-chrome.zip` | `history`, `storage`, `sidePanel` | Side panel; own-page fallback if setup is unavailable/fails | Candidate for existing Chrome Web Store item; v2 unpublished |
| `historyout-2.0.0-edge.zip` | Same three | Edge sidebar where supported; own-page fallback | Package prepared; no Edge Add-ons listing claimed |
| `historyout-2.0.0-brave.zip` | Same three | Side panel where supported; own-page fallback | Package prepared; browser verification pending |
| `historyout-2.0.0-chromium.zip` | `history`, `storage` | Own extension page from toolbar | Generic compatibility candidate; no universal support claim |

The generic manifest removes both `sidePanel` and `side_panel`. The background script checks the manifest before using the side-panel API, so an API exposed by the browser cannot override the intended generic full-page mode. Creating the extension's own tab does not require the `tabs` permission. No package adds host permissions or content scripts.

## What is actually tested

[browser-results.json](./qa/browser-results.json), completed `2026-09-05T08:01:36.994Z`, records:

- Fixture UI tests for explicit history reads, filters, unique-URL mode, URL cleanup, CSV output, saved-view behavior, empty/invalid/error/cancel states and responsive widths.
- Actual Manifest V3 installation in a disposable Playwright Chromium 149 profile, available history retrieval, saved v1 settings and a real JSON download.

The actual API test opens the extension page directly. It does not establish toolbar/sidebar interaction, an installed Chrome Web Store signature or a real store update. The separate [Microsoft Edge headless smoke log](./qa/edge-api-smoke.json) records worker 2.0.0 loading, side-panel configuration returning `openPanelOnActionClick: true`, and a successful history query.

| Browser/surface | Evidence status | Remaining checks |
| --- | --- | --- |
| Automated Chromium 149 extension page | Passed recorded actual-API scenario | Record final commit, exact full browser version and OS |
| Chrome desktop toolbar/side panel | Prepared; no complete manual record here | Open/close, restart, update from store-signed v1, all export formats |
| Edge desktop | Isolated headless API smoke passed | Visible sidebar/toolbar, store-signed install/update, restart and all downloads |
| Brave desktop | Prepared; not manually certified here | Install, correct panel/fallback surface, restart and exports |
| Generic package | Manifest guard covered by core tests | Real browser toolbar opening, generic manifest accepted, history and files work |
| Other Chromium browsers | Untested candidates | Full workflow on each browser before naming it supported |
| Firefox, Safari and mobile | Outside this package's scope | Separate implementation and verification required |

For each manual pass, record browser/version, OS, package hash, install route, date and result. Use an isolated profile with synthetic history. Check Today/Yesterday, custom dates, saved view followed by Preview, search/site filters, link opening, CSV/JSON/HTML files, no-results/errors and persistence after restart. Check both 320-pixel side-panel width and the generic full-page layout where relevant.

## Platform sources

Microsoft documents Chromium extension reuse and API differences, plus Edge's `chrome.sidePanel` implementation. Brave documents Chrome Web Store extension installation. These facts support targeting the browsers but do not replace HistoryOut testing. [Microsoft compatibility](https://learn.microsoft.com/en-us/microsoft-edge/extensions/), [Edge sidebar](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/sidebar), [Brave extensions](https://support.brave.app/hc/en-us/articles/360017909112-How-can-I-add-extensions-to-Brave).

Use “prepared for” while checks are pending. Do not use “works everywhere,” a blanket browser logo row, an Edge store badge without a published listing, or a claim that an actual API test proves every installation surface.
