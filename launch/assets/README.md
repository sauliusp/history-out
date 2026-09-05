# HistoryOut launch assets

All interface imagery is captured from the working extension. Every browsing record is fictional QA fixture data from `scripts/qa-lib.cjs`; no personal history is used. The original HistoryOut icon and wordmark are preserved, and current captures contain no public version badge.

## Current narrated video

- `video-v3/historyout-export-demo.mp4`: finished 24-second, 1920 × 1080, 30 fps video with a continuous reference-conditioned synthetic narration, original ambient music and action-synchronized click effects.
- `video-v3/historyout-captions.vtt` and `.srt`: complete timed captions, also visible in the video.
- `video-v3/historyout-poster.png`: web-ready 1920 × 1080 poster.
- `video-v3/historyout-media.json`: authoritative duration, codecs, checksum and transcript timings.
- `video-v3/audio/voiceover-review.wav`: isolated narration for listening review.
- `video-v3/historyout-demo-export.html`: the actual downloaded file shown in the video.
- `index.html`: review gallery with the current video and screenshot links.

Narration wording was independently verified by transcription. Human perceptual listening for voice likeness and subjective audio mix is not claimed by the media agent. This session cannot hear audio directly; no claim of confirmed perceptual similarity is made. The complete media remains ready to review, and the media-production agent has not uploaded it.

## Images and sources

- `screenshots/`: five 1280 × 800 compositions with the original wordmark and actual current interface.
- `raw/`: original 400px panel, desktop and focused captures, including daily recap, saved research view, custom dates and export controls.
- `demo-history.html`: actual HTML download used in the screenshots.
- `source/logo.svg`: exact original HistoryOut wordmark, restored from the original website.
- `source/`: reproducible screenshot layouts.
- `video-v3/source/`: narrated-video stage, voice generation, original audio synthesis, interaction timings and verification evidence.

The earlier 34.5-second narrated edit is retained in `video-v2.1/`, and the silent 50-second study in `video/`. Neither is the current launch video. Current store-ready compositions and submission materials are also organized separately in `launch/store-kit/`.

For screenshots, rebuild the extension and run `node scripts/capture-assets.cjs --screenshots-only`. For the current narrated video, follow `video-v3/README.md` and run its `source/produce-video.cjs`. The older `--video-only` capture option reproduces the earlier silent study. These assets and all media-generation tooling are excluded from the extension package.
