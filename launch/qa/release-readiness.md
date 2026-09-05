# HistoryOut local release readiness

Broad release validation completed 2026-09-05T09:13:04.075Z. Latest focused support UI verification 2026-09-05T11:38:08.879Z. Candidate technical version: **2.0.0**. Product name: **HistoryOut**. Previous source release: **1.0.1**, baseline `0272441`.

**Earlier broad validation passed:** 37 automated core/background/stress tests, 30 browser scenarios and 3 native upgrade checks. These results predate the additive support CTA and were not all rerun for that UI change.

**Current support update passed:** focused UI checks at 320, 400 and 1200 pixels, TypeScript, production build, native visible preview and **137 package integrity checks**. The package audit also reran all three core stress cases. The current bundle is **476,832 bytes** and emits the existing webpack bundle-size advisory.

## Final support UI update

The compact **Buy me a coffee** button is visible below the original header, with “Free to use.” and “Optional support.” context. The original footer, including **Support HistoryOut**, is byte-identical to the pre-change source at `ba1914f631fec37db90c1cd5225b2537d6755275`. No history-processing logic or permissions changed.

Focused Chromium **149.0.7827.55** fixture checks verify keyboard focus, secure new-tab link attributes, the locally bundled official cup, no horizontal overflow, no initial history reads, zero external page requests and successful Preview at all three widths. The four ZIPs contain the exact same safe local SVG bytes; no remote or active SVG content is packaged. Original icon bytes were rechecked against `0272441`.

Current bundle SHA-256: `d5eb98f989b242344aefb0663bdfc5b5b54e80c290bb21e38393c52d3dbbdf38`. [Focused machine-readable evidence](./bmc-cta.json), [400px layout](./bmc-cta-400.png), [full-page layout](./bmc-cta-1200.png) and [keyboard-focus example](./bmc-cta-focus-400.png).

## Environment and isolation

ProductName:		macOS; ProductVersion:		26.6.2; BuildVersion:		25G83; arm64; Node v22.20.0.

| Browser | Exact version | Verified scope |
| --- | --- | --- |
| Google Chrome for Testing (Chromium) | 149.0.7827.55 | Native unpacked MV3 history, settings, clipboard and all three downloads |
| Installed Microsoft Edge | 152.0.4191.62 | Native unpacked MV3 history, settings, clipboard and all three downloads |

All browser profiles used by these tests were freshly created for QA. The only history inserted was fictional fixture data. Precise historical timestamps were written to the **closed isolated profile's** SQLite history database, then queried through the actual extension APIs. No ordinary Chrome or Edge profile was opened or modified.

## Verified behavior

- Original icons match all four baseline PNGs byte-for-byte. The interface says HistoryOut without a numeric product badge.
- Fresh native Chromium and Edge installs open one welcome page. Unit tests also cover duplicate events and ignore browser/module updates.
- Chrome's native unpacked installer updates the rebuilt 1.0.1 source package to 2.0.0, opens exactly one changelog, retains native history and exact v1 preferences, and does not repeat the lifecycle page after a same-version restart. This is a real local installer transition, not a simulated event; it is not a signed Chrome Web Store update.
- Custom dates include start-of-day and end-of-day visits. A page visited within the range and again later still appears. Visits immediately outside the range are excluded.
- Native CSV, JSON and HTML downloads match exactly six selected visits. JSON fields and timestamps are exact; CSV safely preserves multiline/formula-looking titles; HTML preserves selected cell text while escaping hostile markup.
- Search, domain matching, latest-URL deduplication and query/fragment removal produce the same rows in preview and export. Preview renders up to 100 rows; export includes the complete matching result.
- V1 settings migrate without changing valid saved choices. New Timestamp and Domain columns remain off unless selected. Saved views persist and reapply without storing visit records.
- Clipboard success, clipboard-denial fallback and the canonical share URL pass fixture checks. Native browser clipboard outcomes are recorded separately in the machine-readable results. Support remains optional and uses the existing Buy Me a Coffee URL.
- Empty results, no matches, delayed cancellation and API failures are handled without silently exporting partial data. Cancelled or failed refreshes retain the prior explicitly loaded snapshot. Filters cannot be reset mid-load while an export uses the previous settings.
- No preview/export page network uploads or runtime exceptions were observed. Install/update pages are deliberate user-requested navigation, separate from history processing.
- Search result caps fail explicitly; the tests do not treat the one-million-candidate limit as a silent truncation boundary. Browser-retained history remains the source of truth.

## Scale observation

A browser UI fixture loaded **10,000 URLs / 30,000 visits**, displayed only 100 preview rows and exported all 30,000 rows. Measured load: **150 ms**; changing the search to a 333-visit result: **26 ms**; CSV size: **3,638,965 bytes**. Progress painting is limited to roughly ten updates per second, with exact initial/final counts.

This is a synthetic zero-latency API fixture running in a real browser UI, not a real-profile speed guarantee. A previous mock used per-call zero-duration timers, whose timer scheduling dominated the result; zero-delay fixture responses now resolve immediately. Nonzero test delays remain for cancellation/failure scenarios. Independent core stress tests also verify deterministic exports, bounded API concurrency of eight and recovery from cancelled/failed large loads.

## Reviewable local app

The current built extension is open as a **Google Chrome for Testing app window** in an isolated profile. Native computer-use inspection clicked Preview and observed six fictional visits, five pages and three sites. The original icon, new support cup/button and unchanged footer were verified after refreshing the current build. The isolated profile also contains test navigation; the app is left on Yesterday to display only the six seeded fictional visits. Its profile and app URL are in [visible-review.json](./visible-review.json). Normal user history remains untouched.

## Remaining release limits

- Verify the signed Chrome Web Store package's clean install and update after store approval, using the existing listing. The local baseline archive is rebuilt source, not the fetched signed production ZIP.
- Brave is not installed on this Mac. Its package passes integrity/permission checks, but no Brave runtime certification is claimed. Run the same practical workflow in Brave before claiming tested Brave support.
- Store approval/publication, public live-site checks, DNS and YouTube publication are separate release operations. They are not implied by this extension test result.

## Evidence and reproduction

- [Focused support button and responsive layout checks](./bmc-cta.json)
- [Browser scenarios and downloads](./release-readiness.json)
- [Native 1.0.1 to 2.0.0 upgrade](./native-update.json)
- [Core/background/stress results](./unit-results.tap)
- [Package hashes and exact source comparisons](./package-audit.json)
- [Verification summary and original icon hashes](./verification-summary.json)

Run `npm run typecheck`, `npm test`, `npm run build`, `node scripts/release-readiness.cjs`, `node scripts/native-update-qa.cjs`, `node scripts/pack.mjs`, then `node scripts/audit-release-packages.cjs`. Add `--show-review` to the release-readiness command to launch a fictional-data app profile for review. Run `node scripts/bmc-cta-qa.cjs` for the focused support UI checks. Refresh package hashes after any source or asset change.
