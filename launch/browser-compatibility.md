# Browser compatibility

HistoryOut technical version **2.0.0**, checked 5 September 2026. The product retains its original HistoryOut identity. Local runtime evidence, packaging and store publication are separate stages.

## Distribution

Chrome is the first release destination, using the existing Chrome Web Store item and its update path. Brave installs compatible extensions from that store. Edge supports Chrome Web Store installation and also offers a separate Microsoft Edge Add-ons store. The prepared Edge listing can follow the Chrome release. [Brave instructions](https://support.brave.app/hc/en-us/articles/360017909112-How-can-I-add-extensions-to-Brave), [Microsoft instructions](https://support.microsoft.com/en-US/edge/add-turn-off-or-remove-extensions-in-microsoft-edge)

## Packages

| ZIP under releases/ | Permissions | Interface |
| --- | --- | --- |
| historyout-2.0.0-chrome.zip | history, storage, sidePanel | Side panel with own-page fallback if configuration fails or is unavailable |
| historyout-2.0.0-edge.zip | Same three | Sidebar where supported, with own-page fallback |
| historyout-2.0.0-brave.zip | Same three | Side panel where supported, with own-page fallback |
| historyout-2.0.0-chromium.zip | history, storage | Own extension page opened from the toolbar |

The generic package removes both sidePanel permission and side_panel configuration. The background checks the manifest before using that API. Opening an extension's own tab needs no tabs permission. No package adds host permissions, content scripts or optional permission requests.

Run `npm run pack` to rebuild the packages. The [package audit](./qa/package-audit.json) checks archives against the production files. The [store kit](./store-kit/README.md) includes store-specific copy, screenshots, original branding, promotional assets and packaging instructions.

## Actual local verification

The [release-readiness report](./qa/release-readiness.json) records native API and real download checks in disposable profiles on macOS 26.6.2. It tests installed unpacked Manifest V3 extensions, not only a mock interface.

| Browser or surface | Recorded evidence | Limit |
| --- | --- | --- |
| Chromium 149.0.7827.55 | Native history, exact custom-date boundaries, CSV/JSON/HTML files, filters, cleanup, saved-view persistence and side-panel configuration | Unpacked installation; full signed-store release is separate |
| Microsoft Edge 152.0.4191.62 | Same native history and export checks, side-panel configuration and persistence | No Edge store publication claimed |
| Chromium update from 1.0.1 | Native upgrade, settings/history preservation, one changelog tab, no welcome tab, no duplicate after restart | Baseline rebuilt from original source, not a signed store download |
| Side-panel layouts | Browser UI fixture checks at narrow and wide widths, plus actual extension-page captures | Responsive page checks alone do not certify every browser's toolbar/sidebar chrome |
| Brave | Manifest and ZIP prepared | Brave is not installed on this Mac; no Brave runtime pass claimed |
| Generic Chromium package | Reduced-permission manifest and fallback behavior checked | Browser-specific end-to-end verification still required before naming another browser supported |
| Firefox, Safari and mobile | Outside current package scope | No support claim |

The native upgrade details are in [native-update.json](./qa/native-update.json). The test uses Chrome's native unpacked extension installer with a source-built 1.0.1 baseline, upgrades to 2.0.0, and confirms that the current history and original export preferences remain intact. This is stronger evidence than changing mocked version fields, but it does not reproduce the Web Store's signing, review or rollout service.

History used in these checks is fictional data seeded only into newly created profiles. Ordinary user history is neither opened nor altered. Faults and cancellation are exercised through the UI fixture so native browser internals do not need destructive fault injection.

## Release checks that remain external

The store-signed update, store review, public listing and staged rollout can be verified only after submission/publication. Brave runtime testing remains separate from its documented Chrome Web Store installation path. Keep those limits visible when describing compatibility.

Do not use blanket “works everywhere” claims or a store badge for a listing that does not exist. A browser-neutral name is compatible with precise browser-specific evidence.
