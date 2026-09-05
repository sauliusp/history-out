# HistoryOut product video

The finished edit is 34.5 seconds at 1920 × 1080 and 30 fps, with narration, an original ambient score, action-synchronized click effects and timed captions. It preserves the original HistoryOut wordmark and icon. It demonstrates the working extension with fictional history and opens a real downloaded HTML export.

## Delivered files

- Canonical MP4: `launch/assets/video-v2.1/historyout-34s.mp4`
- Web captions: `launch/assets/video-v2.1/historyout-captions.vtt`
- Upload captions: `launch/assets/video-v2.1/historyout-captions.srt`
- Poster: `launch/assets/video-v2.1/historyout-poster.png`
- Authoritative duration, codecs, checksum and timed transcript: `launch/assets/video-v2.1/historyout-media.json`
- Listening preview: `launch/assets/video-v2.1/audio/voiceover-review.wav`
- Review gallery: `launch/assets/index.html`

The earlier silent 50-second study remains in `launch/assets/video/` as an earlier artifact. It is not the current launch video.

## Actual edit and narration

| Time | Real interaction | Narration |
| --- | --- | --- |
| 0.0-4.5 | Original brand, working workspace and clear opening hook | Lost that useful page? Find your way back with HistoryOut. |
| 4.5-9.0 | Preview Today, inspect the recap and type a project search | Review your day, then search the pages you need. |
| 9.0-13.1 | Enable one row per URL and show the two matching project pages | Keep the latest visit to each page. |
| 13.1-17.6 | Name and save a research view | Save your view, and resume your research later. |
| 17.6-22.2 | Choose custom dates, preview and select HTML | Choose your dates, your columns, and your format. |
| 22.2-27.1 | Enable optional URL cleanup, inspect chosen columns and download the actual HTML file | Clean up URL parameters, then export a useful file. |
| 27.1-34.5 | Show the real exported file and the website call to action | Free. Local. No account. Get HistoryOut, and keep what matters. |

Exact speech starts and ends are recorded in the metadata JSON. Full captions are visible in the video and available in VTT and SRT. The UI preview contains an explicit fictional-data label. Three export columns are selected as demonstration preferences; these are real settings, not invented controls.

## Voice and verification

The narration is generated locally from the creator-authorized reference in [the original HistoryOut video](https://www.youtube.com/watch?v=8k0lNtIhPWs). The original title, creator channel and 29-second duration were verified. An 8.55-second excerpt beginning at 0.58 seconds conditions the local Qwen3-TTS voice model. No voice audio was sent to a generation service.

All seven generated segments and the complete mixed soundtrack were independently transcribed with MLX Whisper. The intended wording was verified. The final MP4 has valid H.264 video and stereo AAC audio, and the mix peak remains below clipping. Screenshots and a six-frame video contact sheet were visually inspected. The visible version badge was removed before final capture.

Human listening for perceptual voice similarity and the subjective mix is pending, as requested for this release. The agent session cannot hear audio directly and does not claim that voice similarity has been confirmed. The complete video, isolated voice and audio stems are available for that review. No upload was performed by the media-production agent.

## YouTube metadata draft

**Title:** Find your way back with HistoryOut

**Description:**

Lost a useful page? Review your day, resume your research, and keep the links that matter with HistoryOut. Search and filter your browser history, save a reusable view, then export CSV, JSON or a readable HTML file.

Free. Local history processing. No account.

Get HistoryOut: [exportchromehistory.app](https://exportchromehistory.app/)

Install: [Chrome Web Store](https://chromewebstore.google.com/detail/historyout-export-chrome/idohnkdgejocejlkihihonhemndpiiei)

This demonstration uses fictional browsing data, actual extension controls and a real downloaded file. Narration is synthetic and based on the creator's own authorized voice reference. HistoryOut cannot recover deleted history or measure time spent on pages. URL cleanup does not anonymize browsing history.

## Reproduction

Build the current extension, then use `launch/assets/video-v2.1/source/produce-video.cjs`. The neighboring voice and audio-mix scripts, narration JSON and interaction trace preserve the source. Tool dependencies and the private reference excerpt are kept in the local cache, not in the extension package. No music or click samples were borrowed.
