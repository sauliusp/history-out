# HistoryOut Search Console verification

Checked 9 September 2026. Account-side verification and sitemap submission are pending because the Mac was locked.

## Verified public prerequisites

- Canonical website: https://exportchromehistory.app/.
- Apex, www and privacy page return HTTP 200. The www homepage declares the apex as its canonical URL.
- The HTML permits search indexing and already includes a google-site-verification tag. The prepared website preserves it.
- https://exportchromehistory.app/robots.txt returns HTTP 200, allows crawling and references the canonical sitemap.
- https://exportchromehistory.app/sitemap.xml returns HTTP 200 and contains 12 public URLs. The welcome page is intentionally excluded and noindexed.
- The current apex TXT lookup did not show a Google verification token. This does not establish whether a URL-prefix property is already verified in Search Console.

The live verification tag is J9EsmoQ_afZAfv1vTpVgo5bu_xHrSMfvtdjN_fUqgrs. This is public verification markup, not an authentication credential. Preserve it unless the actual Search Console flow requires an additional tag.

## Account-side steps

1. Open Google Search Console in the authorized account and inspect existing HistoryOut properties before creating another one.
2. If the canonical URL-prefix property exists, confirm ownership status. Otherwise add https://exportchromehistory.app/ and use the matching verified HTML tag. If the current account requires a different tag, retain existing verification and add the required tag only after inspecting the real flow.
3. If a Domain property is desired or already pending, obtain its exact DNS TXT value from Search Console. Do not invent a token or replace unrelated DNS records. Verify the actual published TXT record, then complete Verify.
4. Submit https://exportchromehistory.app/sitemap.xml under the verified canonical property. If already submitted, inspect its status rather than duplicating it.
5. Record Google's submitted status, last read and discovered-page count. A successful HTTP fetch is not a successful Search Console submission.
6. Inspect the homepage URL and record whether it is indexed, eligible, or has an issue. Request indexing if appropriate. A request is not proof that indexing is complete.

## Completion evidence to record

- Property URL or domain and verified owner status.
- Sitemap submission status and any retrieval error.
- Last read and discovered pages as shown by Google.
- Homepage inspection result and any indexing request.

No DNS settings, Search Console properties or sitemap submissions were changed during the locked session.
