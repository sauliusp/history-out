# Microsoft Edge Add-ons

Updated 6 September 2026. This is a later distribution option; no Edge listing has been submitted or published.

Edge has its own store, Microsoft Edge Add-ons, managed through Partner Center. Edge also supports installations from the Chrome Web Store, subject to the browser's other-store setting and organization policies. [Microsoft installation guidance](https://support.microsoft.com/en-US/edge/add-turn-off-or-remove-extensions-in-microsoft-edge)

## Ready to use

- `listing.json`: name, short description, URLs and seven search terms.
- `description.txt`: complete English description.
- `brand/icon128.png`: unchanged original logo, accepted at the 128px minimum.
- `screenshots/`: five ordered 1280 x 800 screenshots.
- `promotional/`: 440 x 280 small tile and 1400 x 560 large tile.
- `historyout-2.0.0-edge.zip`: extension package when the final packaging step has populated it. Do not upload the marketing ZIP as the extension package.

Partner Center recommends a 300px square logo and accepts a minimum of 128px. We preserve the user's exact original 128px artwork. Edge allows up to six screenshots; these five fit its 1280 x 800 format. Its description accepts 250 to 10,000 characters. The prepared search terms stay within seven terms, 21 words in total and 30 characters per term. [Official Edge submission requirements](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)

## Submission sequence

Create an extension entry in Partner Center, upload the final tested Edge package, and populate the English listing using these files. Add the public website/privacy URLs and the public YouTube demo: https://youtu.be/cGybkRSkk2Y. Use the local data handling and permission explanations in the Chrome submission notes, adjusted to the current Partner Center form. Verify the listing preview before sending it for store review.

The prepared screenshots show HistoryOut's actual interface, not a claim that Edge store review has passed. Local Chromium/Edge evidence and the remaining browser checks are in `launch/browser-compatibility.md` and `launch/qa/release-readiness.json`.
