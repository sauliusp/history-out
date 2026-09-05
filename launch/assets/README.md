# HistoryOut v2 launch assets

All interface imagery is captured from the working extension UI. Every browsing record is fictional QA fixture data defined in scripts/qa-lib.cjs. No personal browsing history is used.

- screenshots/: five fresh 1280 × 800 store and website compositions.
- raw/: original panel, desktop, and focused UI captures.
- demo-history.html: actual HTML file downloaded through the extension.
- video/historyout-v2-demo.mp4: finished 50-second, 1280 × 720, 30fps captioned demo. Silent, no borrowed footage or music. Captions are visible in the video; SRT also included.
- source/: reproducible HTML composition layouts and video stage.

Rebuild the current extension with npm run build, then regenerate with npm run assets. Requires Playwright Chromium and ffmpeg. Use --screenshots-only or --video-only when invoking scripts/capture-assets.cjs to regenerate one group. Sources and outputs are additive to the v1 repository; source/logo.svg is the new brand master.
