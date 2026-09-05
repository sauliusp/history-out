# HistoryOut v2 release checklist

Status checked **5 September 2026**. Branch: `codex/historyout-v2`. Candidate: **2.0.0**. Existing release baseline: **1.0.1**, source commit `0272441`. Production store and DNS cutovers remain pending review.

## Evidence already available

- Core tests: **31 passed**; TypeScript typecheck passed in this work session. Coverage includes retrieval/date boundaries, cancellation, serialization, settings migration and permission/fallback behavior.
- [Browser QA results](./qa/browser-results.json) completed at `2026-09-05T08:01:36.994Z` with 10 recorded checks. These cover synthetic UI/CSV behavior and an actual isolated Manifest V3 Chromium 149 install, history API, v1 settings and JSON download.
- A separate [isolated headless Microsoft Edge smoke check](./qa/edge-api-smoke.json) loaded the 2.0.0 worker, returned `openPanelOnActionClick: true` from the side-panel API and successfully queried history. This is API smoke evidence, not visible toolbar/sidebar or store-signed installation verification.
- [Package hashes](./qa/packages.json) record the four v2 ZIPs and a v1 source-baseline archive. The baseline ZIP was rebuilt from `0272441`; it is not a fetched copy of the signed store package.
- Source has the same three permissions for Chrome/Edge/Brave; generic Chromium removes `sidePanel`. No new host/optional permissions or content scripts are declared.
- Website source and Sites preview configuration are in the repository. Production DNS and the existing store item have not been changed.

Automated checks do not establish every browser, store-signed update behavior or actual toolbar/sidebar interaction. Update this checklist only from new evidence.

## Before producing the final package

- [ ] Review the final diff against `0272441`, including saved settings, default fields, new assets and manifest declarations.
- [ ] Record the final source commit. Confirm `npm run typecheck`, `npm test` and `npm run build` pass after the last relevant code change.
- [ ] Confirm browser QA evidence against that build; preserve the distinction between fixtures and actual browser APIs.
- [ ] Complete the outstanding named-browser checks in [browser-compatibility.md](./browser-compatibility.md).
- [ ] Verify a representative large history, exact custom dates, repeated visits, empty/error/cancel flows and real CSV/JSON/HTML files. Confirm responsiveness and no silently truncated result.
- [ ] Check that previews, exports and optional cleanup agree; lifetime URL metadata must not be presented as selected-period activity.
- [ ] Confirm all new screenshots show the final UI with synthetic data and actual exported output. Retain raw captures and new editable asset sources.
- [ ] Confirm video delivery status: a script or animation is not a recorded, verified product demonstration. Match captions and controls to the final build.

## Package and submission handoff

- [ ] Run `npm run pack`. Confirm four ZIPs and a `manifest.json` at each ZIP root.
- [ ] Inspect each packaged manifest. Chrome/Edge/Brave: `history`, `storage`, `sidePanel`. Generic Chromium: `history`, `storage`, with no `side_panel` key.
- [ ] Check ZIP contents exclude source maps, fixtures, demo data, local QA files and secrets. Record SHA-256 hashes, source commit and build date.
- [ ] Use the Chrome ZIP for the existing store item `idohnkdgejocejlkihihonhemndpiiei`. Do not create a replacement public Chrome listing or change the public item to private for testing.
- [ ] Review the [store copy](./store-listing.md), privacy declaration, new screenshots, icon and finished YouTube link. Only use public URLs that resolve correctly.
- [ ] Retain the known-good v1 package/source and prepare a rollback or higher-version hotfix. Do not assume an older uploaded version number is a valid rollback procedure.
- [ ] Submit with deliberate publishing timing after review. Submission, approval and publication are separate states.

At this audience size, do not rely on percentage rollout: Google's published threshold is more than 10,000 seven-day active users. Use the prepared test evidence and a deliberate release. [Official update guidance](https://developer.chrome.com/docs/webstore/update).

## Coordinated production release

- [ ] Complete the [website migration checklist](./migration/website.md), including candidate-text updates and production output validation.
- [ ] Confirm the approved v2 package is ready for the existing Chrome Web Store item. Publish at the agreed release time.
- [ ] Verify the public store actually offers 2.0.0 and a clean profile can install it.
- [ ] Deploy the reviewed Sites production build and perform the deliberate custom-domain/DNS cutover. A saved Sites version is not a production deployment.
- [ ] Verify the canonical domain, redirects, privacy/support links, indexability, schema, all 11 routes and sample downloads on the live domain.
- [ ] Check a v1-to-v2 store update retains valid preferences and adds no permission prompt.
- [ ] Inspect support, removal trends and version adoption during the first week. Stop promotion and repair or roll back promptly for a critical regression.

No outreach, community posts, YouTube upload or messages to users have been performed merely by preparing these files. Publishing and promotion should use concrete reviewed artifacts and the owner's authorized channels.
