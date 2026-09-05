# Website release and domain handoff

Updated 5 September 2026. The website lives in `website/` inside the HistoryOut repository. The original site and DNS remain unchanged until the owner connects the domain.

## Current destinations

- New Sites address: https://historyout.sauliusdev.chatgpt.site/
- Existing domain: https://exportchromehistory.app/
- Existing alias: https://historyout.site/
- Sites project: `appgprj_6a9bc53bba78819185f33b92719dd87c`, recorded in `website/.openai/hosting.json`.
- Original website source revision: `7e3985ce741ba9e0b5c2f8e2945392fa93368b20`.

The original wordmark and favicon are preserved. Product screenshots, promotional compositions and narrated video are newly made. The existing website repository is retained.

## Build and content settings

`website/site.config.json` is the source of truth for the canonical origin, indexability, current store version and video metadata. Default builds allow public indexing. The welcome page is publicly accessible but has `noindex,follow`, because it serves installed users rather than search queries. The other 12 pages appear in the sitemap.

Run `npm --prefix website run build` and `npm --prefix website test`. The local preview is `npm --prefix website run dev` at http://127.0.0.1:8766/.

The homepage, three competitor comparisons, comparison hub, four useful guides, browser page, privacy page and changelog have unique metadata and canonical URLs. Static HTML contains the actual content. The footer links to all comparisons and guides. Robots allow Google and OAI-SearchBot. Structured data describes the software, articles, breadcrumbs, visible FAQs and the actual video. The original Search Console verification meta tag is retained.

## On store approval

After verifying the live Chrome Web Store serves version 2.0.0, change `storeVersion` to `2.0.0` in `website/site.config.json`. Rebuild, test, publish and verify. This removes the pending-release notes and updates software metadata. `RELEASE_V2=true` is a temporary build override, not a substitute for recording the released version. No store submission has been performed by website tooling.

## When connecting the domain

1. Preserve the existing DNS and website deployment for rollback.
2. Connect the desired domain through Sites. The owner is handling this step.
3. Set `origin` in `website/site.config.json` to the verified HTTPS canonical domain. `SITE_ORIGIN` can override it for a deliberate build.
4. Rebuild, test, push the exact website source to its configured Sites repository, save and publish that version.
5. Verify anonymous HTTPS responses, canonicals, robots, sitemap, sample downloads and all routes on the domain. Preserve the old homepage anchors and working privacy/support paths.
6. Permanently redirect obsolete hostnames to the chosen canonical hostname without redirect chains. Keep the generated Sites origin working because installed extensions use its welcome/changelog paths.
7. Submit the sitemap in Search Console and Bing Webmaster Tools. Inspect the homepage, HTML export guide and comparison pages. Verify the host allows published crawler addresses as well as the robots rules.
8. Add website analytics as planned by the owner, then update the website privacy paragraph to match what is actually enabled. Do not add extension analytics or history collection.

Opening the welcome/changelog does not pass browsing records, queries or settings to the site. Analytics for website visits must remain separate from extension data.

## Search and answer-engine foundations

Implementation follows [Google’s generative search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [OpenAI’s publisher guidance](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq) and [Google video metadata guidance](https://developers.google.com/search/docs/appearance/structured-data/video). Public access and useful, crawlable content make discovery possible; they do not guarantee indexing, citations or rankings. No hidden keyword pages, fabricated reviews or ranking promises are used.

Measure non-brand queries such as export history to HTML and the named competitor alternatives. Track visits to install links and the existing store’s install/conversion reports after analytics is enabled. ChatGPT referral URLs can carry `utm_source=chatgpt.com`.
