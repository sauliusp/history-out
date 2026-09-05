# HistoryOut store launch kit

The original HistoryOut wordmark, extension icon and favicon are preserved. All surrounding marketing layouts are newly created. Screenshots show the actual extension interface with fictional browsing history, including a real HTML download.

## Start here

- `index.html`: visual gallery.
- `chrome/`: complete English Chrome Web Store fields, privacy notes and assets.
- `edge/`: complete English Edge Add-ons fields, submission notes and assets.
- `screenshots/`: five ordered 1280 x 800 images.
- `promotional/`: small tile and marquee.
- `youtube/thumbnail-1280x720.png`: video thumbnail.
- `brand/`: byte-identical original SVG wordmark, favicon and 128px extension icon; a high-resolution PNG render of the original vector wordmark.
- `support/`: completed 1600 x 400 Buy Me a Coffee cover, published to the live profile, plus its publication record.
- `manifest.json`: dimensions and SHA-256 checksums for the generated files.
- `archives.json`: SHA-256 checksums for the Chrome and Edge marketing ZIPs.
- `distribution.md`: which browsers need separate store work.

The store ZIPs are handoff bundles, not installable extension archives. Their submission notes identify the extension package separately. The public brand is HistoryOut, with version numbers confined to release notes and technical filenames.

## Reproduce

After the final product captures are ready under `launch/assets/raw/`, run:

```sh
node scripts/store-kit.cjs
```

After the final tested extension packages have been rebuilt, include the correct release ZIP in each store bundle:

```sh
npm run pack
node scripts/store-kit.cjs --package-extension
```

The renderer uses Playwright Chromium and Sharp. Playwright is a project dependency; Sharp resolves from the installed Codex workspace runtime or a normal local installation. The optional contribution cover uses `support/background.png` as its newly generated background. No old marketing screenshot is copied.

Do not market unpublished features as already available in the store. The copy is prepared for the user's 2.0.0 submission, and publication status remains separate from packaging.
