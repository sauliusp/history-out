# HistoryOut 2.2.0 localization release

Status: implementation complete on `codex/historyout-language-support`; validation is complete and Codex PR review is the publication gate. No 2.2.0 upload, submission or website publication has occurred.

## Scope

English stays available. Add Simplified Chinese for mainland China (`zh_CN`), Spanish (`es`), German (`de`), Brazilian Portuguese (`pt_BR`), French (`fr`) and Japanese (`ja`). Simplified Chinese is an explicit owner requirement. The other choices follow the leading non-English audiences in the current Chrome Web Store language report and the listing's GA4 language report.

Translate the complete extension interface, accessibility labels, errors, help, packaged welcome/update pages, website pages and store listing text. Generate all five listing screenshots in each language using the actual localized interface. Supply localized small and marquee promotional artwork for reuse. Chrome Web Store only accepts global small/marquee tiles, so per-language promo variants are prepared assets rather than separate live CWS fields. Keep the existing YouTube video and original branding.

Preserve the existing Store item `idohnkdgejocejlkihihonhemndpiiei`, its published public key, permission baseline, history handling, saved views and export schemas. The public key is not a credential. CSV headers and JSON field names stay stable for existing workflows; exported history content and user-created names are not translated.

The owner-only analytics exports and detailed research remain local and are excluded from this public repository. Cross-source install totals do not fully reconcile, and installed-user counts do not measure use of extension features. This release creates a baseline for measuring localization results; it does not claim a causal growth effect in advance.

## Required release order

1. Complete localized content and every listing asset.
2. Pass unit, type, build, export-contract, browser, responsive, upgrade and package checks.
3. Open a pull request from the working branch into `main` and request Codex review.
4. Resolve review findings, rerun affected checks and merge the reviewed change.
5. Publish the reviewed website and submit the exact tested extension package with localized listing content to the existing Store item.
6. Verify website publication and report Store submission, review and public-release states separately.

## Evidence

- Baseline source: `cd2b1a7`; 94 tests passed on 21 November 2026 in an isolated source export.
- The live developer dashboard showed version 2.1.0 published with the original `history`, `storage`, `sidePanel` permissions.
- TypeScript and all 102 unit/contract tests pass. Every locale preserves CSV/JSON schemas and translated HTML escaping.
- Seven full locale UI flows pass at 320, 400, 760 and 1280px: preview, export, filters, saved views, custom dates, cancellation and recovery.
- All 30 release-readiness checks pass on native Chromium and Microsoft Edge, including 30,000-visit stress, clipboard fallback and exact CSV/JSON/HTML downloads.
- Native 2.1.0 upgrade preserves the original ID, saved-view names/settings and native history; the update page opens once.
- Website: all 91 routes, 364 responsive checks, 49 same-page language switches, reciprocal hreflang and 84 sitemap URLs pass.
- All 14 packaged install/update pages pass 42 layout checks at 320, 400 and 1440px.
- 63 localized images pass dimension, opacity, text-fit, bundle-provenance and copy-alignment audits. The existing video and global Store promo tiles are unchanged.
- Four packages pass 397 archive/source/permission checks. The Chrome package will be submitted only after Codex review.
- [Current regression evidence](qa/localization-2.2.0/README.md), [package audit](qa/package-audit.json), [localized asset audit](qa/localized-assets.json), [review gallery](store-kit/locales/index.html).

## Search Console

The owner requested the property in the Saulius Petreikis Google account. Its new public verification meta tag is included alongside the previous tag. After publication, verify the `https://exportchromehistory.app/` URL-prefix property, submit `/sitemap.xml`, and request indexing for the new language homepages. Property verification, sitemap acceptance and eventual indexing are separate outcomes. No private account identifiers or analytics exports are included in this public release record.

## Reference rules

- [Chrome Store metrics](https://developer.chrome.com/docs/webstore/metrics/): language/region breakdowns and the meaning of weekly users.
- [Localized listing fields and asset limits](https://developer.chrome.com/docs/webstore/cws-dashboard-listing): localized descriptions/screenshots/video, global promotional tiles.
- [Chrome internationalization](https://developer.chrome.com/docs/extensions/reference/api/i18n): locale metadata and fallback behavior.
- [Chrome-Stats language-support research](https://chrome-stats.com/blog/2026/08/07/chrome-extension-language-support): a cross-sectional association between language coverage and audience size, not evidence of a causal multiplier for HistoryOut.
