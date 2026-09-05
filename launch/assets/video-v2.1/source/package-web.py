"""Canonical web delivery package and authoritative timed metadata."""
from pathlib import Path
import hashlib,json,re,shutil,subprocess
root=Path(__file__).resolve().parents[1]
shutil.copyfile(root/'historyout-34s-narrated-review.mp4',root/'historyout-34s.mp4')
srt=(root/'historyout-captions.srt').read_text()
(root/'historyout-captions.vtt').write_text('WEBVTT\n\n'+re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})',r'\1.\2',srt))
lines=json.loads((root/'source/narration.json').read_text())
metrics=json.loads((root/'source/audio-metrics.json').read_text())
for i,line in enumerate(lines):
 line['text']=line['text'].replace('History Out','HistoryOut')
 line['speech_end']=round(line['start']+metrics['voice_segments'][i]['processed_seconds'],3)
 line['caption_end']=round(lines[i+1]['start']-.05 if i<len(lines)-1 else 34.5,3)
metadata={'title':'Find your way back with HistoryOut','duration_seconds':34.5,'width':1920,'height':1080,'fps':30,'video_codec':'H.264','audio_codec':'AAC','audio_channels':2,'sample_rate':48000,'bytes':(root/'historyout-34s.mp4').stat().st_size,'sha256':hashlib.sha256((root/'historyout-34s.mp4').read_bytes()).hexdigest(),'mp4':'historyout-34s.mp4','poster':'historyout-poster.png','captions_vtt':'historyout-captions.vtt','captions_srt':'historyout-captions.srt','voice_type':'Locally generated synthetic narration conditioned on the creator-authorized original public speech.','voice_reference_url':'https://www.youtube.com/watch?v=8k0lNtIhPWs','audio_verification':'All intended spoken words independently transcribed in full mix; perceptual voice similarity and subjective mix require human listening.','music':'Original synthesized ambient score','clicks':'12 synthesized click effects aligned to actual recorded UI interactions','history':'Fictional QA data; actual working interface and downloaded export','transcript':lines}
(root/'historyout-media.json').write_text(json.dumps(metadata,indent=2))
subprocess.run(['ffmpeg','-y','-loglevel','error','-ss','2','-i',str(root/'historyout-34s.mp4'),'-frames:v','1','-update','1',str(root/'historyout-poster.png')],check=True)
print('WEB_PACKAGE_READY',root/'historyout-34s.mp4')
