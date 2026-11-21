# HistoryOut store launch kit

The original HistoryOut wordmark, extension icon and favicon are preserved. All surrounding marketing layouts are newly created. Screenshots show the actual extension interface with fictional browsing history, including a real HTML download. Optional donation prompts are omitted only from promotional captures; they remain in the extension.

## Start here

- `index.html`: visual gallery.
- `chrome/`: complete English Chrome Web Store fields, privacy notes and assets.
- `edge/`: complete English Edge Add-ons fields, submission notes and assets.
- `screenshots/`: five ordered 1280 x 800 images: export formats, customization, readable HTML, filtering and daily-use extras.
- `promotional/`: small tile and marquee.
- `youtube/thumbnail-1280x720.png`: video thumbnail. Current public demo: https://youtu.be/cGybkRSkk2Y.
- `brand/`: byte-identical original SVG wordmark, favicon and 128px extension icon; a high-resolution PNG render of the original vector wordmark.
- `support/`: completed 1600 x 400 Buy Me a Coffee cover, published to the live profile, plus its publication record.
- `manifest.json`: SHA-256 checksums and available image dimensions for the current handoff files.
- `archives.json`: SHA-256 checksums for the Chrome and Edge marketing ZIPs.
- `distribution.md`: which browsers need separate store work.

The store ZIPs are handoff bundles, not installable extension archives. Their submission notes identify the extension package separately. The public brand is HistoryOut, with version numbers confined to release notes and technical filenames.

## Reproduce

To render artwork after the final product captures are ready under `launch/assets/raw/`, run:

```sh
node scripts/store-kit.cjs --assets-only
```

After the final tested extension packages have been rebuilt, include the correct release ZIP in each store bundle:

```sh
npm run pack
node scripts/audit-release-packages.cjs
node scripts/package-store-kit.cjs
```

The packaging command reuses the existing artwork and rebuilds both outer handoff ZIPs, their current 2.2.0 inner extension ZIPs, listing/changelog files and metadata. Each handoff contains exactly one extension version. Historical loose 2.0.0 candidates are excluded. To render artwork and assemble the current packages in one run, use `node scripts/store-kit.cjs --package-extension` after packing and auditing.

The renderer uses Playwright Chromium and Sharp. Playwright is a project dependency; Sharp resolves from the installed Codex workspace runtime or a normal local installation. The optional contribution cover uses `support/background.png` as its newly generated background. No old marketing screenshot is copied.

Do not market unpublished features as already available in the store. The copy is prepared for the user's 2.2.0 review, and publication status remains separate from packaging.


## Localized 2.2.0 kit

English plus Simplified Chinese (`zh_CN`, mainland China), Spanish, German, Brazilian Portuguese, French and Japanese. `locales/<locale>/` contains complete listing metadata, description and changelog, five actual localized UI screenshots, both promotional sizes and an asset audit. Equivalent locale folders are included in both Chrome and Edge handoff bundles.

Recreate all localized captures and images after building the extension:

```sh
node scripts/localized-store-kit.cjs
```

Or run capture and rendering separately:

```sh
node scripts/capture-assets.cjs --localized
node scripts/store-kit.cjs --localized
```

Use `--locales=zh_CN,ja` to regenerate a subset. The capture uses fictional history in an isolated browser context; the UI and downloaded HTML are the actual built product. It leaves the original YouTube video and thumbnail intact. Localized website hero/social images are copied to the website's public assets. All final PNGs are opaque and their dimensions/checksums are recorded in each asset audit.

Chrome Web Store localizes screenshot sets and descriptions, but its small and marquee promo tiles are global. Keep the existing approved global tiles in Chrome. Every locale still has complete promotional variants for Edge and other reuse. The English default screenshot set is refreshed from the same current build.

Before publishing, complete the user's required Codex PR review into `main` and regression testing. Generation and packaging do not publish anything. The current release state is recorded in `launch/review-2.2.0.md`.
