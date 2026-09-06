# Website release and domain handoff

Updated 6 September 2026. The website lives in `website/` inside the HistoryOut repository. Namecheap web records now point the existing domain to Sites. Nameservers, email forwarding, SPF and the old hosting verification records are preserved. The original web records are saved in `launch/qa/domain-cutover/dns-before.json` for rollback.

The current public publication is Sites version 6, from exact source commit `c3d0b920a33bf50ddf768dacc316f8742e2aaf76`. Deployment `appgdep_6a9d9eb74564819196de1fce703b8be1` succeeded on 6 September 2026. It sets the canonical origin to `https://exportchromehistory.app` and adds an explicit Chrome Web Store Limited Use disclosure. Export-first content, the 25-second narrated demo and all imagery remain unchanged. Current domain verification is recorded in `launch/qa/domain-cutover/`; earlier media evidence remains in [public-voice-refresh.json](../qa/public-voice-refresh.json).

## Current destinations

- Canonical domain: https://exportchromehistory.app/
- Additional hostname: https://www.exportchromehistory.app/
- Working Sites fallback: https://historyout.sauliusdev.chatgpt.site/
- `historyout.site` currently has no public DNS records. It is not a working alias.
- Sites project: `appgprj_6a9bc53bba78819185f33b92719dd87c`, recorded in `website/.openai/hosting.json`.
- Original website source revision: `7e3985ce741ba9e0b5c2f8e2945392fa93368b20`.

The original wordmark and favicon are preserved. Product screenshots, promotional compositions and narrated video are newly made. The existing website repository is retained.

## Build and content settings

`website/site.config.json` is the source of truth for the canonical origin, indexability, current store version and video metadata. Default builds allow public indexing. The welcome page is publicly accessible but has `noindex,follow`, because it serves installed users rather than search queries. The other 12 pages appear in the sitemap.

Run `npm --prefix website run build` and `npm --prefix website test`. The local preview is `npm --prefix website run dev` at http://127.0.0.1:8766/.

The homepage, three competitor comparisons, comparison hub, four useful guides, browser page, privacy page and changelog have unique metadata and canonical URLs. Static HTML contains the actual content. The footer links to all comparisons and guides. Robots allow Google and OAI-SearchBot. Structured data describes the software, articles, breadcrumbs, visible FAQs and the actual video. The original Search Console verification meta tag is retained.

## On store approval

After verifying the live Chrome Web Store serves version 2.0.0, change `storeVersion` to `2.0.0` in `website/site.config.json`. Rebuild, test, publish and verify. This removes the pending-release notes and updates software metadata. `RELEASE_V2=true` is a temporary build override, not a substitute for recording the released version. No store submission has been performed by website tooling.

## Domain configuration and ongoing tasks

1. Preserve the existing DNS and website deployment for rollback.
2. Sites domain registrations cover both the apex and `www`. Apex A records are `162.159.143.30` and `172.66.3.26`; `www` is a CNAME to `custom-domains.chatgpt.site.`. Four separate TXT ownership records are configured. Web-record TTL is 300 seconds.
3. Set `origin` in `website/site.config.json` to the verified HTTPS canonical domain. `SITE_ORIGIN` can override it for a deliberate build.
4. Rebuild, test, push the exact website source to its configured Sites repository, save and publish that version.
5. Verify anonymous HTTPS responses, canonicals, robots, sitemap, sample downloads and all routes on the domain. Preserve the old homepage anchors and working privacy/support paths.
6. Both hostnames serve the same static site with canonical metadata pointing to the apex. The supported static Sites configuration does not expose a hostname redirect, so no `www` redirect is claimed. Keep the generated Sites origin working because installed extensions use its welcome/changelog paths. Do not add a shared unconditional redirect that would loop on the apex.
7. Submit the sitemap in Search Console and Bing Webmaster Tools. Inspect the homepage, HTML export guide and comparison pages. Verify the host allows published crawler addresses as well as the robots rules.
8. Add website analytics as planned by the owner, then update the website privacy paragraph to match what is actually enabled. Do not add extension analytics or history collection.

Opening the welcome/changelog does not pass browsing records, queries or settings to the site. Analytics for website visits must remain separate from extension data.

## Search and answer-engine foundations

Implementation follows [Google’s generative search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [OpenAI’s publisher guidance](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq) and [Google video metadata guidance](https://developers.google.com/search/docs/appearance/structured-data/video). Public access and useful, crawlable content make discovery possible; they do not guarantee indexing, citations or rankings. No hidden keyword pages, fabricated reviews or ranking promises are used.

Measure non-brand queries such as export history to HTML and the named competitor alternatives. Track visits to install links and the existing store’s install/conversion reports after analytics is enabled. ChatGPT referral URLs can carry `utm_source=chatgpt.com`.
