# HistoryOut local release readiness

The final **7 September 2026** candidate passed the complete local preflight. Technical version remains **2.0.0**; the product remains **HistoryOut**. The previous source release is **1.0.1** at `0272441`. The [dated preflight handoff](./preflight-2026-09-07/README.md) is the primary evidence index for this build and supersedes the earlier September 5 and 6 runtime snapshots.

| Final validation | Result | Evidence |
| --- | --- | --- |
| Core, background, storage and stress tests | 52 passed | [TAP results](./preflight-2026-09-07/unit-results.tap) |
| Broad fixture and native browser scenarios | 30 passed | [Browser results](./preflight-2026-09-07/release-readiness.json) |
| Availability guidance and storage recovery UI | 7 passed | [Focused results](./preflight-2026-09-07/ui-recovery.json) |
| Support CTA layout and interaction | 320, 400 and 1200px passed | [Support results](./preflight-2026-09-07/bmc-cta.json) |
| Native unpacked upgrade and restart | 3 passed | [Upgrade results](./preflight-2026-09-07/native-update.json) |
| Package integrity | 137 passed, zero issues | [Package audit](./preflight-2026-09-07/package-audit.json) |

TypeScript and the production build passed. The bundle is **480,428 bytes**; webpack still emits its bundle-size advisory. The reported counts are separate suites with some overlapping coverage, not a combined count of unique behaviors.

## Requested changes and the preferences fix

The existing yellow **Buy me a coffee** strip now follows the export action and sits immediately above the original footer. Its content and styling are preserved. The export action retains its sticky behavior. The free-status line, original footer links, native date picker, original logo/icons, version and permissions are unchanged.

**Custom dates** and **All available history** now show concise availability guidance with a keyboard-operable disclosure. Today does not show it. The guidance explains that exports use retained browser records and suggests saving dated exports regularly. It adds no history archive, automatic export job or permission. A fictional visit from **11 March 2026** was still exported successfully through both Custom and All ranges: the guidance does not impose a 90-day cutoff.

Review caught and fixed a real preferences failure mode: a failed storage read could be treated as missing settings, allowing default preferences to overwrite saved choices. Failed writes could also appear to succeed. Startup now waits for a successful read before enabling the workflow or saving settings. **Retry** restores the existing format, range, column choices and views. Preference-write errors leave the current session usable and offer **Retry saving**. Saved-view changes become visible only after the write succeeds, preserve existing views on failure, and remain retryable. Writes are ordered per key and duplicate pending view operations are guarded.

The injected-error browser tests verify zero default writes after a startup failure, successful preference restoration, no false saved-view success, persistence after recovery/reload, and a real HTML download while preference persistence is unavailable. These tests reproduce the bug in isolated fixtures; they do not establish that a production user lost preferences.

## History retention sources

