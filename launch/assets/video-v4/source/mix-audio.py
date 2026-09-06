"""Original synthesized ambient score and UI click effects. No borrowed samples."""
from pathlib import Path
import json, math, subprocess, wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
SR=48000
DURATION=29.0
N=int(SR*DURATION)
lines=json.loads((ROOT/'source/narration.json').read_text())
def read(p):
 with wave.open(str(p),'rb') as f:
  return np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').astype(np.float64)/32768,f.getframerate()
def write(p,a):
 with wave.open(str(p),'wb') as f:
  f.setnchannels(2 if a.ndim==2 else 1);f.setsampwidth(2);f.setframerate(SR);f.writeframes((np.clip(a,-.999,.999)*32767).astype('<i2').tobytes())
voice=np.zeros(N)
processed,_=read(ROOT/'audio/voiceover.wav')
start=int(.2*SR);voice[start:start+len(processed)]=processed
metrics=json.loads((ROOT/'source/voice-metrics.json').read_text())
write(ROOT/'audio/voiceover-review.wav',voice)
# Warm Cmaj9, Am9, Fmaj7 and G6 pads with a quiet original plucked motif.
score=np.zeros((N,2));rng=np.random.default_rng(20260905)
chords=[[48,55,59,62],[45,52,55,59],[41,48,52,57],[43,50,55,59]]
def freq(m):return 440*2**((m-69)/12)
for start in np.arange(0,DURATION,4):
 notes=chords[int(start/4)%4];dur=min(5.8,DURATION-start);t=np.arange(int(dur*SR))/SR
 env=np.minimum(t/.9,1)*np.minimum((dur-t)/1.3,1)
 tone=np.zeros((len(t),2))
 for j,m in enumerate(notes):
  f=freq(m)
  for channel,detune in enumerate([-.0015,.0015]):
   tone[:,channel]+=(np.sin(2*np.pi*f*(1+detune)*t)+.16*np.sin(4*np.pi*f*t))*.008*env/len(notes)
 idx=int(start*SR);score[idx:idx+len(t)]+=tone
for i,start in enumerate(np.arange(.4,DURATION-.5,.75)):
 m=[72,76,79,83,79,76,74,71][i%8];t=np.arange(int(.7*SR))/SR
 env=(1-np.exp(-t*70))*np.exp(-t*6)
 tone=(np.sin(2*np.pi*freq(m)*t)+.12*np.sin(4*np.pi*freq(m)*t))*env*.006
 idx=int(start*SR);pan=.25+.5*(i%3)/2;score[idx:idx+len(t),0]+=tone*(1-pan);score[idx:idx+len(t),1]+=tone*pan
fade=np.minimum(np.arange(N)/SR/1.2,1)*np.minimum((DURATION-np.arange(N)/SR)/3.0,1)
score*=2.2*fade[:,None]
write(ROOT/'audio'/'original-ambient-score.wav',score)
# Every sound is aligned to an actual recorded UI click timestamp.
clicks=np.zeros((N,2))
trace=ROOT/'source'/'interaction-trace.json'
events=json.loads(trace.read_text()) if trace.exists() else []
for event in events:
 t=np.arange(int(.055*SR))/SR
 click=(rng.standard_normal(len(t))*.045+np.sin(2*np.pi*1350*t)*.045)*np.exp(-t*110)
 click+=np.where(t>.017,np.sin(2*np.pi*900*(t-.017))*.015*np.exp(-(t-.017)*180),0)
 idx=int(event['time']*SR)
 if idx>=0 and idx+len(t)<N:clicks[idx:idx+len(t)]+=click[:,None]
write(ROOT/'audio'/'synchronized-clicks.wav',clicks)
mix=np.stack([voice,voice],axis=1)+score+clicks
write(ROOT/'audio'/'audio-mix.wav',mix)
(ROOT/'source'/'audio-metrics.json').write_text(json.dumps({'duration':DURATION,'sample_rate':SR,'voice_segments':metrics,'click_count':len(events),'peak':float(np.max(np.abs(mix)))},indent=2))
print('AUDIO_MIX_READY',len(events),'clicks, peak',float(np.max(np.abs(mix))),flush=True)
