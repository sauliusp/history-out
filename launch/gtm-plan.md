# HistoryOut: focused growth and launch plan

Updated **6 September 2026**. Goal: grow from approximately **900 to 9,000 reported users**, while remaining free and retaining the three existing extension permissions. The research baseline and competitor sources are in [market-research.md](./market-research.md).

This plan and its copy were reconciled with the v2.0.0 UI/services on 5 September 2026. Daily recap, saved views, search, website filtering, preview and the described export controls are implemented in the release-candidate source. Public availability and hands-on browser certification remain separate checks. Proposed channels, experiments and publication steps below have not been executed merely by writing this document.

## Positioning

**Category:** free browser history exporter with control over the result.

**Primary user:** someone who needs a useful record of past browsing: a researcher collecting sources, a professional reconstructing a project's links, or a person analyzing available history in a spreadsheet.

**Core promise and hero:** Export your browser history. CSV, JSON or HTML.

**Supporting brand line:** Your export. Your way.

**Supporting copy:** Choose your dates and columns. Filter the pages you need. Save CSV for a spreadsheet, JSON for a script or HTML for a page of clickable links. Free, with no account and local processing. Daily recaps and saved views add value between exports.

**Primary CTA:** Get HistoryOut free.

**Secondary CTA:** See a sample export.

The sample should open a synthetic, useful file or a readable explanation. It must not ask for a real browsing-history upload. Show export formats and a useful file within the first screen. Keep the exact original HistoryOut name, wordmark, icons, favicon and store ID so the current reputation and update path carry forward. Create fresh promotional layouts and screenshots around those existing brand assets. Keep donation prompts in the extension interface and out of promotional imagery. Product language is browser-neutral; the destination is explicitly the Chrome Web Store where appropriate.

### Why this position

Export is the established reason people install HistoryOut. Make CSV, JSON and readable HTML immediately visible, then explain control over dates, columns and matching pages. Broad managers own cleanup and long-term archive use cases. Daily recaps and saved views give existing users reasons to return between exports, without displacing the primary promise or implying a permanent archive.

Use privacy as concrete supporting evidence. “Three permissions, unchanged from v1” belongs in an upgrade note or detailed privacy explanation. The install-facing benefit is “Your history is processed in your browser.” Avoid “zero permissions,” “anonymous exports,” “unlimited history,” “recover deleted history,” “native Excel export,” and “tracks time spent” unless the final implementation and evidence actually support those statements.

## Store listing copy direction

Use **HistoryOut - Export Browser History** as the browser-neutral store title. Do not turn the title into a list of competitor or browser names. The full copy draft is in [store-listing.md](./store-listing.md).

Proposed short description:

> Export browser history as CSV, JSON or HTML. Choose dates, columns and matching pages. Free, local and no account.

Proposed first paragraph:

> Export your browser history as CSV, JSON or readable HTML. Choose your dates and columns, search or filter for the pages you need, and preview the result before downloading. HistoryOut is free and processes your history locally.

Recommended description order:

1. CSV for spreadsheets, JSON for structured data, HTML for a readable local page.
2. Date, column and relevance controls, with a concrete research/project example.
3. Daily recaps and saved views as useful supporting features.
4. Local processing, no account, no new permissions in this update.
5. “Exports the history your browser currently makes available. It cannot recover deleted history or guarantee older account history.”
6. A brief v2 upgrade note and support link.

