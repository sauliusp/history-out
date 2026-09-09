# HistoryOut release readiness

HistoryOut **2.0.0** passed the final local QA and was **submitted to Chrome Web Store for review on 7 September 2026**. **Automatic publication after approval is enabled.** The reloaded dashboard shows **This draft is pending review.**

The [final submission QA report](./submission-2026-09-07/README.md) is the primary evidence index and supersedes the earlier same-day preflight for package bytes and current store state. The [43-row coverage matrix](./submission-2026-09-07/coverage.md) maps each control to its checks.

| Final validation | Result |
| --- | --- |
| Unit, serializer, storage and lifecycle tests | 64 passed |
| Broad fixture and native Chrome/Edge scenarios | 30 passed |
| Expanded UI options | 10 groups passed, 43 control rows |
| Retention guidance and storage recovery | 7 passed |
| Support layout and interaction | 320, 400 and 1200px passed |
| Upgrade from the actual published 1.0.1 payload | 3 passed |
| Native two-window saved views | 8 checks passed in Chrome and 8 in Edge |
| Package integrity | 137 checks and 3 stress tests passed |
| Actual downloaded server draft | Exact runtime match |

TypeScript and the production build pass. Webpack emits the existing bundle-size advisory. Counts refer to separate suites with some overlapping coverage. All tests use fictional data and disposable profiles.

The final review caught and fixed two saved-view loss cases before release: silent eviction at twelve views, and a stale window overwriting another window's changes. Saves and deletes now merge against current storage inside a shared exclusive browser lock; no unsafe fallback writes occur. Regressions cover concurrency, capacity, failed reads/writes, retries and ID collisions.

CSV, JSON and HTML downloads, all date presets, custom boundaries, all columns and combinations, filters, preview limits, cleanup, unique URLs, saved views, sharing, storage recovery, lifecycle pages and 30,000-visit exports are covered. The native date picker, original branding, screenshots, video, technical version and permission list remain unchanged.

## History retention sources

Verified on **7 September 2026**: [Chrome Help, answer 95589](https://support.google.com/chrome/answer/95589?hl=en) describes a 90-day history window. Chromium revision `6d42e2166179405faac6fe0fa83f5c0d60068e73` defines `HistoryBackend::kExpireDaysThreshold = 90` in [history_backend.h](https://chromium.googlesource.com/chromium/src/+/6d42e2166179405faac6fe0fa83f5c0d60068e73/components/history/core/browser/history_backend.h#214) and uses it when starting expiration in [history_backend.cc](https://chromium.googlesource.com/chromium/src/+/6d42e2166179405faac6fe0fa83f5c0d60068e73/components/history/core/browser/history_backend.cc#1361).

Chrome has no normal built-in setting to extend this local retention period. Google My Activity is a separate source and changing account activity settings does not extend what this extension can read. Other browsers may differ. Recurring exports preserve available records from now onward; they cannot restore already expired or deleted history. Saved views store settings, not visits.

## Final package and practical limits

Chrome ZIP: **158,398 bytes**, SHA-256 `718719358b9d9a9146e52fbc48f56c8b6c17886a47c7c9b37070bd8d1551c44f`.

Bundle: **481,593 bytes**, SHA-256 `d6e8107d9e268af0eeb1d79b63991bd3724f4b43906778757193567db52289bf`.

The actual server draft contains the same tested runtime. Only Chrome's normal update URL and verified-content metadata are added. All four original icons and the same three permissions match the actual published 1.0.1 package. See [server proof](./submission-2026-09-07/server-draft-comparison.json), [asset proof](./submission-2026-09-07/assets.json) and [store submission](./chrome-draft.json).

Native Chrome for Testing 149.0.7827.55 and Edge 152.0.4191.66 passed on macOS 26.6.2. The published 1.0.1 payload was tested through the unpacked update path, preserving preferences/history and lifecycle behavior. Signed store clean installation and automatic update transport remain post-publication checks. Brave is not installed here, so its package is audited without a runtime claim. No finite test suite guarantees every possible user environment.

Website, domain and YouTube states are recorded separately and were not changed in this submission pass. The earlier [preflight snapshot](./preflight-2026-09-07/README.md) remains available as historical evidence.
