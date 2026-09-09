# HistoryOut launch assets

All interface imagery is captured from the working extension. Optional donation prompts are omitted only in the capture harness; the real extension keeps its support controls. Every browsing record is fictional QA fixture data from `scripts/qa-lib.cjs`; no personal history is used. The original HistoryOut icon and wordmark are preserved, and current captures contain no public version badge.

## Current narrated video

- `video-v5/historyout-export-demo.mp4`: finished 24.833-second, 1920 × 1080, 30 fps video with a fresh expressive voice take, natural timing, a complete branded ending, original music and synchronized clicks.
- `video-v5/historyout-captions.vtt` and `.srt`: complete timed captions, also visible in the video.
- `video-v5/historyout-poster.png`: web-ready 1920 × 1080 poster.
- `video-v5/historyout-media.json`: authoritative duration, codecs, checksum and transcript timings.
- `video-v5/audio/voiceover-review.wav`: isolated narration for listening review.
- `video-v5/historyout-demo-export.html`: the actual downloaded file shown in the video.
- `index.html`: review gallery with the current video and screenshot links.

The narration is generated locally from the creator-authorized original voice reference with Chatterbox Multilingual V3, using modest expression. No speech speed or pitch change and no internal pause edits are applied. Independent transcription verifies all words in the raw take and encoded mix. These checks do not establish subjective voice likeness. Current publication evidence is in `../store-kit/youtube/upload-status.json`.

## Images and sources

- `screenshots/`: five 1280 × 800 compositions with the original wordmark and actual current interface.
- `raw/`: original 400px panel, desktop and focused captures, including daily recap, saved research view, custom dates and export controls.
- `demo-history.html`: actual HTML download used in the screenshots.
- `source/logo.svg`: exact original HistoryOut wordmark, restored from the original website.
- `source/`: reproducible screenshot layouts.
- `video-v5/source/`: narrated-video stage, voice generation, original audio synthesis, interaction timings and verification evidence.

The previous 29-second edit is retained in `video-v4/`. The earlier 24-second narrated edit is retained in `video-v3/`. The 34.5-second narrated edit is retained in `video-v2.1/`, and the silent 50-second study in `video/`. Neither is the current launch video. Current store-ready compositions and submission materials are also organized separately in `launch/store-kit/`.

For screenshots, rebuild the extension and run `node scripts/capture-assets.cjs --screenshots-only`. For the current narrated video, follow `video-v5/README.md` and run its `source/produce-video.cjs`. The older `--video-only` capture option reproduces the earlier silent study. These assets and all media-generation tooling are excluded from the extension package.
