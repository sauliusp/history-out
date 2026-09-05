# HistoryOut v2 store listing draft

Prepared 5 September 2026 and reconciled with the v2.0.0 release-candidate UI/services. The features below are implemented in the branch; this copy has not been uploaded or published. Product testing and browser certification are tracked separately. The browser-neutral brand retains the existing store item and HistoryOut name while using completely new visual assets.

## Name

HistoryOut - Find & Export History

## Short description

Revisit your day. Find and filter browser history, then export what matters to CSV, JSON or HTML. Free and local.

## Detailed description

Find your way back to useful pages. Revisit today or yesterday, search by title or URL, and return to a project with a saved view. When you need a file, preview the matching history and export it as CSV, JSON or HTML.

HistoryOut is free. No account, no subscription, and no uploads of your browsing history.

PICK UP WHERE YOU LEFT OFF

Choose Today or Yesterday and click Preview. Your recap shows visits, pages and sites for the selected period. Explore Most visited sites or reopen a page from Your recent trail. Click Refresh when you want to include new visits.

FIND WHAT MATTERS

Search page titles and URLs. Filter by website and choose a preset or custom date range. Use Save view to keep a named set of range, filter and export settings on this device. Select it later and preview the current matching history.

PREVIEW BEFORE YOU EXPORT

Check the matching pages and visits before downloading. Keep every matching visit, or choose One row per URL to keep the latest matching visit for each URL. Use Include to choose the columns that belong in your file, including optional Domain and Timestamp fields.

The preview shows up to 100 matching rows. Your export includes every match from the loaded result.

USE YOUR HISTORY OUTSIDE THE BROWSER

- CSV: open and analyze your export in Excel, Google Sheets or another spreadsheet tool.
- JSON: use structured data in your own scripts and workflows.
- HTML: keep a readable file you can open locally in a browser.

Optional URL cleanup removes query strings and fragments from exported links. Page titles and URL paths can still contain sensitive information, so review a file before sharing it.

PRIVATE BY DESIGN

HistoryOut reads history when you choose Preview or export. Files download to your device. Your history is not uploaded to a HistoryOut server, and the extension does not add analytics or advertising. Your saved views and export settings stay in browser storage.

This update keeps the same three extension permissions: history, storage and sidePanel. HistoryOut does not delete your browser history.

USEFUL TO KNOW

HistoryOut uses the history your current browser profile makes available. It cannot recover deleted history, guarantee older account history, or create a permanent automatic archive. A saved view is a shortcut to matching available history, not an archived copy of those pages.

Visit counts describe navigation events. They do not measure time spent, productivity or a complete workday.

HistoryOut is available through the Chrome Web Store. Check the website for current browser compatibility and installation details.

WHAT IS NEW IN VERSION 2

A fresh design, daily revisiting, named saved views, searchable previews, website filtering, useful history summaries, and more control over the files you export. CSV, JSON and HTML exports remain free.

Get HistoryOut and make your browser history useful again.

## Five screenshot captions

1. Find your way back.
2. Pick up where you left off.
3. Find the pages you need.
4. Keep the detail that matters.
5. Open it. Use it. Keep it.

Use the all-new identity and actual finished UI. No old marketing images, copied competitor screenshots or invented product controls. Build the screenshots around one synthetic research dataset. Capture an actual downloaded result for the final image.

## Release-only copy checks

- Source reconciliation confirms Today/Yesterday, Most visited sites, Your recent trail and saved views are implemented. The store copy uses their actual labels and does not claim they are publicly released yet.
- Recap totals cover the loaded date range; the ready count covers filtered export rows. The optional Visit Count and Typed Count fields are URL-wide browser totals, as the UI explains.
- Query/fragment cleanup affects preview and export consistently. Searching still uses original titles and URLs; cleanup is not anonymization.
- Confirm no extension analytics, advertising, remote images or unexpected network requests undermine the privacy wording. User-opened support/store links are external destinations and should be clear.
- Confirm the final manifest still has only `history`, `storage` and `sidePanel`, with no additional optional or host permissions.
- Replace compatibility “pending” entries in the GTM matrix only with actual evidence. Do not claim Edge or Brave certification from platform documentation alone.
- Verify links to the final website/privacy/support pages after deployment. Do not put a private preview URL into the public listing.
- Keep comparison keywords in useful website content. Do not put competitor names into the store title or repeat keyword blocks.

The store listing can include the finished YouTube demo and up to five real screenshots. [Official listing documentation](https://developer.chrome.com/docs/webstore/cws-dashboard-listing), [official image requirements](https://developer.chrome.com/docs/webstore/images).
