# HistoryOut v2: market research and product decisions

Research checked: **5 September 2026**. This is a decision document for a free v2 on a separate branch, with the existing `history`, `storage`, and `sidePanel` permissions. It is not a claim that the branch has passed release QA or that v2 is already published.

## Recommendation

Make HistoryOut a useful daily way to **find your way back through browser history**, with precise export as its strongest practical outcome. Retain the HistoryOut name and existing export workflow while creating a fully new visual identity and fresh assets. Keep the product language browser-neutral, with Chrome, Edge and Brave as the first Chromium targets. Browser compatibility requires testing; shared Chromium ancestry is not a blanket support guarantee.

The opportunity is credible: focused history exporters and managers have meaningful audiences. However, CSV exports, privacy claims, and date ranges already appear across competitors. Visual design and “100% private” alone will not provide a persuasive reason to install. The best v2 story combines a recurring benefit with a demonstrable outcome: revisit yesterday's useful pages, see today's top sites, return to a saved view, and export the sources when needed. This is a personal navigation recap, not a measurement of work duration or employee productivity.

## Evidence and limits

- Competitor functionality below is **documented by the publisher or store listing**, not established by installing and testing each competitor. A feature not mentioned in a listing is **unverified**, not necessarily absent.
- User counts, ratings, and update dates are public snapshots, can change, and are rounded for larger products. They establish category scale; they are not keyword search volumes, revenue, monthly installs, or daily product usage.
- No search-volume tool, Search Console property, private Chrome Web Store dashboard, acquisition attribution, user interviews, or competitor paid checkout was available to this research pass. Channel forecasts and prioritization are hypotheses to test.
- “No paid tier verified” below does not mean a product promises to stay free. An “Offers in-app purchases” label establishes a monetization signal, not the actual price or free limits.
- Similar product names were resolved by their store IDs. In particular, the main BetterHistory product is distinct from raingart's Better History, and History Plus is distinct from the small visualization extension called History+.
- Competitor descriptions are short original paraphrases, with no reproduced reviews or long publisher passages. Recommendations, feature priorities and channel assumptions are HistoryOut-specific synthesis. Keep later comparison pages similarly concise and link to the original publisher for fuller detail.

## The starting point

