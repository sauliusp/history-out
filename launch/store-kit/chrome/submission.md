# Chrome Web Store localization update

Prepared 21 November 2026. Update the existing item `idohnkdgejocejlkihihonhemndpiiei` to preserve users, reviews and the update path. Version 2.1.0 was confirmed published in the signed-in developer dashboard. Version 2.2.0 is the localization candidate.

The user requires a separate branch, thorough regression tests and a Codex review of the PR into `main` before live publication. Building this kit does not upload, submit or publish anything. Track the actual review and release state in `launch/review-2.2.0.md`.

## Upload fields

Use the root `listing.json`, `description.txt` and `changelog.txt` for English. Each directory in `locales/` contains the corresponding complete fields and five ordered screenshots for `zh_CN`, `es`, `de`, `pt_BR`, `fr` and `ja`.

1. Upload only the final tested `historyout-2.2.0-chrome.zip` to the existing item. Never upload the outer marketing kit as an extension package.
2. The package supplies localized names and summaries. Check each against the matching locale metadata.
3. Use the five files in `screenshots/` for English and `locales/<locale>/screenshots/` for that language. Each is 1280 × 800, opaque PNG and captures the actual localized interface with fictional data.
4. Preserve the original icon and the existing global YouTube video: https://youtu.be/cGybkRSkk2Y. The video and thumbnail are unchanged.
5. Chrome Web Store does not support localized small or marquee promo tiles. Keep the existing approved global tiles. The complete localized tile variants in the kit are for reuse and the Edge handoff, not repeated CWS global-tile replacement.
6. Use the matching localized website and privacy URLs. Verify each anonymously after website deployment.
7. After the required PR review, resolve findings, complete tests, merge the reviewed change and follow the authorized publication sequence. Verify saved draft, review submission and public availability as separate states.

The icon is the byte-identical original. Screenshots are 1280 × 800; small tiles are 440 × 280 and marquees are 1400 × 560. See [Chrome listing localization](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) and [image requirements](https://developer.chrome.com/docs/webstore/images/).

## Privacy field text

Single purpose: Help users find, revisit, filter and export the browsing history available to their current browser profile.

`history`: Read available navigation history and visits when the user chooses Preview or export, to display matching results and create the user's chosen local file. History is not uploaded or deleted.

`storage`: Keep export preferences, named saved views and the install/update page state in local browser storage. Browsing history is not stored as a persistent extension archive.

`sidePanel`: Show HistoryOut beside the current page so users can find and export history without losing their browsing context.

Remote code: No. The extension runs code bundled in its package.

Data handling: Browsing history is accessed locally for the user's requested workflow. It is not transmitted to the developer, sold or shared with third parties. User-triggered links open external websites, including the store, support and optional contribution page. Welcome and update pages are packaged inside the extension and make no website request when they open. Clicking Suggest a feature visits the public Featurebase board without attaching browsing history, URLs or export settings.

Use the dashboard's current definitions when answering its data-collection checkboxes, consistently with the public privacy policy. Do not mistake local access to history for a promise that the extension never accesses data. The policy URL and accurate permission justifications are required parts of the listing. [Official privacy-field guidance](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)

## Final review

- The package, screenshots and copy must describe the same final build.
- No additional permissions, host permissions or optional permission requests.
- Original logo and icon, no public “HistoryOut 2” name.
- Welcome page opens on installation; existing users get the appropriate update page once.
- No extension tracking, no history upload, no paid feature or account requirement.
- Share confirmation follows a real clipboard success, with a fallback if unavailable.
- Contribution is optional and never blocks preview or export.
- Record the approved store version and public listing check after publication.

## Feedback and contact

Feedback/support URL: https://historyout.featurebase.app/

Contact email: sauliusthedev@gmail.com

Use the current detailed description in description.txt. After approval, verify the Store contact email and support URL, upload the 2.2.0 package, and review the dashboard fields before submitting.
