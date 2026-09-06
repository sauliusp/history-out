"""Fit visuals to the new raw performance. Audio speed and pauses are untouched."""
from pathlib import Path
import json,math,re,subprocess,wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
asr=json.loads((ROOT/'source/voice-transcript-check.json').read_text())
text=json.loads((ROOT/'source/narration.json').read_text())[0]['text']
clean=lambda s:re.sub(r'[^a-z0-9]','',s.lower())
assert clean(asr['text'])==clean(text),'Full narration must contain every intended word'
words=[w for s in asr['segments'] for w in s['words']]
offset=.2;cursor=0
for w in words:w['char_start']=cursor;cursor+=len(clean(w['word']));w['char_end']=cursor
full=clean(text)
def bounds(phrase,start=0):
    a=full.index(clean(phrase),start);b=a+len(clean(phrase));subset=[w for w in words if w['char_end']>a and w['char_start']<b]
    return a,b,round(offset+subset[0]['start'],3),round(offset+subset[-1]['end'],3)
phrases=['Export your browser history','as CSV, JSON, or HTML.','With HistoryOut, turn your visits','into a useful file','you can open or share.','Choose your own dates and columns,','then search or filter','to keep the pages you need.','Remove repeat visits','and URL parameters before exporting.','Daily recaps and saved views','help tomorrow, too.','HistoryOut is free and local,','with no account.']
captions=[];cursor=0
for phrase in phrases:
    a,cursor,start,end=bounds(phrase,cursor);captions.append({'start':start,'end':end+.10,'text':phrase})
for i,c in enumerate(captions[:-1]):c['end']=round(min(c['end'],captions[i+1]['start']-.025),3)
with wave.open(str(ROOT/'audio/voiceover-raw.wav'),'rb') as f:sr=f.getframerate();raw=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').astype(float)/32768
raw_duration=len(raw)/sr
gain=.78/float(abs(raw).max())
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(ROOT/'audio/voiceover-raw.wav'),'-af',f'volume={gain}','-ar','48000','-ac','1',str(ROOT/'audio/voiceover.wav')],check=True)
duration=math.ceil((offset+raw_duration+4)*30)/30
anchors=[{'old':0,'new':0},{'old':.2,'new':bounds('Export your browser')[2]},{'old':4.58,'new':bounds('With HistoryOut')[2]},{'old':9.26,'new':bounds('Choose your own')[2]},{'old':11.06,'new':bounds('then search')[2]},{'old':13.78,'new':bounds('Remove repeat')[2]},{'old':17.48,'new':bounds('Daily recaps')[2]},{'old':20.4,'new':bounds('HistoryOut is free')[2]},{'old':23.215,'new':offset+raw_duration}]
def warp(t):
    for a,b in zip(anchors,anchors[1:]):
        if t<=b['old']:return a['new']+(t-a['old'])/(b['old']-a['old'])*(b['new']-a['new'])
    return anchors[-1]['new']+t-anchors[-1]['old']
metrics={'duration':round(duration,6),'voice_file_start':offset,'speech_start':bounds('Export your browser')[2],'speech_end':bounds('with no account')[3],'raw_audio_end':round(offset+raw_duration,6),'raw_duration':raw_duration,'tail_seconds_after_raw_audio':round(duration-offset-raw_duration,6),'tail_seconds_after_last_word':round(duration-bounds('with no account')[3],6),'word_count':63,'words_per_minute_including_native_pauses':63/raw_duration*60,'fixed_gain':gain,'sample_rate':48000,'voice_model':'mlx-community/chatterbox-multilingual-v3','exaggeration':.35,'cfg_weight':.5,'audio_speed_change':False,'pitch_change':False,'internal_silence_edits':False,'anchors':anchors,'final_card_start':round(warp(20.35),3),'transition_seconds':.3,'music_fade_start':duration-3,'music_fade_end':duration}
(ROOT/'source/voice-metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
(ROOT/'source/timed-captions.json').write_text(json.dumps(captions,indent=2)+'\n')
def stamp(s):
    ms=round(s*1000);return f'00:00:{ms//1000:02d},{ms%1000:03d}'
srt='\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}\n' for i,c in enumerate(captions))
(ROOT/'historyout-captions.srt').write_text(srt)
(ROOT/'historyout-captions.vtt').write_text('WEBVTT\n\n'+re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})',r'\1.\2',srt))
print(json.dumps(metrics,indent=2))
