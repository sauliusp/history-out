"""Measure the actual output and publish additive, reproducible local media files."""
from pathlib import Path
import hashlib,json,re,subprocess
ROOT=Path(__file__).resolve().parents[1]
mp4=ROOT/'historyout-export-demo.mp4'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(mp4)]))
duration=float(probe['format']['duration'])
video=next(s for s in probe['streams'] if s['codec_type']=='video')
audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
voice=json.loads((ROOT/'source/voice-metrics.json').read_text())
captions=json.loads((ROOT/'source/timed-captions.json').read_text())
asr=json.loads((ROOT/'source/voice-transcript-check.json').read_text())
words=[w for s in asr['segments'] for w in s['words']]
mix_asr=json.loads((ROOT/'source/final-mix-transcript.json').read_text())
canonical=json.loads((ROOT/'source/narration.json').read_text())[0]['text']
normalize=lambda s:re.sub(r'[^a-z0-9]','',s.lower())
assert normalize(canonical)==normalize(mix_asr['text']), 'Mixed-track words differ from narration'
assert normalize(canonical)==normalize(asr['text']), 'Isolated-track words differ from narration'
loud=subprocess.run(['ffmpeg','-hide_banner','-i',str(mp4),'-af','loudnorm=I=-16:TP=-1:LRA=7:print_format=json','-f','null','-'],capture_output=True,text=True).stderr
loudness=json.loads(loud[loud.rfind('{'):loud.rfind('}')+1])
silence=subprocess.run(['ffmpeg','-hide_banner','-i',str(ROOT/'audio/voiceover.wav'),'-af','silencedetect=noise=-38dB:d=0.10','-f','null','-'],capture_output=True,text=True).stderr
gaps=[float(x) for x in re.findall(r'silence_duration: ([\d.]+)',silence)]
metrics=json.loads((ROOT/'source/audio-metrics.json').read_text())
metadata={'title':'Export your browser history as CSV, JSON or HTML with HistoryOut','duration_seconds':duration,'width':video['width'],'height':video['height'],'fps':video['r_frame_rate'],'video_codec':video['codec_name'],'audio_codec':audio['codec_name'],'audio_channels':audio['channels'],'sample_rate':int(audio['sample_rate']),'bytes':mp4.stat().st_size,'sha256':hashlib.sha256(mp4.read_bytes()).hexdigest(),'mp4':mp4.name,'poster':'historyout-poster.png','captions_srt':'historyout-captions.srt','captions_vtt':'historyout-captions.vtt','transcript_text':canonical,'timed_captions':captions,'speech_start':.2,'speech_end':round(.2+voice['speech_seconds'],3),'tail_seconds':round(duration-.2-voice['speech_seconds'],3),'words_per_minute':voice['spoken_words_per_minute'],'maximum_aligned_word_gap_seconds':round(max(b['start']-a['end'] for a,b in zip(words,words[1:])),3),'maximum_detected_voice_silence_seconds':max(gaps) if gaps else 0,'loudness_integrated_lufs':float(loudness['input_i']),'true_peak_dbtp':float(loudness['input_tp']),'loudness_range_lu':float(loudness['input_lra']),'mix_sample_peak_before_encode':metrics['peak'],'click_count':metrics['click_count'],'voice':'One continuous locally generated read conditioned on the creator-authorized original public voice reference; sentence gaps trimmed and cadence preserved.','reference_url':'https://www.youtube.com/watch?v=8k0lNtIhPWs','verification':'All spoken words independently verified by local ASR in isolated voice and complete mix. Visual frames inspected. Human perceptual listening is not claimed.','history':'Actual working interface, real downloaded exports, fictional QA browsing data.','music':'Original synthesized ambient bed, no borrowed samples','clicks':'Original synthesized click effects synchronized to actual UI actions','brand':'Original HistoryOut wordmark and icons; no public version suffix','production_bundle_sha256':hashlib.sha256((ROOT.parents[2]/'extension-unpacked/bundle.js').read_bytes()).hexdigest()}
(ROOT/'historyout-media.json').write_text(json.dumps(metadata,indent=2)+'\n')
(ROOT/'source/loudness-check.json').write_text(json.dumps(loudness,indent=2)+'\n')
(ROOT/'source/silence-check.txt').write_text(silence)
subprocess.run(['ffmpeg','-y','-loglevel','error','-ss','3.8','-i',str(mp4),'-frames:v','1','-update','1',str(ROOT/'historyout-poster.png')],check=True)
frames=[21,114,282,309,378,450,540,648]
select='+'.join(f'eq(n,{n})' for n in frames)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(mp4),'-vf',f"select='{select}',scale=640:360,tile=2x4",'-frames:v','1','-update','1',str(ROOT/'review-contact-sheet.png')],check=True)
print(json.dumps({k:metadata[k] for k in ['duration_seconds','speech_start','speech_end','tail_seconds','words_per_minute','maximum_detected_voice_silence_seconds','loudness_integrated_lufs','true_peak_dbtp','click_count']},indent=2))
