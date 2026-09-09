# HistoryOut release checklist

Candidate technical version: **2.0.0**. Previous source baseline: **1.0.1** at `0272441`. Branch: `codex/historyout-v2`. Product name and original logo/icon remain **HistoryOut**.

The [7 September submission QA](./qa/submission-2026-09-07/README.md) is the primary evidence index for the final candidate. The [release-readiness report](./qa/release-readiness.md) explains scope, sources and limitations. Website/domain operations remain in the [website migration handoff](./migration/website.md).

## Completed final local checks

- [x] TypeScript and production build pass. **64 core/background/storage/stress tests** pass. Bundle: **481,593 bytes**.
- [x] **30 broad browser scenarios** pass on Google Chrome for Testing **149.0.7827.55** and installed Microsoft Edge **152.0.4191.66**, in isolated macOS profiles.
- [x] Custom calendar dates include both daily boundaries, exclude adjacent visits and retain a page revisited later. The native date picker is unchanged.
- [x] Actual CSV, JSON and HTML downloads match selected native history. Multiline/formula-looking CSV titles and hostile HTML text are handled safely.
- [x] Search, domain filters, latest-URL mode, optional query/fragment cleanup, preview and exported rows agree. The preview limit does not truncate the file.
- [x] Empty/no-match, failure, cancellation, prior snapshots and mid-load filter controls behave correctly.
- [x] The synthetic **10,000 URL / 30,000 visit** fixture exports the complete result and limits preview rendering to 100 rows. Its timing is not a real-profile performance promise.
- [x] V1 preferences migrate without changing valid selected fields. Named views persist settings and filters, not a history archive.
- [x] Fixed the storage-read failure path that could overwrite preferences with defaults. Startup waits for a successful read; Retry restores existing choices. Failed preference writes remain visible and retryable without blocking session exports.
- [x] Failed saved-view writes cannot claim success or replace existing views. Retrying succeeds and persists across reload. Ordered writes and pending-view guards are tested.
- [x] **7 focused UI cases** pass: Custom/All availability guidance, Today hidden, keyboard details, old retained data exports, startup recovery, saved-view recovery and preference-save recovery.
- [x] The yellow optional support strip is below the export action and immediately above the unchanged footer. **320/400/1200px** support checks pass; sticky export, keyboard access, local cup asset and Preview remain usable.
- [x] Tell a friend and clipboard-denial fallback work without added permissions. No preview/export history uploads or uncaught runtime errors were observed.
- [x] Fresh native installs open one welcome page. **3 native unpacked upgrade checks using the actual published 1.0.1 payload** preserve preferences/history, open one changelog for 1.0.1 to 2.0.0 and prevent repeats after restart.
- [x] Original logo/icons, marketing screenshots, videos/captions, manifest permissions and technical version remain unchanged. Only temporary QA captures were written; approved marketing assets were preserved.

- [x] Expanded options pass 10 groups and 43 control rows. Two native extension windows pass eight concurrency/capacity checks each in Chrome and Edge.
- [x] Saved-view capacity and stale-window overwrite defects are fixed; acknowledged saves persist and all current records survive concurrent additions/deletions.

The availability guidance uses Chrome Help answer 95589 and Chromium's 90-day expiry constant, verified September 7. It does not claim a normal setting can extend local Chrome history. Recurring exports preserve available records going forward and do not recover expired history. Other browsers may differ.

The passing run includes two documented harness fixes: explicitly seed history at the same timestamp as the fixture clock, and dismiss the prior clipboard-success snackbar before the separate denied-clipboard case. Details and evidence are in the release-readiness report.

## Completed package verification

- [x] Chrome, Edge, Brave and generic Chromium ZIPs match the final candidate files.
- [x] **137 package checks** pass with zero issues, including root manifests, exact runtime hashes, exclusions, bundled safe SVG and the core stress cases.
- [x] Chrome/Edge/Brave retain `history`, `storage`, `sidePanel`. Generic Chromium contains only `history`, `storage` and no `side_panel` manifest entry.
- [x] No host permissions, optional permissions, content scripts, fixtures, QA data or source maps appear in the packages.
- [x] Fallback checks require both manifest support and a working side-panel API; otherwise the toolbar opens the extension's own page.
- [x] Final bundle SHA-256: `d6e8107d9e268af0eeb1d79b63991bd3724f4b43906778757193567db52289bf`.
- [x] Final Chrome ZIP SHA-256: `718719358b9d9a9146e52fbc48f56c8b6c17886a47c7c9b37070bd8d1551c44f`. See the [dated package audit](./qa/submission-2026-09-07/package-audit.json).

After any runtime or package change, rebuild, repeat affected checks, repack and refresh the audit before reusing these hashes. Record the final committed revision separately; these reports describe the exact candidate bytes.

## Store submission and remaining release verification

- [x] Replace the package in existing Chrome Web Store item `idohnkdgejocejlkihihonhemndpiiei` with the final reviewed Chrome ZIP, still **2.0.0**. The September 7 dashboard confirmed **Item saved**, **Draft 2.0.0**, **Published 1.0.1** and **This draft is pending review** after submission. The reloaded listing retained the five screenshots, two approved promotional tiles and existing video. See [draft evidence](./qa/chrome-draft.json).
- [x] Submitted the final 2.0.0 package for review on 7 September. Automatic publication after approval was checked. Confirmation and a reloaded Status page show pending review. This is not yet approval or publication.
- [ ] After approval/publication, verify a clean **signed store install** and signed **1.0.1 to 2.0.0 update**, including permission prompts, retained preferences/history and lifecycle behavior. Local unpacked installer evidence does not replace this check.
- [ ] Verify the public listing serves the intended approved version and public destinations are correct.
- [ ] Run the practical install/preview/filter/save/export flow in **Brave** before claiming it is runtime-tested. Brave is not installed here; package integrity is verified separately.

Keep the known-good source baseline and package. A shipped rollback follows the store's versioning process with an appropriate higher-version hotfix; an old version number cannot be assumed reusable. The extension remains free.
