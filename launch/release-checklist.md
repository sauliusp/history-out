# HistoryOut release checklist

Candidate technical version: **2.0.0**. Previous source baseline: **1.0.1** at `0272441`. Branch: `codex/historyout-v2`. Product name and original icon remain **HistoryOut**.

The [local release-readiness report](./qa/release-readiness.md) is the source for exact versions, timings and limitations. Website and domain publication are tracked in the [website migration handoff](./migration/website.md).

## Completed local extension checks

- [x] Earlier broad validation passed **37 core/background/stress tests**. TypeScript and the production build pass again after the additive support CTA; the current bundle is **476,832 bytes**.
- [x] **30 browser scenarios** passed before the additive support CTA across Google Chrome for Testing **149.0.7827.55** and installed Microsoft Edge **152.0.4191.62** on macOS **26.6.2**, Apple silicon.
- [x] Native custom-date tests include both daily boundaries, exclude adjacent visits and retain a page revisited after the selected range.
- [x] Actual CSV, JSON and HTML downloads match the selected native history. Formula-looking/multiline titles and hostile HTML text remain safe.
- [x] Saved v1 preferences persist through normalization/reload, while optional new fields remain disabled until selected.
- [x] Named views persist, restore their filters/settings and do not store a browsing-history archive.
- [x] Search, domains, deduplication, optional cleanup, preview and exported rows agree.
- [x] Empty/no-match, failure, cancellation, stale snapshot and mid-load filter controls behave correctly.
- [x] A synthetic browser UI fixture loads **10,000 URLs / 30,000 visits**, renders 100 preview rows and exports all 30,000 rows. This is a synthetic timing observation, not a promised real-profile speed.
- [x] Tell a friend, clipboard denial fallback, canonical store URL and optional contribution link are verified. No clipboard or other new permission was added.
- [x] Current Buy me a coffee CTA passes focused **320/400/1200px** layout, keyboard, local-asset and Preview checks. Original footer and icons are unchanged. The exact current bundle hash is recorded in [bmc-cta.json](./qa/bmc-cta.json).
- [x] Fresh native installs open one welcome page. **Three native installer checks** verify a rebuilt-source 1.0.1 to 2.0.0 update opens one changelog, preserves native history/preferences and does not repeat after restart.
- [x] Browser/module updates and duplicate lifecycle events do not cause repeated welcome/changelog tabs.
- [x] Original 16/32/48/128 PNG icons match baseline bytes. The UI has no numeric product badge.
- [x] The final built extension is visible as an isolated local app with fictional native history, and its Preview was clicked through native computer controls. Ordinary browser profiles remain untouched.

## Completed package verification

The 6 September metadata update leads with browser history export. Runtime behavior, original assets, version and permissions are unchanged. Packages were regenerated for the new manifest text and the 137 integrity checks passed again.

- [x] Chrome, Edge, Brave and generic Chromium ZIPs were rebuilt from the final extension files.
- [x] **137 package checks** pass, including root-level manifests, exact runtime-file hashes, versions, exclusions and the bundled official cup SVG. All three core stress cases pass again during this audit.
- [x] Chrome/Edge/Brave retain `history`, `storage`, `sidePanel`. Generic Chromium contains only `history`, `storage` and no `side_panel` manifest entry.
- [x] No host permissions, optional permissions, content scripts, fixtures, QA data or source maps appear in the packages.
- [x] Generic fallback checks require both manifest support and a working side-panel API; otherwise the toolbar opens the extension's own app page.
- [x] Final archive SHA-256 hashes and source comparisons are in [package-audit.json](./qa/package-audit.json).

If any extension source or asset changes, rebuild, repeat affected checks, run `node scripts/pack.mjs` and refresh `node scripts/audit-release-packages.cjs` before using those hashes. Record the final committed source revision in the handoff.

## Remaining browser and store release verification

- [ ] Run the practical install/preview/filter/save/export flow in **Brave** before claiming runtime-tested Brave support. Brave is not installed on this Mac; its archive is verified but its runtime is not.
- [x] Upload the reviewed Chrome ZIP to the **existing** Chrome Web Store item `idohnkdgejocejlkihihonhemndpiiei`, using the reviewed store copy and final assets. Saved draft 2.0.0, privacy fields and reviewer instructions verified on 6 September 2026. The product remains free. See [draft evidence](./qa/chrome-draft.json).
- [ ] The owner reviews the saved draft, submits it for review and publishes after approval. No submission or publication was performed by this task.
- [ ] After store approval/publication, verify a clean **signed store install** and a signed **1.0.1 to 2.0.0 update**, including unchanged permission prompts, retained preferences/history and welcome/changelog behavior. Local unpacked installer evidence does not replace this signed-distribution check.
- [ ] Verify the public listing serves the intended approved version, public URLs resolve and the final YouTube destination is correct.

Retain the known-good baseline source/package. If a shipped issue requires a rollback, follow the store's versioning process with an appropriate higher-version hotfix rather than assuming an older version number can be uploaded again.

Website deployment, custom-domain/DNS changes and YouTube publication are separate release operations. Complete them from their current reviewed artifacts and live evidence; passing these local extension checks does not imply they have happened.