Remove the Material UI explanation and unrelated product promotions from the primary task flow. Existing users want a trustworthy export; the listing should show what they can accomplish. Google recommends a concise opening and accurate metadata, and supports a YouTube demonstration link in the listing. [Official listing guidance](https://developer.chrome.com/docs/webstore/cws-dashboard-listing).

## Website migration and content

Keep the existing **exportchromehistory.app** domain as the intended canonical destination. Bringing the website into the repository and preparing it for ChatGPT Sites should improve maintainability without casually discarding existing URLs or traffic. The migration should preserve useful old content and map each changed URL to an appropriate replacement.

Minimum initial content:

| Page | Job | Proof on the page |
| --- | --- | --- |
| Home | Explain CSV, JSON and HTML export, then customization | Real export controls, sample output, clear CTA, visible limits; daily workflows lower on the page |
| Export to Excel/CSV guide | Resolve a specific task | Synthetic CSV, actual import directions, timestamp/column explanation |
| Date and website filtering guide | Demonstrate v2 value | One realistic before/after example |
| Chrome history limits guide | Prevent the wrong installation | Available local history vs account exports/backups; useful alternatives |
| Three initial comparison pages | Help visitors choose between approaches | Dated primary sources and genuine competitor advantages |
| Privacy and support | Explain trust and resolve friction | Exact extension behavior, permission purposes, version, contact/support destination |

Implementation requirements: static or prerendered primary content, unique titles/descriptions/canonicals, descriptive internal links, sitemap, working robots rules, responsive layout, useful 404 behavior and valid public URLs. Structured data should describe the visible product accurately; a free price can be represented as zero, but avoid fabricated aggregate ratings or copied review counts. Do not assume FAQ markup will obtain a rich result.

For the migration, inventory currently reachable paths first. Keep URLs stable where possible; use permanent redirects for true replacements; verify apex/www and HTTPS behavior; preserve ownership verification and policy links; verify the live HTML after deployment. A Git commit or Sites version save is not evidence that the production domain serves the new site.

### Browser compatibility and public claims

The brand is browser-neutral. The current distribution remains the existing Chrome Web Store item. That choice of store does not prove every Chromium browser supports every API. Microsoft documents Chromium extension reuse and calls out API differences; Edge also documents `chrome.sidePanel`. Brave and Vivaldi document installation from Chrome Web Store. These are platform facts, not hands-on certification of HistoryOut v2. [Microsoft extension compatibility](https://learn.microsoft.com/en-us/microsoft-edge/extensions/), [Edge sidebar API](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/sidebar), [Brave installation](https://support.brave.app/hc/en-us/articles/360017909112-How-can-I-add-extensions-to-Brave), [Vivaldi extension installation](https://help.vivaldi.com/desktop/appearance-customization/extensions/).

| Browser | Current evidence | v2 status in this research pass | Required release evidence |
| --- | --- | --- | --- |
| Chrome desktop | Existing published v1; actual isolated Chromium 149 MV3/API test passed | v2 candidate; visible toolbar/store-signed checks pending | Exact browser/build/OS, toolbar open, date/search/recap, all file formats, signed v1 update |
| Edge desktop | Official support plus isolated headless v2 worker/history/side-panel API smoke | API smoke passed; visible and signed-install verification pending | Sidebar open/close, reload/restart, storage, all export formats |
| Brave desktop | Official CWS extension installation support | Targeted; manual verification pending | Toolbar open, working panel or page fallback, history access and downloads |
| Vivaldi and other Chromium desktop browsers | Vivaldi documents CWS extension support; APIs may vary | Candidate compatibility only; untested | Same task checks plus full-page fallback where the side-panel API is absent |
| Firefox, Safari, mobile browsers | Outside this Chromium package's scope | Not supported by this release plan | Separate engineering/distribution effort before any support claim |

The implementation detects unavailable or failed side-panel setup and opens a normal extension page without new permissions. The generic Chromium package removes the sidePanel permission/configuration and explicitly uses this page mode. A fallback reduces one compatibility failure mode but does not certify a browser. Follow [browser-compatibility.md](./browser-compatibility.md) for the latest evidence and outstanding checks. Do not show “works everywhere,” “all browsers,” a fully supported logo row, or an Edge store badge unless the underlying claim is true.

### Search and ChatGPT discoverability

Write pages that answer a specific decision in the first paragraph and then substantiate it. Comparison pages should explicitly acknowledge that they are published by HistoryOut. Give crawlers and people the same useful visible text, dated sources, screenshots and examples. Avoid dozens of thin alternative pages or fabricated benchmark tables.

Google states that normal SEO fundamentals apply to its AI search features; no special AI file or schema is required. Indexable, crawlable text and structured data consistent with the visible page matter. [Google AI search guidance](https://developers.google.com/search/docs/appearance/ai-features). Google also identifies doorway pages and scaled low-value content as spam patterns. [Google search spam policies](https://developers.google.com/search/docs/essentials/spam-policies).

For ChatGPT search, allow **OAI-SearchBot** in robots rules and ensure the host does not block its published IP ranges. This control is separate from **GPTBot** training access. Allowing the crawler makes discovery possible; it is not a placement or citation guarantee. Do not change a site's training preference as a side effect of enabling search discovery. [Official OpenAI crawler documentation](https://developers.openai.com/api/docs/bots).

After publication, verify canonical URLs and sitemap accessibility, then inspect indexability in the owner's Search Console. Measure actual queries and useful referral traffic over time. Test a small fixed set of question prompts monthly as a qualitative check; personalized or variable AI answers are not a stable ranking metric.

## Five new screenshots

Use a dedicated synthetic browsing dataset with plausible public research pages. No private history, client names, account URLs, personal searches or fabricated testimonials. Capture the real finished UI, then compose only accurate labels around it. Store both raw captures and final assets so screenshots can be regenerated after UI changes.

Google permits up to five screenshots and recommends **1280 × 800**; **640 × 400** is also supported. Screenshots should be full bleed, square-cornered and demonstrate the actual experience. Also prepare the required **440 × 280** promotional tile; a **1400 × 560** marquee image is optional. [Official image requirements](https://developer.chrome.com/docs/webstore/images).

| Order | Headline | What the image must prove |
| --- | --- | --- |
| 1 | Find your way back | Real daily recap with Today/Yesterday, “Your recent trail” and readable “Most visited sites” |
| 2 | Pick up where you left off | Named local saved view, then Preview to read the matching current history |
| 3 | Find the pages you need | Real search, website or date filter and matching results |
| 4 | Keep the detail you need | Actual Include, One row per URL, or Remove URL queries & fragments controls; pick one clear story |
| 5 | Open it. Use it. Keep it. | Real generated spreadsheet-readable or HTML output with useful titles, dates and links |

At thumbnail size, the benefit and essential UI must remain legible. Avoid five shots of settings, tiny full-browser captures, fake UI features, dense prose, unsupported performance claims or review stars. Recap totals describe the loaded range; the ready count describes matching export rows. Keep this distinction visible in captions.

## Focused YouTube video

Produce one **50-second** demonstration of resuming yesterday's research and exporting its sources. The video should answer “What does this do for me?” in five seconds and show the downloaded result. One coherent workflow will communicate more than a tour of every setting. The production-ready script is in [video-script.md](./video-script.md).

Suggested product video title: **HistoryOut: Find yesterday's pages. Keep the useful links.** A separate how-to title can target the intentional search phrase “export Chrome history to CSV” without making the product brand Chrome-only.

| Time | Screen action | Suggested narration |
| --- | --- | --- |
| 0–5 s | Show Yesterday and a useful revisitable page | “Where was that useful page from yesterday? Find your way back with HistoryOut.” |
| 5–13 s | Show Today/Yesterday, top sites and recent pages | “See the pages and sites from your day, then reopen what matters.” |
| 13–23 s | Select a saved view, click Preview, and demonstrate the matching filter | “Return to a saved view, or search your titles and links.” |
| 23–33 s | Narrow dates or website; inspect preview | “Choose the history you need and check the result before exporting.” |
| 33–43 s | Download CSV and open the real file | “Save it as CSV for a spreadsheet, JSON, or a readable HTML file.” |
| 43–50 s | New brand end card with one CTA | “Free. No account. Your history stays in your browser until you export it. Get HistoryOut.” |

Record at 1920 × 1080; use readable browser zoom, deliberate cursor movement, clean audio and burned-in captions plus a caption file. No fake speed-up that makes a long export look instant. Use synthetic data and label it in the description. No introductory logo animation. A thumbnail can say “Find that page again” with a real recap crop. Use the same video on the website and in the store listing after the v2 result is live.

Description opening:

> Find yesterday's useful pages and keep the links that matter. This short HistoryOut demo shows a daily recap, a saved view, and a CSV file ready for a spreadsheet. HistoryOut is free and processes browsing history in your browser.

Below it, include the canonical website/store links, a short note that the demo uses example data, the available-history limitation, and support. A finished video file, captions and thumbnail are deliverables; publication to YouTube remains a separate externally visible action.

## A realistic path toward tenfold growth

Treat **9,000 reported users in 12 months** as a planning target, not a forecast or a result that a single release can guarantee. From 900, the arithmetic requires 8,100 additional reported users. Reported users, installs, removals and in-product activity are different measures.

For a simplified planning model only, if one acquired install becomes one reported user and retention is stable:

| Assumed monthly attrition | Constant new users needed each month | Approximate average per day |
| --- | --- | --- |
| 0% | 675 | 22 |
| 3% | 821 | 27 |

The second row uses `A_next = A_current × 0.97 + new_users` for twelve months. This is not how every Chrome metric is calculated, and no current attrition or conversion rate has been verified. Use it to see the order of magnitude required, then replace assumptions with dashboard observations.

### Distribution priorities

| Priority | Work | Why | Evidence to continue |
| --- | --- | --- | --- |
| 1 | Improve the current CWS listing, five images and short demo | Existing discovery can convert better without waiting for SEO | Comparable-period listing visits, installs and removal trend |
| 1 | Publish focused export guides and three truthful comparisons | Capture existing task intent and competitor evaluation | Pages indexed; relevant queries/impressions; visits that continue to the store |
| 1 | Make revisiting useful and the first export effortless | A recurring task gives people a reason to keep the extension | Voluntary users can reopen a useful page quickly, return on another day, and complete an export |
| 2 | Publish the focused YouTube tutorial | Gives searchable visual proof and reusable launch material | Search views, watch retention, description-link traffic |
| 2 | A small number of useful community posts and tutorials | Reach people already asking the exact question | Qualified visits and useful feedback; stop if communities do not welcome promotion |
| 2 | Relevant outreach to spreadsheet/research educators and existing tutorial authors | A credible example can earn enduring referrals | Replies/links and attributable traffic, not just outreach volume |
| 3 | Localize the product/listing for the strongest demonstrated language | Expands demand without speculative translations | Dashboard country/language evidence and a native review of actual UI |

Do not budget for paid acquisition before a free product has a clear distribution or funding reason. Do not buy reviews, gate features behind ratings, spam competitor reviews, or imply affiliation. The plan does not authorize sending outreach or posting on the owner's behalf; prepare concrete drafts and execute through the owner-approved channel when authorized.

### Daily-use retention experiment

Give voluntary testers three concrete jobs: choose Yesterday and Preview to reopen a useful page, resume a named saved view the next day, and export the relevant links at the end of the week. Ask which task helped and which controls confused them. A repeat visit without an export can be a successful outcome. This research can be done with user feedback without logging browsing history or adding extension telemetry.

Use honest language: “your day in browser history,” “Your recent trail” and “Most visited sites.” Never label counts as productive time, focus scores, a complete work log, or an employee-monitoring report. A saved view stores range, filtering and export preferences; it is not a saved immutable archive of pages. The user chooses Preview or export to read history, and Refresh to include new visits. Exports remain optional.

### First 90 days

**Days 1–14: make the release trustworthy.** Complete v2 QA, preserve v1 settings and schemas, produce assets from the final build, record the baseline and prepare the website migration. Recruit a small voluntary test group through the owner's existing channels. Observe users completing a first export without collecting their browsing history. Fix repeated confusion before widening promotion.

**Days 15–30: launch one coherent story.** Publish the approved package and matching website/store assets, then release the short tutorial. Review support and removals daily for the first week. Verify the deployed pages, store version and sample files. Submit the sitemap and inspect key pages using the owner's Search Console.

**Days 31–60: learn which channel works.** Examine page queries and referrals; improve the pages that attract relevant visitors. Run a sequential first-screenshot or opening-copy experiment while keeping the rest of the listing stable. Publish one deeper practical guide based on actual questions. Send a limited set of approved, tailored outreach messages with a real example file or tutorial.

**Days 61–90: concentrate effort.** Continue the two sources producing the best qualified traffic. Revise weak-intent pages instead of multiplying them. Consider one localization only if install/query data supports it. Use repeated user feedback to choose the next small feature. Reset the 12-month projection using observed acquisition and retention trends.

## Measurement without extension telemetry

Use Chrome Web Store's existing aggregate reports, website Search Console and YouTube Analytics first. Do not add extension analytics to answer a marketing question. Google documents installs/removals, impressions and user reports, and notes that the user statistic does not establish active use of extension features. [Official store metrics guidance](https://developer.chrome.com/docs/webstore/metrics).

Create a weekly sheet with date, extension version, listing/content changes, installs, removals, reported users, store listing visits when available, organic clicks, relevant queries, and YouTube views/link traffic. Record source definitions so impressions are not mistaken for listing page visits. Store conversion should use a comparable listing-visit denominator where provided, not indiscriminately divide installs by every impression.

For optional website click measurement, collect only coarse aggregate CTA/source data after deciding on and documenting the website measurement setup. Never send browsing-history rows, searched terms inside the extension, visited domains, exported filenames or persistent extension identifiers. Tagged public marketing links can identify a campaign; they do not establish that every click installed the extension. No analytics service is implied to have been installed by this plan.

Suggested review thresholds are decisions, not industry benchmarks:

- After a 28-day baseline and a comparable 28-day test, look for a clear improvement in install conversion without a rise in removal/support problems. Small samples may remain inconclusive.
- Do not assess a fresh SEO page as failed solely because it has no installs in week one; first verify discovery, indexing and relevant queries.
- If listing visits rise while installs do not, fix relevance/clarity before building more pages.
- If new installs rise but the reported base does not, inspect removal and version/language trends before assuming the acquisition worked.
- If a critical export regression appears, stop promotion and repair or roll back promptly. Do not wait for an arbitrary metric threshold.

## Release safeguards for the existing audience

The v2 working branch should retain a known-good v1 package and a clear changelog. Verify update behavior in a dedicated Chrome test profile with representative v1 settings. Test old/new format compatibility, exact dates, large histories, cancellation/errors, no-results exports and URLs/titles containing difficult characters. Keep download formats and direct-export defaults familiar.

A percentage rollout is **not a dependable option at this audience size**: Google's published requirement is more than 10,000 seven-day active users. Use a tested branch, separate voluntary testers, deferred publishing if available, and a ready rollback/hotfix procedure. Do not change the existing public item to private just to test v2. [Official update and publishing guidance](https://developer.chrome.com/docs/webstore/update).

The final launch handoff should identify the branch/commit, reviewed manifest permission diff, package path/checksum, verification completed and limitations, screenshot/video files, website deployment state, store copy, and the exact production action still pending. “Built,” “packaged,” “submitted,” “approved,” and “published” are separate states.
