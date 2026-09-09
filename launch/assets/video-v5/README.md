# HistoryOut voice refresh

This additive version uses a completely new Chatterbox performance. The original HistoryOut branding, export-first story, real interface, quick transitions and complete ending card are preserved. Previous versions remain unchanged.

## Files

- `historyout-export-demo.mp4`: final 24.833333-second, 1920 × 1080, 30fps video with stereo AAC audio.
- `historyout-captions.srt` and `.vtt`: complete timed captions, also displayed in the recording.
- `historyout-media.json`: authoritative measured metadata, transcript, timings, processing facts and checksum.
- `historyout-poster.png`, `historyout-ending.png` and `review-contact-sheet.png`: actual extracted frames.
- `audio/voiceover-raw.wav` and `.npy`: new single generated performance with its original timing.
- `audio/voiceover.wav`: one constant gain adjustment and 24kHz to 48kHz sample-rate conversion for mixing.
- `audio/voiceover-review.wav`: timed voice stem, including its ending hold.
- `audio/candidates/`: two dry opening auditions with conservative and slightly stronger expression, their metadata and independent transcripts.
- `historyout-demo-export.html` and `historyout-filtered-export.html`: files actually downloaded by the demonstrated extension.

## What changed

The previous performance used Qwen Base and multiple timing operations. Reusing that waveform could not create new intonation. This version instead generates the full 63-word script as one new performance with Chatterbox Multilingual V3, `exaggeration=0.35` and `cfg_weight=0.5`. The slightly stronger `0.55` opening remains available for comparison.

The full raw read lasts 20.62 seconds. Every intended word appears in independent transcription of both the raw WAV and encoded MP4. No tempo adjustment, pitch shift, speech trimming, inserted silence or internal gap edit is applied. Constant gain is approximately +0.225dB; resampling prepares the audio for a 48kHz mix. The natural speech remains intact, including consonant releases and pauses.

Visual timing follows the new performance's independently aligned words. The raw waveform finishes at 20.820 seconds, followed by a 4.013333-second hold. The original music fades during the final three seconds. The closing card remains visible through the final frame.

The extension is real, and all browsing records are fictional QA data. The coffee strip and footer coffee link are hidden only through capture-page CSS. Production extension behavior is unchanged.

## Reference and model provenance

The authorized voice reference is a contiguous excerpt of the creator's [original HistoryOut demonstration](https://www.youtube.com/watch?v=8k0lNtIhPWs), from 13.04 through 22.10 seconds. The extended ending preserves the release after the last short phrase. It stays in the private local cache, outside the repository. Only timing, intended transcript and digest are recorded in `source/voice-provenance.json`.

The installed MLX implementation supports Chatterbox V3 and explicit expression/guidance controls. The model documentation describes V3 as an improvement in voice similarity and conversational speech, which made it a better candidate for this task than repeating the old waveform. These are model capabilities, not a guarantee of subjective voice likeness. [MLX documentation](https://github.com/Blaizzy/mlx-audio/blob/main/docs/models/tts/chatterbox.md), [Resemble source](https://github.com/resemble-ai/chatterbox), [MLX checkpoint](https://huggingface.co/mlx-community/chatterbox-multilingual-v3).

Generation and transcription run locally. No paid API, account setup or voice upload is used. The original music and click effects use no borrowed samples. Human perceptual listening is not claimed by the media agent.

## Actual verification

- All 63 intended words match normalized ASR in raw voice and encoded MP4.
- The raw WAV derives directly from saved generated floating-point samples, with no out-of-range samples.
- The mix voice derives from a single fixed gain and resampling operation, preserving the complete performance.
- Ten actual frames were visually inspected, including the final card near the last frame.
- True peak: −2.03dBTP. Integrated loudness: −19.44LUFS. No clipping.
- Original brand, readable real exports, caption spelling and absence of coffee marketing were checked.

## Reproduction

Use the existing local media Python environment at `~/.cache/historyout-media-venv/bin/python`, FFmpeg, the repository's Playwright installation and the built extension.

1. `python source/generate-voice.py auditions`
2. `python source/generate-voice.py full`
3. `python source/transcribe.py audio/voiceover-raw.wav source/voice-transcript-check.json`
4. `python source/prepare-media.py`
5. `node source/produce-video.cjs`
6. `python source/transcribe.py historyout-export-demo.mp4 source/final-mix-transcript.json`
7. `python source/package-web.py`

The generation script preserves existing WAV outputs. The reference remains in the local cache and is required for regeneration. Source narration, model parameters, real action trace and alignment are retained. These scripts do not publish or upload anything.
