# HistoryOut export-first video

An additive edit centered on HistoryOut's core export workflow. The product name stays HistoryOut; the directory name identifies a production revision only.

Canonical delivery:

- `historyout-export-demo.mp4`: 24-second 1920 × 1080 H.264 video, stereo AAC audio, real controls and actual downloaded HTML files.
- `historyout-captions.vtt` and `.srt`: accurate timed captions, also burned into the video. CSV, JSON, HTML and HistoryOut keep their correct spelling.
- `historyout-poster.png`: web poster.
- `historyout-media.json`: measured runtime, transcript, timing, codec, loudness, silence and checksum metadata.
- `audio/voiceover-review.wav`: the complete timed voice stem.
- `historyout-demo-export.html` and `historyout-filtered-export.html`: real downloaded files displayed in the recording.

The opening shows the three actual export-format controls and downloads HTML immediately. Dates, selected columns and matching visits occupy the middle. Recap and saved views are a short extra near the end. The last frame says Get HistoryOut free, without committing to a website domain during the migration.

All history is fictional QA data from `scripts/qa-lib.cjs`. The UI is the actual final extension build, including the original icon and the visible optional coffee support link. The original wordmark is used unchanged. No public version number appears.

## Audio provenance and checks

The voice is one continuous synthetic read, locally generated with Qwen3-TTS from the creator-authorized original [HistoryOut demo](https://www.youtube.com/watch?v=8k0lNtIhPWs). The private reference excerpt remains in the local cache, outside the repository and extension packages. Generation uses no paid API or remote voice-upload service. Sentence gaps are trimmed using independently aligned word boundaries; no spoken word is removed. The output preserves a conversational pace instead of spacing out isolated phrases.

The music and click effects are original mathematical synthesis, with no borrowed recording or sample. Click effects are synchronized to visible recorded actions. Actual hardware click audio is not claimed.

The isolated voice and full mixed soundtrack are independently transcribed with MLX Whisper. The metadata records loudness, true peak and maximum detected voice silence. These checks verify words and technical integrity. Human perceptual listening and voice similarity are not claimed by the media agent. No upload or publication is performed by these scripts.

## Reproduce

Use the local Python environment at `~/.cache/historyout-media-venv/bin/python`, with `mlx-audio`, `mlx-whisper` and NumPy, plus local FFmpeg and the repository's Playwright installation. The extension must be built first; fictional history is injected only into the isolated browser harness.

1. `python source/generate-voice.py`
2. `python source/prepare-voice.py`
3. `python source/transcribe.py`
4. Preserve the first ASR alignment as `source/first-pass-alignment.json` and run `python source/tighten-voice.py`.
5. Run `python source/transcribe.py` again, then `python source/align-captions.py`.
6. `node source/produce-video.cjs`
7. `python source/transcribe.py audio/audio-mix.wav source/final-mix-transcript.json`
8. `python source/package-web.py`

The capture script preserves real action timestamps and edit points, detects its black preparation slate to align video with narration, and removes the scratch browser recording after successful encoding. All inputs and delivered outputs remain additive; earlier video revisions are retained separately.
