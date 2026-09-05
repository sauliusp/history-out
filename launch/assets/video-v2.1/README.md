# HistoryOut narrated product video

Review output: `historyout-34s-narrated-review.mp4`, 34.5 seconds, 1920 × 1080, 30 fps, H.264 video with stereo AAC audio.

The original HistoryOut wordmark and icon are preserved. Every product interaction and HTML export comes from the working extension, using fictional history from `scripts/qa-lib.cjs`. Three export columns are preselected as demonstration preferences. No production UI is replaced with invented controls.

Audio contains locally generated synthetic narration conditioned on the creator's own authorized public video, an original mathematically synthesized ambient score, and original click effects synchronized to the twelve real UI click events recorded in `source/interaction-trace.json`. No stock music or borrowed click samples are used. The original voice audio stays in the local cache and is not part of this launch package.

Voice reference: [Saulius Petreikis, original HistoryOut demonstration](https://www.youtube.com/watch?v=8k0lNtIhPWs). The title and channel were verified during production. The source is 29 seconds long; an 8.55-second speech excerpt beginning at 0.58 seconds was used as a local reference.

Voice generation uses the open Qwen3-TTS 0.6B Base model through MLX Audio on this Mac. All seven generated segments were independently transcribed by MLX Whisper; their intended wording was verified. **This session cannot hear audio, so perceptual voice similarity and subjective mix quality still require human listening before publication.** The isolated review voice track is `audio/voiceover-review.wav`.

Primary technical sources:

- [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS)
- [MLX Audio reference voice workflow](https://github.com/Blaizzy/mlx-audio/blob/main/mlx_audio/tts/models/qwen3_tts/README.md)
- [MLX Whisper](https://github.com/ml-explore/mlx-examples/tree/main/whisper)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)

Reproduction:

1. Build the current extension with `npm run build`.
2. Generate voice using `source/generate-voice.py` in the isolated `~/.cache/historyout-media-venv` environment. It expects the authorized reference at `~/.cache/historyout-media-source/reference.wav`.
3. Run `node launch/assets/video-v2.1/source/produce-video.cjs`. This captures real actions, synthesizes and mixes audio, and encodes the MP4 plus SRT captions.

The prior silent 50-second edit is retained separately. No video upload has been performed by the media-production agent.