Verified on **7 September 2026**: [Chrome Help, answer 95589](https://support.google.com/chrome/answer/95589?hl=en) describes a 90-day history window. Chromium revision `6d42e2166179405faac6fe0fa83f5c0d60068e73` defines `HistoryBackend::kExpireDaysThreshold = 90` in [history_backend.h](https://chromium.googlesource.com/chromium/src/+/6d42e2166179405faac6fe0fa83f5c0d60068e73/components/history/core/browser/history_backend.h#214) and uses it when starting expiration in [history_backend.cc](https://chromium.googlesource.com/chromium/src/+/6d42e2166179405faac6fe0fa83f5c0d60068e73/components/history/core/browser/history_backend.cc#1361).

Chrome has no normal built-in setting to extend this local retention period. Google My Activity is a separate source and changing account activity settings does not extend what this extension can read. Other browsers may differ. Recurring exports preserve available records from now onward; they cannot restore already expired or deleted history. Saved views store settings, not visits.

## Environment and verified scope

macOS **26.6.2**, build **25G83**, Apple silicon; Node **v22.20.0**.

| Browser | Exact version | Verified scope |
| --- | --- | --- |
| Google Chrome for Testing | 149.0.7827.55 | Native unpacked MV3 history, settings, clipboard and CSV/JSON/HTML downloads |
| Installed Microsoft Edge | 152.0.4191.66 | Native unpacked MV3 history, settings, clipboard and CSV/JSON/HTML downloads |

Native tests use freshly created disposable profiles and fictional data. Precise historical timestamps are inserted into a closed isolated profile before reads through the real extension APIs. Ordinary user profiles are not opened or modified. Storage errors, cancellation and large-data stress are controlled fixture tests.

The final broad suite confirms inclusive custom-date boundaries, inclusion of pages revisited after the selected range, exact six-visit native downloads, safe CSV/HTML output, preview/export agreement, v1 preference migration, saved views, empty/error/cancel states, secure clipboard fallback, and no observed history uploads or uncaught page errors. Fresh native installs open one welcome page. The unpacked 1.0.1 to 2.0.0 transition opens one changelog, preserves preferences/history and avoids duplicate lifecycle pages after restart.

The synthetic **10,000 URL / 30,000 visit** browser fixture rendered 100 preview rows and exported all 30,000. This run measured **321 ms** to load and **31 ms** to filter, producing a **3,638,965-byte** CSV. These are zero-latency fixture observations on this machine, not real-profile performance promises.

## Harness corrections and preserved assets

The final passing run follows two test-harness corrections:

1. The shared fixture now accepts an explicit seed timestamp. The broad fixture seeds September 5 to match its fixed UI clock; the new preflight fixture explicitly seeds September 7. Previously the fixture used the real date while the broad UI clock stayed on September 5, causing a false empty-preview result.
2. The clipboard-denial scenario closes the prior success snackbar before its separate click. Hovering the relocated footer could pause the prior snackbar's auto-hide and leave that toast over the control. The denied-clipboard scenario then runs independently.

The focused script also uses MUI combobox label matching that permits the selected value in the accessible name. These harness corrections did not alter runtime behavior.

New QA images and downloads are only under `/tmp/historyout-preflight-2026-09-07`, including the focused run directory recorded in `ui-recovery.json`. Existing marketing screenshots, videos, captions and brand assets were not regenerated. [Source integrity](./preflight-2026-09-07/source-integrity.json) confirms the native date picker, extension manifest, dependency manifests and technical version are unchanged; [asset integrity](./preflight-2026-09-07/assets.json) records preserved media and the approved promotional tile copies.

## Final package and distribution boundary

Bundle SHA-256: `425adcc1a7cc7f1c0d0eff9dc00c917ada813635a6e36cd656560ff30db506eb`.

Chrome ZIP SHA-256: `2874136b5c896956eeafed23d03b8f4623ffd0ff33e1fcc6ced43f9ac79768ba` for `releases/historyout-2.0.0-chrome.zip` (**158,035 bytes**).

All four package targets passed exact-file and permission audits. Chrome, Edge and Brave retain `history`, `storage` and `sidePanel`; generic Chromium removes `sidePanel` and uses the full-page fallback. No target adds host access, optional permissions, content scripts, fixtures or source maps. Original icons match the source baseline.

The final Chrome replacement was saved to the existing Web Store item on September 7. The dashboard confirmed **Item saved**, **Draft 2.0.0**, **Published 1.0.1**, and **This draft is unpublished**. The listing reload retained the five existing screenshots, the two approved promotional tiles and the video. This is draft verification, not submission or publication; exact external-state evidence is tracked separately in [chrome-draft.json](./chrome-draft.json).

A signed store clean install and signed 1.0.1 to 2.0.0 update remain unverified until approval/publication. The native local baseline is rebuilt source, not a signed production download. Brave is not installed here: its archive passes integrity checks, but no Brave runtime result is claimed. Website, DNS and YouTube outcomes remain separate from extension QA.

## Reproduction

Run `npm run typecheck`, `npm test`, `npm run build`, then `QA_OUTPUT_DIR=/tmp/historyout-preflight-2026-09-07 node scripts/release-readiness.cjs`, `node scripts/native-update-qa.cjs`, `QA_OUTPUT_DIR=/tmp/historyout-preflight-2026-09-07 node scripts/bmc-cta-qa.cjs`, and `node scripts/preflight-ui-qa.cjs`. Package with `node scripts/pack.mjs` and audit with `node scripts/audit-release-packages.cjs`. Refresh hashes and affected checks after any runtime or package change. Preserve the dated reports as snapshot evidence.
