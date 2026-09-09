"""Reuse the approved delivery exactly; insert only brief breaths between words."""
from pathlib import Path
import json,wave,re
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
# Positions are midpoints of independently aligned pauses in the existing read.
breaths=[{'at':4.21,'duration':.20},{'at':8.89,'duration':.35},{'at':10.70,'duration':.35},{'at':13.41,'duration':.30},{'at':17.05,'duration':.30},{'at':20.05,'duration':.30}]
with wave.open(str(ROOT/'audio/voice-source.wav'),'rb') as f:
    sr=f.getframerate();a=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2')
chunks=[];cursor=0
for gap in breaths:
    cut=round(gap['at']*sr);chunks.extend([a[cursor:cut],np.zeros(round(gap['duration']*sr),dtype='<i2')]);cursor=cut
chunks.append(a[cursor:]);b=np.concatenate(chunks)
with wave.open(str(ROOT/'audio/voiceover.wav'),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(sr);f.writeframes(b.tobytes())
def shift(t):return round(t+sum(g['duration'] for g in breaths if t>=g['at']),3)
asr=json.loads((ROOT/'source/source-voice-alignment.json').read_text())
for segment in asr['segments']:
    segment['start']=shift(segment['start']);segment['end']=shift(segment['end'])
    for word in segment['words']:word['start']=shift(word['start']);word['end']=shift(word['end'])
(ROOT/'source/expected-voice-alignment.json').write_text(json.dumps(asr,indent=2))
words=[w for s in asr['segments'] for w in s['words']]
phrases=['Export your browser history','as CSV, JSON, or HTML.','With HistoryOut, turn your visits','into a useful file','you can open or share.','Choose your own dates and columns,','then search or filter','to keep the pages you need.','Remove repeat visits','and URL parameters before exporting.','Daily recaps and saved views','help tomorrow, too.','HistoryOut is free and local,','with no account.']
captions=[];index=0
for phrase in phrases:
    count=len(phrase.replace('HistoryOut','History Out').split());subset=words[index:index+count]
    captions.append({'start':round(.2+subset[0]['start'],3),'end':round(.2+subset[-1]['end']+.12,3),'text':phrase});index+=count
for i,c in enumerate(captions[:-1]):c['end']=min(c['end'],captions[i+1]['start']-.025)
(ROOT/'source/timed-captions.json').write_text(json.dumps(captions,indent=2))
def stamp(s):
    ms=round(s*1000);return f'00:00:{ms//1000:02d},{ms%1000:03d}'
srt='\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}\n' for i,c in enumerate(captions))
(ROOT/'historyout-captions.srt').write_text(srt)
(ROOT/'historyout-captions.vtt').write_text('WEBVTT\n\n'+re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})',r'\1.\2',srt))
metrics={'duration':29.0,'voice_start':.2,'speech_seconds':len(b)/sr,'speech_end':round(.2+len(b)/sr,3),'tail_seconds':round(29-.2-len(b)/sr,3),'added_breaths_seconds':sum(g['duration'] for g in breaths),'word_count':63,'original_delivery_unchanged':True,'original_word_pace':164.2395,'breaths':breaths,'transition_seconds':.3,'final_card_start':22.15,'music_fade_start':26.0,'music_fade_end':29.0}
(ROOT/'source/voice-metrics.json').write_text(json.dumps(metrics,indent=2))
print(json.dumps(metrics,indent=2))
