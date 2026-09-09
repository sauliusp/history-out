# Submission option coverage

Status: passed. Bundle: d6e8107d9e268af0eeb1d79b63991bd3724f4b43906778757193567db52289bf.

| Control | Evidence | Scope |
| --- | --- | --- |
| History range: Today | Exact preview and JSON rows, boundary inclusions and exclusions | new option suite |
| History range: Yesterday | Exact preview and JSON rows, boundary inclusions and exclusions | new option suite |
| History range: Last 24 hours | Exact preview and JSON rows, boundary inclusions and exclusions | new option suite |
| History range: Last 7 days | Exact preview and JSON rows, boundary inclusions and exclusions | new option suite |
| History range: Last 30 days | Exact preview and JSON rows, boundary inclusions and exclusions | new option suite |
| History range: All available history | Exact preview and JSON rows, boundary inclusions and exclusions | new option suite |
| Custom dates: From and Through | End-only, start-after-end, cleared values disable export; valid single-day includes both endpoints; native constraints intact | new option suite |
| Include: Order | Selected alone through UI and present as sole key in real JSON download | new option suite |
| Include: Id | Selected alone through UI and present as sole key in real JSON download | new option suite |
| Include: Date | Selected alone through UI and present as sole key in real JSON download | new option suite |
| Include: Time | Selected alone through UI and present as sole key in real JSON download | new option suite |
| Include: Title | Selected alone through UI and present as sole key in real JSON download | new option suite |
| Include: Url | Selected alone through UI and present as sole key in real JSON download | new option suite |
| Include: Visit Count | Selected alone through UI and present as sole key in real JSON download | new option suite |
| Include: Typed Count | Selected alone through UI and present as sole key in real JSON download | new option suite |
| Include: Transition | Selected alone through UI and present as sole key in real JSON download | new option suite |
| Include: Timestamp | Selected alone through UI and present as sole key in real JSON download | new option suite |
| Include: Domain | Selected alone through UI and present as sole key in real JSON download | new option suite |
| Export format: CSV | Selected and reselected; all 11 columns in real downloaded file | new option suite |
| Export format: JSON | Selected and reselected; all 11 columns in real downloaded file | new option suite |
| Export format: HTML | Selected and reselected; all 11 columns in real downloaded file | new option suite |
| Include: no columns / all columns | Zero columns disables export in all three formats, restoring selection reenables export | new option suite |
| Search, Clear search, website options, All websites | Case-insensitive title and URL search plus each domain option exact rows, no history reread | new option suite |
| Most visited site toggles | Pressed/unpressed state and real subdomain inclusion; similarly named hostile domain excluded | new option suite |
| Reset filters / Clear filters | Loaded reset and no-match clear restore the trail; output cleanup stays independent | new option suite |
| One row per URL / Remove URL queries & fragments | All four states with exact preview agreement in 12 CSV/JSON/HTML downloads, including latest after cleanup | new option suite |
| Preview list, keyboard scrolling and revisit links | 100 rendered rows, End scrolls, changed query resets scroll, safe keyboard-focusable links | new option suite |
| Preview / Refresh / export counts and loaded notice | 105 complete rows across all formats; cached snapshot changes to 106 only on Refresh | new option suite |
| Save view toggle, name, Save/Enter | Whitespace disabled, 40-character limit, form toggle, successful named settings save | new option suite |
| Saved view chip / overwrite / delete | Case-insensitive overwrite keeps ID; keyboard apply restores settings without read; unloaded Reset filters; direct export; failed deletion preserved; Delete/Backspace/icon deletion persists | new option suite |
| Dismiss notice | Download alert closes without changing loaded data | new option suite |
| Saved views: 12-view capacity / update / delete recovery | A thirteenth distinct name performs zero writes and keeps all views; case-insensitive overwrite retains ID; failed delete preserves capacity; successful delete permits new save; reload confirms all 12 records | new option suite |
| Saved views across multiple windows | Shared storage and real Web Locks: stale/concurrent distinct names, concurrent same-name overwrite, stale deletion, latest capacity rejection, update and deletion recovery, two-page reload | new option suite |
| Tell a friend, copied status and Close | Enter shares exact install URL; close clears the notice | new option suite |
| Clipboard fallback field, Escape and Done | Space opens fallback on denial, URL is selected/read-only, both close paths work | new option suite |
| Availability disclosure | Enter opens and Space closes, supplementing range-specific preflight checks | new option suite |
| Get help / Leave a review / Support HistoryOut / Buy me a coffee | Keyboard focus, exact secure target URLs and new-tab relations verified; optional support tooltip visible; no external messages or contributions sent | new option suite |
| Cancel and loading/progress/aria-busy | release-readiness.cjs: cancellation, no partial downloads, prior snapshot retained; core bounded concurrency/progress tests | Existing complementary QA, rerun by root |
| History error and retry / empty history / no-match notices | release-readiness.cjs: failure retains snapshot, retry works, no empty downloads | Existing complementary QA, rerun by root |
| Startup Retry / preference Retry saving / failed Save | preflight-ui-qa.cjs: no preference overwrite, truthful save failure, recovery and session exports | Existing complementary QA, rerun by root |
| Custom/All availability text and guide link | preflight-ui-qa.cjs: truthful retention guidance, link and >90-day retained download | Existing complementary QA, rerun by root |
| Responsive support placement / original footer / initial export visibility | bmc-cta-qa.cjs: 320/400/1200px, sticky export visible, original footer bytes | Existing complementary QA, rerun by root |
| Recap visits/pages/sites, latest snapshot notice | core.test.cjs validates visit-based counts; native release-readiness validates loaded data and downloads; this suite tests top sites and Refresh | Existing complementary QA, rerun by root |
