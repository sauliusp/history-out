# HistoryOut final preflight: 7 September 2026

**Local candidate passed. Technical version stays 2.0.0.** This directory is the primary handoff for the final support-position, history-availability and storage-recovery changes. Earlier QA folders describe earlier bundle snapshots.

| Evidence | Final result |
| --- | --- |
| [Core/background/storage/stress](./unit-results.tap) | 52 tests passed |
| [Broad browser workflows](./release-readiness.json) | 30 scenarios passed |
| [Guidance and storage recovery](./ui-recovery.json) | 7 focused cases passed |
| [Optional support](./bmc-cta.json) | 320, 400 and 1200px passed |
| [Native unpacked update](./native-update.json) | 3 cases passed |
| [Package integrity](./package-audit.json) | 137 checks passed, zero issues |
| [Protected source](./source-integrity.json) and [assets](./assets.json) | Date picker, version, permissions, original brand and marketing media preserved |

Browsers: Google Chrome for Testing **149.0.7827.55** and Microsoft Edge **152.0.4191.66** on macOS **26.6.2**, Apple silicon. Native tests used disposable profiles with fictional history. Storage faults and scale tests used synthetic APIs. Ordinary user browser profiles were untouched.

The yellow support strip now follows Export and sits above the original footer. Custom/All ranges show keyboard-accessible history guidance. A retained March 11 visit exported successfully, proving the notice adds no 90-day cutoff. The native date picker, logo, version and existing screenshots remain unchanged. New QA images/downloads are only under `/tmp/historyout-preflight-2026-09-07`; the focused run path is in `ui-recovery.json`.

A real bug was caught and fixed: failed settings reads could be mistaken for missing preferences and lead to default overwrites. Startup now waits for a successful read and offers Retry. Failed writes are surfaced; saved views are acknowledged only after persistence succeeds. Tests confirm zero default writes during failure, restored prior preferences, successful recovery after reload and session export during a preference-save failure.

The final run also corrects the harness: fixture history has an explicit timestamp matching its UI clock, and the separate clipboard-denial case dismisses the prior success snackbar first. These corrections do not change product behavior.

Chrome's usual 90-day retention is grounded in [Chrome Help 95589](https://support.google.com/chrome/answer/95589?hl=en) and the [Chromium expiry constant](https://chromium.googlesource.com/chromium/src/+/6d42e2166179405faac6fe0fa83f5c0d60068e73/components/history/core/browser/history_backend.h#214), checked September 7. Chrome has no normal setting to extend its local window. Regular exports preserve available records from now onward, not expired history; other browsers may differ.

- Bundle: **480,428 bytes**, SHA-256 `425adcc1a7cc7f1c0d0eff9dc00c917ada813635a6e36cd656560ff30db506eb`.
- Chrome ZIP: **158,035 bytes**, SHA-256 `2874136b5c896956eeafed23d03b8f4623ffd0ff33e1fcc6ced43f9ac79768ba`.

The final replacement is saved in the existing Chrome Web Store draft. The dashboard reports **Draft 2.0.0**, **Published 1.0.1** and **This draft is unpublished**. [Store evidence](./chrome-draft.json) is separate from these local checks. Submission, approval/publication and signed-store install/update verification remain separate. The tested native upgrade uses rebuilt unpacked 1.0.1 source. Brave is not installed, so no Brave runtime result is claimed.

See the [full readiness report](../release-readiness.md) for reproduction, exact scope and source references, and the [release checklist](../../release-checklist.md) for remaining work.
