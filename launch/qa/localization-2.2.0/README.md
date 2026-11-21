# HistoryOut 2.2.0 validation

Validated on 21 November 2026. All history used by browser tests is fictional and isolated from ordinary user profiles.

- TypeScript: pass. Unit, migration, serialization, storage, locale and lifecycle contracts: 102/102 pass.
- [Seven-language UI regression](results.json): all seven pass, including exports, preserved saved views, filtering, custom dates, empty states, cancellation, errors and widths 320/400/760/1280.
- [Native and stress browser checks](release-readiness/release-readiness.json): 30/30 pass on Chromium 149 and Microsoft Edge 157, including 30,000 visits, exact native CSV/JSON/HTML results, clipboard fallback, saved views, date boundaries and no extension network uploads.
- [Native 2.1.0 upgrade](native-upgrade-2.1.0/native-update.json): four checks pass. Same published ID, exact settings and multilingual saved-view names, retained native history, one update page and no repeated update on restart.
- [Website](website/report.json): 91 pages at four widths, 364 successful route/layout checks, 49 same-page language switches, zero runtime errors. Five source/build test groups also pass, including metadata, links, 84 sitemap URLs, noindex previews and both Search Console tags.
- [Packaged lifecycle layout](lifecycle/report.json): all 14 welcome/update pages at 320/400/1440, 42 layouts and 14 single-version labels pass.
- [Package audit](../package-audit.json): 397/397 checks pass across Chrome, Edge, Brave and generic Chromium archives. No permission increase; native locale files and onboarding pages are included.
- [Localized assets](../localized-assets.json): 63 images pass, with all five screenshots per language. Original global promotional tiles and video remain unchanged.

The final bundle SHA-256 is `c32111fe12202b03ff6e60edc2fcf06003ca6265872453de41d98caf15832132`. The complete packaged payload digest is `013d0f7ad374ca003c513227feb7cda293fe6e36f5508c5d9420a7324c141aed`. UI screenshot evidence follows the bundle; native and upgrade reports follow the full payload. Archive hashes are recorded separately in the package audit.

## Limits and observations

An initial Edge interaction run stalled waiting for animation frames. The stall also reproduced on a plain one-button browser page and then cleared. The final normal run passed all Edge checks without force-clicks or skipped actionability checks. The diagnostic is retained alongside the native evidence.

[Native Chinese locale diagnostic](native-locale.json) is explicitly limited: this macOS host ignores the native `--lang=zh-CN` override, while the Playwright renderer uses its emulated Chinese locale. Chinese UI, catalog contracts and the packaged Chinese welcome page passed; native Chinese browser metadata selection is not proven on this host.

Brave runtime and signed Chrome Store automatic updates are not reproduced locally. Prepared archives and an accepted Store submission do not establish public availability. Google controls Store review and Search indexing.
