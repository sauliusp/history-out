# HistoryOut product video

This additive edit keeps the previous voice delivery, gives the scenes short breaths and transitions, and finishes on a complete branded card. The product remains HistoryOut. Previous video revisions remain unchanged.

## Delivery

- `historyout-export-demo.mp4`: 29-second 1080p video with narration, original music and synchronized click effects.
- `historyout-captions.srt` and `historyout-captions.vtt`: complete speech captions, also visible in the video.
- `historyout-poster.png`: opening export workflow poster.
- `historyout-media.json`: authoritative measured timing, codecs, checksums and audio results.
- `review-contact-sheet.png`: ten actual extracted frames, including the end of the final card.
- `audio/voiceover-review.wav`: timed narration stem.
- `historyout-demo-export.html` and `historyout-filtered-export.html`: real downloaded files shown in the video.

## Timeline

| Time | What is shown |
| --- | --- |
| 0.0-4.65 | CSV, JSON and HTML controls, followed immediately by a real HTML download. |
| 4.65-9.25 | A readable three-column HTML export. |
| 9.25-12.0 | Custom dates and chosen export columns. |
| 12.0-18.9 | Search, latest visit per URL, optional URL cleanup, and a smaller two-column export. |
| 18.9-22.15 | A brief recap and reusable saved view. |
| 22.15-29.0 | Original HistoryOut wordmark, “Export browser history.”, CSV · JSON · HTML, free/local principles and the installation call to action. |

The narration finishes at 25.015 seconds. The final card remains visible for another 3.985 seconds. Its quiet original music fades over the last three seconds. Transitions take approximately 300ms. Actual recorded action times are retained in the source metadata.

## Voice and capture provenance

The creator-authorized, locally generated voice from the prior edit is reused exactly. No new voice generation, pitch shift or speed change is applied. Six short breaths add 1.8 seconds between independently aligned words. Spoken audio remains sample-for-sample identical to the prior edit. The original wording remains unchanged, including the export-first opening.

The interface is the working extension with fictional QA history. Both HTML files are downloaded by the real export action. Three columns in the opening and two in the filtered file are actual selected settings, chosen for readability.

The coffee support strip and coffee footer link are hidden solely through capture-page CSS. The production extension, its settings and its support links are unchanged. Original HistoryOut icons and wordmark remain intact. No external hostname or public version suffix is added to the final card.

The synthetic narration provenance is disclosed during the demonstration. Audio generation stays local. Original music and click effects use no borrowed samples. Independent ASR, encoded-media inspection, loudness and true-peak checks are retained alongside the sources. Human perceptual listening is not claimed by the media agent.

## Reproduce

Use the existing local Python media environment, FFmpeg, repository Playwright installation and current built extension:

1. Run `python source/prepare-timeline.py` to insert the short breaths and align captions.
2. Run `node source/produce-video.cjs` to capture actual UI actions, synthesize the soundtrack and encode the video.
3. Run `python source/transcribe.py audio/voiceover.wav source/voice-transcript-check.json`.
4. Run `python source/transcribe.py historyout-export-demo.mp4 source/final-mix-transcript.json`.
5. Run `python source/package-web.py` to validate and generate the web metadata, poster and contact sheet.

Use `~/.cache/historyout-media-venv/bin/python` for the Python commands. Its MLX Whisper installation performs local transcription. The source narration file and aligned timestamps are included. The private original reference recording remains outside the repository. The scripts do not publish or upload anything.