The public [HistoryOut listing](https://chromewebstore.google.com/detail/historyout-export-chrome/idohnkdgejocejlkihihonhemndpiiei?hl=en) showed **858 users, 5.0 from 4 ratings, and Featured status**. It positions the product around CSV/JSON/HTML exports, custom dates, configurable columns, saved settings, and local processing. The owner estimates almost 900 users; that is consistent with this snapshot.

The checked repository starts at manifest version **1.0.1**, with exactly three permissions and no host permissions. Its UI already uses a side panel. The core export expands individual visits, which is a useful foundation. The listing spends valuable space on Material UI and bookmark anxiety; neither clearly explains why a user should choose this exporter today. Replace implementation-led copy with a real exported result.

## Competitor landscape

All rows were checked on 5 September 2026. Dates in the “Snapshot” column are the store's displayed update dates, not an assessment of product quality or maintenance activity.

| Product and primary source | Snapshot | Publisher-documented value | Pricing evidence | Implication for HistoryOut |
| --- | --- | --- | --- | --- |
| [Export Chrome History](https://chromewebstore.google.com/detail/export-chrome-history/dihloblpkeiddiaojbagoecedbfpifdj?hl=en-AU) | 90,000 users; 4.5/57; v1.0.2.0; 9 Jun 2022 | Simple CSV/JSON history export. Explicitly explains that Chrome's history limit differs from account history/Takeout. | No paid tier verified. | Closest incumbent for the head export query. Win through visible filtering, preview, and useful outputs; do not call it broken or abandoned from its update date. |
| [Quick Chrome History Export](https://chromewebstore.google.com/detail/quick-chrome-history-expo/acjbkgbpefalkaebgodhnbdgjbignonj?hl=en) | 10,000 users; 4.7/14; v1.9; 9 Jun 2026 | CSV, JSON, XLSX; simple date presets; one-click toolbar downloads; local processing without an account. | No paid tier verified. | Speed and privacy are already claimed. CSV that opens in Excel must not be advertised as native XLSX. |
| [Export History & Bookmarks to JSON/CSV/XLSX/HTML](https://chromewebstore.google.com/detail/export-history-bookmarks/bgjlmlfndondjahpjmmdldbgfhagfkdn) | User count not exposed in retrieved result; 5.0/1; v2.0.2; 19 Aug 2026 | Broad formats including XLSX/TSV, keyword/custom-date filters, chosen fields, interactive preview, bookmarks, and a local Takeout converter. | Store explicitly says “Offers in-app purchases”; exact pricing/free limits unverified. | The recent feature-rich exporter is the strongest warning that preview alone is not a unique moat. Focus on a simpler history-specific experience and transparent free access. |
| [Better History - Manage, Export, and Delete History](https://chromewebstore.google.com/detail/better-history-manage-exp/egehpkpgpgooebopjihjmnpejnjafefi) | 100,000 users; 4.7/1.6K; v7.0.0; 23 Oct 2025 | Search/RegEx, day/hour navigation, CSV/HTML export, deletion, automatic cleanup, domain rules, downloads and synced-device views. | No paid tier verified. | Large general history manager. Offer an export-focused choice, while clearly acknowledging its cleanup and management advantages. |
| [Better History - raingart](https://chromewebstore.google.com/detail/better-history/pmolchcgkagchldkgphmlaplgmagldfn?hl=en) | 4,000 users; 4.5/17; v1.32.3; 13 Aug 2025 | Replaces the browser history display; listing is sparse. | No paid tier verified. | Naming ambiguity matters for research and comparisons. Do not merge its features or reviews with betterhistory.io. |
| [History Trends Unlimited](https://chromewebstore.google.com/detail/history-trends-unlimited/pnmchffiealhkdloeffcdnbgdnedheme?hl=en) | 60,000 users; 4.5/474; v1.8.9; 23 May 2026 | Separate local archive, long-term search, interactive statistics, raw export and transfer. Uninstall deletes its saved archive; clearing native history does not clear the separate database. | No paid tier verified. | Clear leader for retention beyond Chrome's available records. HistoryOut should honestly recommend it when long-term automatic archiving is the real job. |
| [History Plus](https://chromewebstore.google.com/detail/history-plus/kloodnjmhgicecceindgbfpjencnhajh) | 9,000 users; 4.3/65; v2.0.8; 20 Nov 2024 | Beyond-90-day retention, backup/export/import, HTU-compatible imports, categories, pinning, advanced search, top sites. | No paid tier verified. | A second established archive/organization choice. Useful comparison candidate later; importing an archive is not equivalent to restoring original Chrome visits. |
| [History Trends](https://chromewebstore.google.com/detail/history-trends/nangghhladpnhlllolmdbdgeggionole) | 10,000 users; 4.6/163; v1.5.5; 13 Aug 2022 | Interactive domain/URL/time/transition charts over available history. Clearing history resets statistics. | No paid tier verified. | Small useful summaries fit v2, but a complete analytics dashboard is a separate job and not necessary to make export better. |
| [Recent History](https://chromewebstore.google.com/detail/recent-history/fbmkfdfomhhlonpbnpiibloacemdhjjm) | 40,000 users; 4.2/561; v26.4.4; 4 Apr 2026 | One-click popup for recent history, recently closed tabs, top pages and bookmarks. | No paid tier verified. | “Find that page again” has demand, but session/tab/bookmark replacement adds scope outside HistoryOut's current permissions and purpose. |
| [History Cleaner - Rayquaza01](https://chromewebstore.google.com/detail/history-cleaner/epoabannnmjdknejdggkgjoebomipene?hl=en-US) | 1,000 users; 4.1/10; v1.7.0; 11 Dec 2024 | Deletes old/all history with startup or timer triggers; starts disabled. Listing explains history, storage, notifications, downloads and alarms usage. | No paid tier verified. | Cleanup is a different intent. Excluding a domain from an export must never be presented as deleting it from Chrome history. |

Adjacent signals worth watching, not initial SEO priorities:

- [History Master - AI butler](https://chromewebstore.google.com/detail/history-master/jcbkkhgmbedkjogeihdeecnhfloomfbd?hl=en) had 91 users and documents title-based AI cleanup with configurable APIs/local Ollama. This is evidence of experimentation with AI, not evidence that adding AI would grow HistoryOut. It adds cost, support and data-flow questions to a free utility.
- [History Master - tags & comments](https://chromewebstore.google.com/detail/history-master-easy-searc/gdleenkbnlochapcmmdplpjfefkldmej) had 58 users, tagging, comments, combined search, and an in-app purchase label. Manual organization is plausible, but market evidence does not justify building a second bookmarking system now.
- [Google's Chrome data export help](https://support.google.com/chrome/answer/10248834?hl=en-GB) describes account-based export, including browser history. Takeout is an adjacent substitute to explain in a guide, especially for older account data. It does not guarantee every historical visit is available or let an extension recover deleted local records.

## What the evidence implies

**The strongest acquisition lane is the existing export job.** The 90,000-user focused exporter is better evidence for near-term demand than very small experimental AI tools. This is an inference from audience snapshots, not a measured estimate of addressable new users.

**Privacy is a trust requirement, not an exclusive feature.** Several exporters and archive tools explicitly describe local processing. HistoryOut can make its own commitment concrete: free, no account, no export uploads, unchanged permissions, useful files the user owns. Do not claim that all other extensions sell or upload history. The official [History Trends privacy policy](https://sites.google.com/site/historytrends/) also explicitly describes local data and removal of analytics.

**A much better workflow can stay narrow.** Most immediate friction sits between “all those visits exist” and “this is a file I can actually use.” Search, date accuracy, domain filters, preview, readable counts, and clean exports address that friction with data already available to HistoryOut.

**The user's real goal is not usually more columns.** Research sources, project handoffs, personal archives and spreadsheet analysis are easier to explain than browser-internal IDs and transition types. Keep advanced columns available; lead with task-level choices and examples.

**Daily usefulness can reduce one-off installation behavior.** Recent History and History Trends show established audiences for quick revisiting and browsing summaries. That does not prove retention uplift for HistoryOut. A plausible, focused experiment is Today/Yesterday, a recent revisit trail, top sites and named local project shortcuts, all computed from existing history when the user opens the extension. The user should get value without exporting every time. Avoid artificial streaks, notifications or background monitoring solely to manufacture engagement.

## Product priorities without new permissions

The table records research priorities. The source reconciliation below distinguishes implemented v2 features from deferred ideas; it does not certify a production release.

| Priority | Change | User value | Release boundary |
| --- | --- | --- | --- |
| P0 | Preserve saved v1 date/format/field preferences and the direct export path | Existing users can still complete their familiar task | New filters default to no restriction; no silent schema or timestamp-format changes |
| P0 | Correct exact-range visit retrieval and dates | A project export includes pages revisited outside the selected period | Test date boundaries, DST and repeated visits; distinguish URL metadata from individual visits |
| P0 | Reliable CSV/JSON/HTML serialization and empty/error states | Files open correctly and don't break downstream workflows | Quotes/newlines/Unicode, HTML escaping, safe links, spreadsheet formula mitigation, stable field order |
| P0 | No history deletion or remote history access introduced | A small upgrade does not create a destructive surprise | Compare required/optional/host permissions and background behavior to v1 |
| P1 | Keyword search across titles and URLs; domain include/exclude | Isolate one research topic or remove unrelated browsing from an export | Explain exact matching rules and make clear this only filters the export |
| P1 | Preview with matching visit count and a few useful summaries | Check what will be exported before downloading | Preview must reflect the same filters and snapshot as the export; distinguish rows from URLs |
| P1 | Today/Yesterday shortcuts, recent revisit trail and top sites | Resume a task or recover yesterday's useful page in a few seconds | State the selected period; navigation counts are not time spent or productivity scores |
| P1 | Named local project filter shortcuts | Return to the same topic/site without rebuilding filters | Save filter configuration, not a hidden permanent copy of history; no server sync promise |
| P1 | Unique-page export as an explicit option | Produce a clean source list instead of repeated visits | Preserve full visit log as default; state how the representative visit is chosen |
| P1 | Optional query/fragment removal | Reduce accidental sharing of tokens/search terms in exported URLs | Keep original URLs by default; warn that page titles/paths may still contain sensitive information |
| P1 | Good filenames, meaningful help, readable output | Find exports later and understand their limits | Date-range filenames; retain existing formats and column names where compatibility matters |
| P2 | Markdown/text source lists and ISO-formatted dates | Reuse sources and data in more tools | Deferred; Unix-millisecond Timestamp and Domain columns are already implemented and opt-in |
| P2 | Local Takeout converter on the website | A useful no-install entry point for older export files | Separate project after launch; process chosen files locally and document supported schemas |

### Reconciled with the v2 release-candidate source

Checked against the current UI and services on 5 September 2026. The manifest is **2.0.0** and still declares `history`, `storage` and `sidePanel`. These findings establish implementation in the branch, not public availability or hands-on browser certification.

| Research idea | Actual v2 control or behavior | Copy boundary |
| --- | --- | --- |
| Daily return value | Today/Yesterday, “Today's recap” or “Yesterday's recap,” visits/pages/sites totals, three “Most visited sites,” and clickable “Your recent trail” | Recap covers the loaded time range. It does not measure time spent, and a new visit requires Refresh to appear. |
| Reusable project filters | “Save view,” “View name,” and “Your saved views” | Saved views store range, search, website and export settings locally. Applying one restores settings; Preview or export reads the current available history. |
| Search and domain filters | “Search titles or URLs” and website selector; top-site buttons also apply a website filter | Website inclusion is implemented, including subdomains. An exclusion list is not implemented. |
| Preview confidence | Matching result count, newest-first trail and “Previewing 100 of...” when needed | The preview shows at most 100 matching rows; export includes every match from the loaded result. |
| Cleaner source list | “One row per URL” with “latest visit” label | Keeps the latest matching visit for each resulting URL. With URL cleanup enabled, URLs that become identical are combined. |
| URL cleanup | “Remove URL queries & fragments” | Applies to preview and export. It is not anonymization; original titles/URLs are used for searching. |
| Export detail | CSV, JSON, HTML and the “Include” column selector | Timestamp and Domain columns are implemented and opt-in. Timestamp is Unix milliseconds, not an ISO string. |
| Familiar download workflow | Direct “Export history,” saved v1 preferences and fixed `history-export` filename | Date-range filenames, Markdown, native XLSX and Takeout conversion remain deferred. |
| Browser fallback | Toolbar action opens an extension page if side-panel setup is unavailable or fails | This is implemented fallback logic, not evidence that every Chromium browser has been tested. |

The launch copy uses the implemented labels and retains release-candidate status. The browser matrix remains explicit about pending manual verification.

### Engineering facts that shape the positioning

The [Chrome history API](https://developer.chrome.com/docs/extensions/reference/api/history) provides URL history items and individual visit records. `search` operates on pages' last visit times, while `getVisits` returns visits for a URL. Range exports therefore need candidate URLs that include later revisits, followed by exact filtering of individual visits. A URL-level `visitCount` is not automatically a selected-period count. The API does not provide reliable active reading duration or historical page body content.

Repository inspection found that v1 applies the chosen `endTime` to candidate search before expanding visits. That is a release-check target: a page visited inside the requested period and again later can be missed. It also reuses URL-wide visit/typed counts on expanded visit rows. Summing those repeated counts would overstate any v2 dashboard totals. The engineering implementation must resolve or clearly label these semantics.

The current source already downloads via a local Blob and an anchor. Better export formats, summaries and client-side filters do not intrinsically require a `downloads` permission. All changes still need a final manifest and network audit; permission count alone does not establish private behavior.

### Defer deliberately

- Automatic deletion and scheduling: higher consequence than an exporter and not needed to prove v2 value.
- Unlimited/permanent history archiving: technically a different storage/retention promise, requiring quota, migration, deletion and backup design. Do not imply it is impossible with existing APIs; defer it because the commitment and failure modes are larger.
- AI summaries, semantic page-body search, screenshots of visited pages, or cloud sync: outside the focused free/local export proposition and not supported by the current history-only data.
- Bookmarks, downloads, active tab inspection and recently closed session restoration: additional product scope with separate permission considerations.
- Claimed time tracking, billable hours or forensic proof: visits establish navigation events, not attention, work duration, identity or a complete record.

## Truthful comparison and content targets

The **product brand says browser history**. Chrome-specific search pages below deliberately match how people search and the current store distribution. Add Edge/Brave installation guides only when an exact tested build and clear instructions can be documented. Do not create duplicate pages by changing only the browser name.

Search volumes are **unmeasured**. Priority is based on task relevance and observed competitor scale. Start with the first three comparisons plus three useful guides; expand only after indexing and query evidence arrive.

| Priority | Query family / page concept | Useful answer | Required honesty |
| --- | --- | --- | --- |
| 1 | Export Chrome History alternative | Compare simple CSV/JSON export with HistoryOut's verified filtering/preview workflow | Name the exact incumbent; mark unverified competitor features as unverified |
| 1 | Better History alternative | Explain when an export-focused side panel is enough | BetterHistory provides cleanup/management features HistoryOut does not |
| 1 | History Trends Unlimited alternative | Explain export-first vs persistent archive needs | Recommend HTU when beyond-Chrome automatic retention is the main goal |
| 1 | Export Chrome history to Excel / CSV | Show an actual sample and import steps | CSV is Excel-readable, not a native `.xlsx` workbook |
| 1 | Export Chrome history by date / website | Demonstrate the exact v2 workflow | Only describe shipped filters; show the available-history limitation |
| 1 | Chrome history older than 90 days / Takeout | Explain available browser records vs account exports and backups | No recovery promise; Chrome/Google settings and available data vary |
| 2 | HistoryOut alternatives | A short impartial alternatives guide tied to the user's job | Let visitors choose a competitor if it fits better; do not call HistoryOut universally best |
| 2 | History Plus alternative; Quick Chrome History Export alternative | Focused comparison only if queries or referral evidence justify a page | A real decision guide, not a copy with a substituted product name |
| Defer | History Cleaner alternative; generic best history extension; AI history | Different or overly broad jobs | Do not attract deletion/AI users with a capability HistoryOut does not offer |

Each comparison should contain a short recommendation, genuine tradeoffs, a dated feature table, links to primary sources, the author/publisher disclosure, a working HistoryOut demo, and a useful next step. Competitor names identify the comparison; no implied affiliation or fabricated endorsement. Avoid hardcoded live audience figures in evergreen marketing copy.

## What remains unknown

1. The existing channels responsible for installs and the current store conversion rate.
2. Which languages/countries have the strongest demand and which users return after one export.
3. Whether preview, unique-page lists, filtering, or new formats materially influence installation.
4. Actual keyword volume and difficulty; current Search Console ranking and indexing status.
5. Competitor free limits, performance, edge cases and exact permission manifests without hands-on testing.
6. Existing users' compatibility requirements for exported files.

Use the first release and acquisition experiments to answer these questions. A promise of tenfold growth would go beyond the evidence; a focused product, honest pages, demonstrable results and a measured distribution plan are justified.
