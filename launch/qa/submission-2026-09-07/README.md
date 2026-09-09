# HistoryOut submission QA, 7 September 2026

Technical version remains **2.0.0**. This is the final candidate after the saved-view capacity fix and supersedes the earlier same-day preflight for current package bytes. Historical preflight reports are retained.

## Results

| Validation | Result | Evidence |
| --- | --- | --- |
| TypeScript and production build | Passed | [TypeScript](./typecheck.log), [build](./build.log) |
| Core, serializer, storage and lifecycle tests | 64 passed | [TAP results](./unit-results.tap) |
| Broad fixture and native Chrome/Edge scenarios | 30 passed | [Browser report](./release-readiness.json) |
| Retention guidance and storage recovery | 7 passed | [Focused UI report](./ui-recovery.json) |
| Support placement and interaction | 320, 400 and 1200px passed | [Support report](./bmc-cta.json) |
| Upgrade from the actual published 1.0.1 payload | 3 passed | [Upgrade report](./production-upgrade.json), [baseline provenance](./published-payload-provenance.json) |
| Package integrity | 137 checks and 3 stress tests passed | [Package audit](./package-audit.json) |
| Store assets and release kits | Passed | [Asset proof](./assets.json) |
| Actual saved server draft versus tested ZIP | Exact runtime match | [Server comparison](./server-draft-comparison.json) |

Counts describe separate suites with overlapping coverage. The expanded option suite passes **10 groups covering 43 control rows**, including all six presets, valid/incomplete/reversed custom dates, all eleven individual columns, all/none selection, 12 format/cleanup/deduplication combinations, preview cap, refresh, keyboard sharing and cross-window saved views. See the [options report](./options.json), [coverage matrix](./coverage.md) and [harness provenance](./harness-notes.json).

The native scenarios use Google Chrome for Testing **149.0.7827.55** and installed Microsoft Edge **152.0.4191.66** on macOS **26.6.2** with isolated disposable profiles. Ordinary user profiles were not used for QA. Synthetic historical timestamps were seeded into closed disposable profiles, then read through the real extension APIs. Controlled fixtures cover storage failures, cancellation and large datasets.

## Saved-view defects found and fixed

Saving a thirteenth distinct named view previously sliced the collection to twelve, silently dropping the oldest view. The final candidate refuses the new name and displays a clear instruction to delete an existing view or reuse its name. No write happens when capacity is reached. Case-insensitive updates at capacity preserve all IDs, and deletion frees a slot. The regression failed against the previous implementation and passes with the fix.

A second regression reproduced lost updates when two extension windows had stale copies of the saved-view list. Save and delete now acquire one shared exclusive Web Lock, re-read current records inside the lock, and merge by name or delete by ID. Capacity is checked against current storage. UUIDs avoid cross-window ID collisions. Missing lock support fails with a visible message and no unsynchronized fallback. The [pre-fix native failure](./native-multi-window-before-fix.json) is retained as regression evidence.

Two real extension pages now pass eight checks each in [Chrome](./native-multi-window-chrome.json) and [Edge](./native-multi-window-edge.json), using actual browser storage. Both writes were observed queued behind the same exclusive lock; after release both names remained. Concurrent same-name updates, stale deletion, capacity rejection, update at capacity and recovery after freeing a slot all pass. Source basis: [Web Locks specification](https://www.w3.org/TR/web-locks/) and [Chrome extension storage scope](https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies).

Additional tests cover history disappearing during visit expansion, an API failure after partial progress, ordering of successful preference writes, and recovery from lifecycle storage/tab errors. Existing tests cover startup preferences, safe retry behavior, failed view writes, date boundaries, cancellation, safe serializers and all 2,047 nonempty field combinations in each format.

## Export and preview coverage

Native CSV, JSON and HTML downloads contain exactly the selected visits, including both custom-date boundaries and a URL revisited outside the selected range. CSV quoting and spreadsheet-formula handling, HTML escaping and safe links, URL cleanup, latest-URL selection, filters and preview/export agreement pass. The synthetic 30,000-visit result renders 100 preview rows and exports the complete dataset. Fixture timings are not real-profile performance promises.

The extension explains browser retention without imposing its own 90-day cutoff. Controlled records older than 90 days export through Custom dates and All available history. Saved views retain settings, not a history archive. See the [previous sourced retention explanation](../preflight-2026-09-07/README.md).

## Final bytes and preserved scope

- Bundle: **481,593 bytes**, SHA-256 `d6e8107d9e268af0eeb1d79b63991bd3724f4b43906778757193567db52289bf`.
- Chrome ZIP: **158,398 bytes**, SHA-256 `718719358b9d9a9146e52fbc48f56c8b6c17886a47c7c9b37070bd8d1551c44f`.
- Downloaded final CWS CRX SHA-256: `3eba379feceb9a5ac011b955e4cb5835c852087f0614523b8511941ab62cd029`.

All ten non-manifest program files in the saved CWS draft match the tested ZIP byte for byte. Chrome adds its normal `update_url` manifest field and `_metadata/verified_contents.json`; no other runtime difference is present. The actual published 1.0.1 CRX confirms the same three permissions and all four original icons.

Chrome, Edge and Brave retain `history`, `storage` and `sidePanel`. Generic Chromium removes `sidePanel` and uses the full-page fallback. No target adds host permissions, optional permissions, content scripts, fixtures or source maps. Version, dependency manifests, native date picker and five marketing screenshots are unchanged. The two approved promo tiles are already in the dashboard. All 131 protected assets are unchanged in this pass; only package copies and kit hash metadata were refreshed. See [source integrity](./source-integrity.json).

## Store and practical limits

Version **2.0.0 was submitted for review on 7 September 2026**, with **automatic publication after approval checked**. The dashboard confirmed **Your extension was submitted for review**; a newly loaded Status page shows **This draft is pending review.** See [submission evidence](./chrome-submission.json). Google approval is pending. The existing 1.0.1 package remains the published baseline; no 2.0.0 publication is claimed.

The upgrade test used the actual published 1.0.1 program payload, excluding only CWS verification metadata so it could run through the native unpacked installer. It verified preference/history retention, one changelog and no duplicate on restart. It does not exercise the signed automatic-update transport. A signed store clean install and signed update remain post-publication checks. Brave is not installed here, so no Brave runtime result is claimed. No finite test run guarantees zero bugs in every user environment.

Webpack emits the existing bundle-size advisory; typechecking and build complete successfully. Website, domain, video, captions and screenshots were not changed in this submission pass. QA captures and fictional downloads remain in temporary directories. The native saved-view reload test now waits for the completed-save acknowledgment before reloading, so it tests persisted success instead of interrupting an in-flight asynchronous write.

## Reproduce

Run `npm run typecheck`, `npm test`, `npm run build`, then `node scripts/pack.mjs` and `node scripts/audit-release-packages.cjs`. Run `scripts/release-readiness.cjs` and `scripts/bmc-cta-qa.cjs` with a temporary `QA_OUTPUT_DIR`; run `scripts/preflight-ui-qa.cjs` and `scripts/submission-options-qa.cjs`. For the published-payload upgrade, set both `QA_OUTPUT_DIR` and `QA_BASELINE_ZIP` when running `scripts/native-update-qa.cjs`. Never reuse package hashes after changing runtime bytes.
