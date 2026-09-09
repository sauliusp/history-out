"""Shorten sentence gaps using independent word alignment, never cut spoken words."""
from pathlib import Path
import json,subprocess,wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'audio/voiceover.wav'
with wave.open(str(p),'rb') as f: sr=f.getframerate();a=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').copy()
words=[w for s in json.loads((ROOT/'source/voice-transcript-check.json').read_text())['segments'] for w in s['words']]
# Whisper sometimes labels a final breath as a word. End after the aligned final
# intended word, with a 60ms release, to retain its natural consonant decay.
last=next(w for w in reversed(words) if w['word'].strip().strip('.,').lower()=='account')
words=[w for w in words if w['start']<last['end']]
cuts=[]
for left,right in zip(words,words[1:]):
    gap=right['start']-left['end']
    if gap>.44:cuts.append((left['end']+.13,right['start']-.13))
pieces=[];cursor=0
for start,end in cuts:
    pieces.append(a[cursor:int(start*sr)]);cursor=int(end*sr)
pieces.append(a[cursor:int((last['end']+.06)*sr)])
b=np.concatenate(pieces).astype(float)
fade=min(int(.015*sr),len(b));b[-fade:]*=np.linspace(1,0,fade)
temp=ROOT/'audio/voice-tight.wav'
with wave.open(str(temp),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(sr);f.writeframes(b.astype('<i2').tobytes())
# Modest word pacing after gap tightening keeps the continuous read around164wpm.
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(temp),'-af','atempo=0.9215','-ar',str(sr),str(p)],check=True)
temp.unlink()
with wave.open(str(p),'rb') as f:duration=f.getnframes()/f.getframerate()
metrics=json.loads((ROOT/'source/voice-metrics.json').read_text());metrics.update({'speech_seconds':duration,'spoken_words_per_minute':63/duration*60,'duration':24.0,'sentence_gap_trim_seconds':sum(e-s for s,e in cuts),'final_tempo_adjustment':.9215})
(ROOT/'source/voice-metrics.json').write_text(json.dumps(metrics,indent=2))
print(json.dumps(metrics),flush=True)
