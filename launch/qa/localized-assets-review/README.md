# Localized asset review, 21 November 2026

Final 2.2.0 image sets were captured from bundle `c32111fe12202b03ff6e60edc2fcf06003ca6265872453de41d98caf15832132` in isolated contexts with fictional browsing history. The actual application renders the interface; the HTML sample is a real downloaded export. No browser history from a normal user profile was used.

All seven languages have five screenshots, both promotional sizes, a website hero and a social image: 63 final PNGs. Final dimensions, opaque RGB encoding, localized listing/package metadata consistency, HTML sample synchronization and capture provenance passed `node scripts/audit-localized-store-kit.cjs`. See `../localized-assets.json` for hashes and field counts.

The screenshots were reviewed as complete five-image sets for English, Simplified Chinese, Spanish, German, Brazilian Portuguese, French and Japanese. Full-size checks covered translated controls, HTML exports, the Chinese website hero and the longer German/French compositions. Marketing text fits without clipping or overlap. A clipped filter-scene export button found during the first pass was fixed by matching the capture viewport to the frame. Final source captures use 3× pixel density for clear website imagery.

English text retained in translated UI captures consists of fictional visited-page titles/URLs, brands and stable format names. These are source data, not untranslated interface labels. The Simplified Chinese copy uses mainland Chinese characters; quoted sharing-control names were aligned to 推荐给朋友. User-created names and browser history are not translated by the product.

The existing global Chrome promotional tiles and YouTube thumbnail are byte-identical to the committed originals. The YouTube video URL is unchanged. Chrome Web Store supports localized screenshots but not localized promo tiles; the full localized promo variants are included for Edge and reuse. No store upload, review submission or publication is performed by these asset scripts.

Open `../../store-kit/locales/index.html` to review every image and the listing/changelog files.
