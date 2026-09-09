"""One continuous read, lightly timed without gaps between dramatic fragments."""
from pathlib import Path
import json, subprocess, wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
raw=ROOT/'audio/export-first-voice-raw.wav'
with wave.open(str(raw),'rb') as f:
    sr=f.getframerate(); a=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').astype(float)/32768
active=np.flatnonzero(np.abs(a)>.008)
a=a[max(0,active[0]-int(.025*sr)):min(len(a),active[-1]+int(.08*sr))]
trim=ROOT/'audio/voice-trim.wav'
with wave.open(str(trim),'wb') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(sr); f.writeframes((a*32767).astype('<i2').tobytes())
tempo=max(.90,min(1.12,(len(a)/sr)/23.2))
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(trim),'-af',f'atempo={tempo},highpass=f=65,lowpass=f=11500,loudnorm=I=-16.5:TP=-2:LRA=7','-ac','1','-ar','48000',str(ROOT/'audio/voiceover.wav')],check=True)
trim.unlink()
with wave.open(str(ROOT/'audio/voiceover.wav'),'rb') as f: duration=f.getnframes()/f.getframerate()
metrics={'raw_trimmed_seconds':len(a)/sr,'atempo':tempo,'speech_seconds':duration,'word_count':63,'spoken_words_per_minute':63/duration*60,'voice_start':.2,'duration':round(max(24.5,min(26.5,duration+1.3)),2)}
(ROOT/'source/voice-metrics.json').write_text(json.dumps(metrics,indent=2))
print(json.dumps(metrics),flush=True)
