# Chrome Web Store update

Prepared 5 September 2026. Submit the existing item `idohnkdgejocejlkihihonhemndpiiei` to preserve its users, reviews and update path. The product remains **HistoryOut**; 2.0.0 is the technical release version.

## Upload fields

Use `listing.json` for field values and `description.txt` for the complete public description. Use the freshly tested `historyout-2.0.0-chrome.zip` from this folder when the kit contains it, or the final matching file under `releases/`. Never upload this entire marketing kit as the extension package.

1. Replace the package on the existing item.
2. Set the public name and description from `listing.json`. The name must match the manifest.
3. Upload `brand/icon128.png`, the five ordered files under `screenshots/`, and both files under `promotional/`.
4. Add the new public YouTube demo: https://youtu.be/GT7aEfalP1E. Do not use the old silent draft.
5. Use the public website and privacy URLs from `listing.json`. Check both anonymously before submitting.
6. Complete the privacy fields below, review the final listing preview, and submit the update for review.

The 128px PNG is the byte-identical original extension icon. The five screenshots are 1280 x 800, the required small promo is 440 x 280, and the optional marquee is 1400 x 560. Chrome permits up to five screenshots. [Official image requirements](https://developer.chrome.com/docs/webstore/images/)

## Privacy field text

Single purpose: Help users find, revisit, filter and export the browsing history available to their current browser profile.

`history`: Read available navigation history and visits when the user chooses Preview or export, to display matching results and create the user's chosen local file. History is not uploaded or deleted.

`storage`: Keep export preferences, named saved views and the install/update page state in local browser storage. Browsing history is not stored as a persistent extension archive.

`sidePanel`: Show HistoryOut beside the current page so users can find and export history without losing their browsing context.

Remote code: No. The extension runs code bundled in its package.

Data handling: Browsing history is accessed locally for the user's requested workflow. It is not transmitted to the developer, sold or shared with third parties. User-triggered links open external websites, including the store, support and optional contribution page. Opening the welcome or changelog website makes a normal website request and does not send browsing history.

Use the dashboard's current definitions when answering its data-collection checkboxes, consistently with the public privacy policy. Do not mistake local access to history for a promise that the extension never accesses data. The policy URL and accurate permission justifications are required parts of the listing. [Official privacy-field guidance](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)

## Final review

- The package, screenshots and copy must describe the same final build.
- No additional permissions, host permissions or optional permission requests.
- Original logo and icon, no public “HistoryOut 2” name.
- Welcome page opens on installation; existing users get the appropriate update page once.
- No extension tracking, no history upload, no paid feature or account requirement.
- Share confirmation follows a real clipboard success, with a fallback if unavailable.
- Contribution is optional and never blocks preview or export.
- Record the approved store version and public listing check after the user publishes it.
