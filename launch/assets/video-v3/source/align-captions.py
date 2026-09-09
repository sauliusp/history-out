from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
words=[w for s in json.loads((ROOT/'source/voice-transcript-check.json').read_text())['segments'] for w in s['words']]
phrases=['Export your browser history','as CSV, JSON, or HTML.','With HistoryOut, turn your visits','into a useful file','you can open or share.','Choose your own dates and columns,','then search or filter','to keep the pages you need.','Remove repeat visits','and URL parameters before exporting.','Daily recaps and saved views','help tomorrow, too.','HistoryOut is free and local,','with no account.']
clean=lambda t:re.sub(r'[^a-z0-9]','',t.lower())
captions=[];index=0
for phrase in phrases:
    count=len(phrase.replace('HistoryOut','History Out').split())
    subset=words[index:index+count]
    assert ''.join(clean(w['word']) for w in subset)==clean(phrase), (phrase,subset)
    captions.append({'start':round(.2+subset[0]['start'],3),'end':round(.2+subset[-1]['end'],3),'text':phrase})
    index+=count
assert index==len(words)
for i,c in enumerate(captions):c['end']=round(captions[i+1]['start']-.025 if i<len(captions)-1 else 23.7,3)
(ROOT/'source/timed-captions.json').write_text(json.dumps(captions,indent=2))
def stamp(s):
    ms=round(s*1000);return f'00:00:{ms//1000:02d},{ms%1000:03d}'
srt='\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}\n' for i,c in enumerate(captions))
(ROOT/'historyout-captions.srt').write_text(srt)
(ROOT/'historyout-captions.vtt').write_text('WEBVTT\n\n'+re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})',r'\1.\2',srt))
print(json.dumps(captions,indent=2))
