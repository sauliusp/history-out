# Website migration handoff

Prepared **5 September 2026**. The website is now maintained inside the extension repository under `website/`. It has a static Node build and Sites configuration. **No production DNS cutover or store update has been performed.**

## Provenance and destinations

| Item | Recorded value |
| --- | --- |
| Original website source revision | `7e3985ce741ba9e0b5c2f8e2945392fa93368b20` |
| Existing canonical domain from migration discovery | [exportchromehistory.app](https://exportchromehistory.app/) |
| Existing alias | [historyout.site](https://historyout.site/) redirects to the canonical domain |
| New source | `website/` in the HistoryOut repository |
| Sites project configuration | `website/.openai/hosting.json`, project `appgprj_6a9bc53bba78819185f33b92719dd87c` |
| Preview build origin | [historyout.sauliusdev.chatgpt.site](https://historyout.sauliusdev.chatgpt.site/) |
| Build output | `website/dist/` |

The old Jekyll `_config` is stale and must not be treated as current production routing evidence. Preserve the recorded source revision for reference. All new icon, product and promotional visuals use the new identity; existing imagery is not reused.

The preview origin is a review destination with indexing disabled. Its configuration alone does not establish deployment completion or access control. Check the current Sites deployment state before sharing it as a working preview.

## Build and local checks

```sh
npm --prefix website run build
npm --prefix website test
npm --prefix website run dev
```

The development server builds first and serves [127.0.0.1:8766](http://127.0.0.1:8766). The default build uses `noindex,nofollow` and `robots.txt` disallowing crawling. A sitemap is still generated for inspecting route coverage. The tests check preview state, page metadata, local links, structured data and no remote script/image sources.

The 11 routes are:

```text
/
/alternatives/
/alternatives/export-chrome-history/
/alternatives/history-trends-unlimited/
/alternatives/better-history/
/guides/export-chrome-history-to-excel/
/guides/filter-browser-history/
/guides/browser-history-limits/
/browsers/
/privacy/
/changelog/
```

Production output requires both flags explicitly:

```sh
RELEASE_V2=true SITE_ORIGIN=https://exportchromehistory.app npm --prefix website run build
```

This command only builds files. It changes generated indexing metadata, canonicals, sitemap origin, release banner/CTA and version fields; it does not deploy, connect a domain, change DNS or publish the extension. Existing preview-only tests intentionally expect blocked indexing, so production output needs its own explicit release validation.

## Before a public build

- [ ] Recheck the live canonical/alias behavior and inventory current public URLs, policy links, redirects and ownership verification. Preserve useful existing URLs or document exact replacement redirects.
- [ ] Review the original source revision and retained license/ownership material. Do not infer current routing from stale Jekyll configuration.
- [ ] Update hardcoded candidate notes in `website/content/pages.mjs`, especially guides, browser compatibility and changelog. `RELEASE_V2=true` does not rewrite those paragraphs.
- [ ] Ensure public copy matches the actual store version and named-browser evidence. Do not claim store-signed or visible Edge/Brave testing from automated API checks.
- [ ] Confirm final screenshots/video are completed assets with synthetic data. A placeholder, storyboard or still animation must not be described as an actual product recording.
- [ ] Confirm privacy/support links, sample exports, browser-neutral brand text and deliberate Chrome-query guide titles.
- [ ] Build with the production origin and inspect every route for title, canonical, description, schema, indexability and missing assets. Check that no preview hostname or stale v1/candidate statement remains where it would mislead.

## Deliberate deployment and cutover

- [ ] Preserve the current site's working deployment and DNS values for rollback.
- [ ] Save the reviewed website version in Sites and deploy the intended production version after release review. Record version/deployment IDs and source commit.
- [ ] Coordinate website v2 claims with publication of the approved extension. Keep the current-version CTA truthful until the store serves v2.
- [ ] Connect the intended custom domain and perform the DNS change as a separate deliberate production step. Preserve unrelated DNS records and aliases.
- [ ] Verify live HTTPS on the canonical domain, alias and applicable `www` variants; validate permanent redirects and avoid loops.
- [ ] Check all 11 live routes, privacy/support links, sample downloads, mobile layout, missing-page handling and unexpected remote assets.
- [ ] Confirm live robots, sitemap, HTML robots tags, canonical/OG URLs and schema use the production origin and released version.
- [ ] Preserve Search Console ownership verification; submit the live sitemap and inspect key URLs. Allow Googlebot and OAI-SearchBot through the production host's crawler controls where intended.

If cutover fails, restore the prior known-good website/DNS state and keep public copy consistent with the store. Do not disable the existing extension or delete history as part of website recovery.
