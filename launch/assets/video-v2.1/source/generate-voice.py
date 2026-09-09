"""Local reference-conditioned voice. User authorized their own original demo as reference."""
from pathlib import Path
import json, wave
import numpy as np
import mlx.core as mx
from mlx_audio.tts.utils import load_model
ROOT=Path(__file__).resolve().parents[1]
reference=Path.home()/'.cache/historyout-media-source/reference.wav'
ref_text='Chrome shows your browsing history, but exporting it is not straightforward. HistoryOut lets you export your Chrome history in seconds.'
model=load_model('mlx-community/Qwen3-TTS-12Hz-0.6B-Base-8bit')
mx.random.seed(42)
lines=json.loads((ROOT/'source/narration.json').read_text())
for line in lines:
 output=ROOT/'audio'/f"{line['id']}-voice-raw.wav"
 if output.exists():
  print('EXISTS',output.name,flush=True);continue
 results=list(model.generate(text=line['text'],ref_audio=str(reference),ref_text=ref_text,lang_code='English',temperature=0.65,top_p=0.9,max_tokens=420,verbose=False))
 audio=np.concatenate([np.asarray(r.audio) for r in results])
 sr=results[0].sample_rate
 with wave.open(str(output),'wb') as f:
  f.setnchannels(1);f.setsampwidth(2);f.setframerate(sr);f.writeframes((np.clip(audio,-1,1)*32767).astype('<i2').tobytes())
 print('GENERATED',output.name,'seconds',len(audio)/sr,flush=True)
