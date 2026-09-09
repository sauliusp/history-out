# HistoryOut 2.1.0 review

Prepared 9 September 2026 on `codex/internal-pages-feedback`. Code and release files are prepared for review. Featurebase account edits, Search Console verification/submission, and real-Chrome checks remain pending because the Mac was locked. The owner authorized a branch/PR, Codex review loop and merge to main on 9 September 2026. Store submission and public website deployment remain separate and require launch approval.

## Prepared changes

- Installation opens `chrome-extension://<installed-id>/welcome.html`.
- A new extension version opens `chrome-extension://<installed-id>/updated.html` once. Same-version reloads and browser/module updates do not open it again.
- Both pages include **Open HistoryOut**, a full-tab fallback, the original blue icon/pinning guidance, optional support and feature suggestions. Their interface and assets load locally without remote requests.
- The update page explains 2.1.0, retains the useful daily-recap instructions, and keeps the detailed 2.0.0 notes in an expandable section.
- Feature suggestions are linked from the extension, both local lifecycle pages, website navigation/footer and homepage invitation, and prepared Store description.
- Website contact/privacy links, extension contact, and current release-copy fields use **sauliusthedev@gmail.com**. The public Chrome Web Store listing was checked and already exposes this address.
- Active YouTube metadata drafts now use the official website and include feedback/contact links. Published video descriptions and archived metadata have not been changed.
- The minor version is **2.1.0** in the extension manifest, package manifests and lockfiles. Website release metadata still records **2.0.0** as the Store version and clearly labels 2.1.0 as being prepared.

The website keeps its existing welcome and changelog routes for older installed versions and ordinary site visitors. Extension 2.1.0 never uses those website routes for install/update events.

## Review files

- [Chrome upload candidate](../releases/historyout-2.1.0-chrome.zip)
- [Welcome page](../extension-unpacked/welcome.html)
- [Update page](../extension-unpacked/updated.html)
- [Store description](./store-kit/chrome/description.txt)
- [Featurebase welcome, pinned posts and existing-request reply](./featurebase-preparation.md)
- [Search Console status and remaining steps](./search-console-preparation.md)
- [Package audit](./qa/package-audit.json)

The identical Chrome candidate is also in `launch/store-kit/chrome/historyout-2.1.0-chrome.zip`. Existing 2.0.0 artifacts and dated browser reports are historical evidence, not the candidate for this review. The older marketing ZIPs have not been regenerated and must not be used as the 2.1.0 extension payload.

Chrome ZIP SHA-256: `c58e66ec184887afe3ce21856a0aab51252ada6d15810bb7055f2ec02492378c`.

## Verification

| Area | Result |
| --- | --- |
| TypeScript and production build | Passed. Existing webpack bundle-size advisories remain. |
| Extension test suite | 75 tests passed, including concurrent revisit and parent/subdomain count regressions. |
| Lifecycle behavior | Tests cover fresh install, upgrades from 1.0.1 and 2.0.0, duplicate suppression, preserved preferences/saved views, storage/tab failures and recovery. |
| Open action | Tests verify synchronous panel invocation during the click, targeting the page's stable tab ID, unsupported/rejected APIs, a not-yet-ready tab lookup, and standard modified-link behavior. |
| Packaged assets/privacy | Both pages resolve packaged resources, use external script files compatible with MV3, contain no remote passive resources, and send no history/settings in feedback links. |
| Website | Build and all 4 suites passed across 13 pages, including local links, metadata, correct contact/feedback and retained verification tag. |
| Packages | 197 audit checks passed for Chrome, Edge, Brave and generic Chromium. Candidate and packaged files match; Chrome ZIP integrity passed. No extra permissions. |
| Public contact | Chrome Web Store has the correct email. The currently published website still has the old email until this prepared website update is approved and deployed. |
| Public sitemap | Canonical sitemap responds successfully and lists 12 public URLs. Robots permits indexing and references it. This is not proof of Search Console submission. |
| Real browser | Pending. No claim is made that the new pages or panel action have been exercised in actual Chrome. |

## Complete after Mac unlock

1. Load the 2.1.0 unpacked extension into a dedicated Chrome test profile. Check automatic welcome, both local pages, the panel action, full-tab fallback, feedback link, a normal preview/export and the update flow. Confirm no remote install/update page opens.
2. Apply and verify the prepared Featurebase welcome/navigation and two pinned posts, and the contextual reply on “Custom File Name”. Preserve existing votes and status. Confirm the public result.
3. Inspect the existing Search Console property, confirm/complete ownership, submit or verify the canonical sitemap, and inspect the homepage. Record what Google actually confirms.
4. Finish visual review of the website changes, including narrower layouts, and owner review of the extension and copy.

## Launch only after approval

Submit the reviewed 2.1.0 package to the existing Chrome Web Store item. Coordinate the website/contact changes with the release; set `storeVersion` to `2.1.0` only after public availability is verified. Verify the Store listing, canonical website, privacy contact, Featurebase links and Search Console status separately. Do not treat a saved draft or pending review as a public release.

To review the website locally, run `npm --prefix website run dev` and open http://127.0.0.1:8766/. To regenerate the candidate from source, run `npm run pack` and refresh the package audit. Repacking may change the archive hash.

## Codex review fixes

The first GitHub review of PR #2 returned six P2 findings. The candidate now omits the history-search upper bound so concurrent revisits cannot exclude older visits, shows parent-site counts including selected subdomains, omits sitemap routes in noindex previews, derives QA report versions from the manifest while rejecting stale evidence, checks the footer against a fixed reviewed fixture, and rebuilds a missing historical baseline from its own source revision and lockfile.

Validation after these fixes: 75 extension tests, four website suites, TypeScript/build and 197 package checks passed. A new historical baseline was built in an empty output directory and its ZIP integrity, original manifest and built bundle were verified. The release-report generator correctly rejected old 2.0.0 evidence for the 2.1.0 candidate. Real-Chrome behavior remains a pre-release check.
