#!/usr/bin/env python3
"""M3 FLEX: guarded two-part MP4 production. Source videos are NEVER modified.
A/B release requires all missing scenes, explicit timing, owner and clinical QA.
No automatic customer upload or deployment is implemented.
"""
import argparse, hashlib, json, re, shutil, subprocess, sys, tempfile, urllib.parse, urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
MANIFEST=ROOT/'production/two-part-locked-media-manifest.json'
GATES=ROOT/'production/two-part/release-gates.json'
HASHES=ROOT/'production/two-part/approved-originals-sha256.json'
LOCKED={'C09-PRE-BREATH-R2','C10-POST-BREATH-R1','C01-R3','C02','C03','C04-R2','C08-PRESS-R3'}
REJECTED={'C12-SEATED-SHOULDER-ROLLS-R1','C13-SHOULDER-ROLLS-MOTION-DRIVER'}

def invoke(args):
    p=subprocess.run(args,capture_output=True,text=True)
    if p.returncode: raise RuntimeError(f"{args[0]} failed: {p.stderr[-800:]}")
    return p.stdout

def probe(file):
    return json.loads(invoke(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(file)]))

def hash_file(file):
    h=hashlib.sha256()
    with open(file,'rb') as f:
        for x in iter(lambda:f.read(1024*1024),b''): h.update(x)
    return h.hexdigest()

def load():
    manifest=json.loads(MANIFEST.read_text())
    gates=json.loads(GATES.read_text())
    pinned=json.loads(HASHES.read_text())
    if set(pinned.get('lockedSources',{}))!=LOCKED:
        raise RuntimeError('Pinned SHA256 set does not match seven approved original videos')
    if manifest.get('status')!='draft-protected-only-not-cleared-not-deployed':
        raise RuntimeError('Protected draft manifest has unexpected release status.')
    if set(manifest.get('lockedApprovedVideoIds',[]))!=LOCKED or set(manifest.get('approvedAssets',{}))!=LOCKED:
        raise RuntimeError('Original seven approved asset set was changed: abort.')
    if set(manifest.get('parts',{}))!={'A','B'}: raise RuntimeError('Expected exactly Parts A and B')
    return manifest,gates

def id_key(part,i,scene): return f"{part}:{i:02d}:{scene['id']}"

def check(manifest,gates):
    problems=[]; inventory={}
    for part in ('A','B'):
        inventory[part]=[]
        for i,scene in enumerate(manifest['parts'][part]):
            ident=scene['id']; key=id_key(part,i,scene)
            if ident in REJECTED or 'C12-' in ident or 'C13-' in ident:
                raise RuntimeError('Rejected or reference-only scene included: '+key)
            locked=ident in LOCKED and scene['status']=='approved-source-locked'
            candidate=gates.get('approvedNewAssets',{}).get(ident,{})
            new=(bool(candidate.get('ownerApproved') is True and candidate.get('visualVerified') is True
                    and candidate.get('marcusVerified') is True and candidate.get('approvalRecord')
                    and candidate.get('video') and
                    (candidate.get('embeddedMarcus') is True or candidate.get('approvedMarcusAudio'))))
            if ident in LOCKED and not locked: raise RuntimeError('Locked item changed status: '+key)
            if ident not in LOCKED and scene.get('status')=='approved-source-locked':
                raise RuntimeError('Unapproved item misrepresented as locked: '+key)
            timing=gates.get('chapterTiming',{}).get(key,{})
            timed=bool(timing.get('ownerReviewed') is True and
                       isinstance(timing.get('durationSec'),(int,float)) and timing['durationSec']>0
                       and timing.get('timingBasis'))
            if not (locked or new): problems.append(key+': missing or unapproved media')
            if not timed: problems.append(key+': missing reviewed duration / repetition timing')
            inventory[part].append({'chapter':i+1,'id':ident,'key':key,'title':scene['label'],
                                    'approvedSource':bool(locked or new),'timingVerified':timed})
    rel=gates.get('releaseGate',{})
    for flag,rec in [('ownerFinalApproval','ownerApprovalRecord'),
                     ('clinicianClearanceConfirmed','clinicianClearanceRecord'),
                     ('androidEndToEndQAPassed','androidQARecord')]:
        if rel.get(flag) is not True or not rel.get(rec): problems.append(f'release gate {flag} / {rec} absent')
    return {'ready':not problems,'inventory':inventory,'blockingIssues':problems}

def fetch(url,path):
    parts=urllib.parse.urlsplit(url)
    if parts.scheme!='https' or not parts.netloc: raise RuntimeError('HTTPS input required')
    if path.exists() and path.stat().st_size>1024: return path
    path.parent.mkdir(parents=True,exist_ok=True)
    temp=path.with_suffix(path.suffix+'.partial')
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'M3FlexProtectedAssembler/1.0'})
        with urllib.request.urlopen(req,timeout=90) as r,open(temp,'wb') as f:
            if r.status not in (200,206): raise RuntimeError('Source HTTP failure')
            size=0
            while True:
                buf=r.read(1024*1024)
                if not buf: break
                size+=len(buf)
                if size>600*1024*1024: raise RuntimeError('Source larger than 600 MB')
                f.write(buf)
        if size<=1024: raise RuntimeError('No source data')
        temp.replace(path)
        return path
    finally: temp.unlink(missing_ok=True)

def scene_source(scene,m,g):
    id=scene['id']
    if id in LOCKED: return m['approvedAssets'][id]
    new=g['approvedNewAssets'][id]
    return {'video':new['video'],'approvedMarcusAudio':new.get('approvedMarcusAudio'),
            'embeddedMarcus':new.get('embeddedMarcus',False)}

def normalize(video,audio,duration,out,loop_motion=False):
    info=probe(video)
    if not any(x['codec_type']=='video' for x in info['streams']): raise RuntimeError('Missing video stream')
    if not audio and not any(x['codec_type']=='audio' for x in info['streams']):
        raise RuntimeError('No verified Marcus audio in approved scene')
    source_sec=float(info['format']['duration'])
    if duration>source_sec+.25 and not loop_motion:
        raise RuntimeError('Chapter extends beyond moving video: explicit motion-loop QA required')
    # Loop motion ONLY after explicit cycle QA. Audio comes from a separate nonlooping input.
    cmd=['ffmpeg','-hide_banner','-loglevel','error','-y']
    if loop_motion:cmd+=['-stream_loop','-1']
    cmd+=['-i',str(video)]
    if audio:cmd+=['-i',str(audio)]
    elif loop_motion:cmd+=['-i',str(video)]
    # Letterbox rather than crop; keep visual pace unchanged. Freeze final frame if video
    # is shorter than the signed-off chapter length (never silently slow the motion).
    vf='scale=480:832:force_original_aspect_ratio=decrease,pad=480:832:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=30,format=yuv420p'
    cmd+=['-vf',vf,'-map','0:v:0','-map','1:a:0' if (audio or loop_motion) else '0:a:0',
          '-af','aresample=48000,apad','-t',f'{duration:.3f}',
          '-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p',
          '-c:a','aac','-ac','2','-b:a','192k','-movflags','+faststart',str(out)]
    invoke(cmd)
    actual=probe(out)
    if abs(float(actual['format']['duration'])-duration)>.45: raise RuntimeError('Duration mismatch')
    if not any(x['codec_type']=='audio' for x in actual['streams']): raise RuntimeError('No audio in derivative')
    return float(actual['format']['duration'])

def compose(part,m,g,outdir,cache):
    part_dir=outdir/f'part_{part}_segments';part_dir.mkdir(parents=True)
    clips=[]; chapters=[]; running=0
    for i,scene in enumerate(m['parts'][part]):
        id=scene['id'];k=id_key(part,i,scene); asset=scene_source(scene,m,g)
        slug=re.sub('[^A-Za-z0-9_-]','_',id)
        video=fetch(asset['video'],cache/(slug+'.mp4'))
        audio=fetch(asset['approvedMarcusAudio'],cache/(slug+'.voice')) if asset.get('approvedMarcusAudio') else None
        pinned=json.loads(HASHES.read_text())['lockedSources']
        if id in LOCKED:
            if hash_file(video)!=pinned[id]['video']['sha256']:
                raise RuntimeError('IMMUTABLE ORIGINAL MP4 HASH MISMATCH: '+id)
            if audio and hash_file(audio)!=pinned[id]['voice']['sha256']:
                raise RuntimeError('APPROVED MARCUS AUDIO HASH MISMATCH: '+id)
        timing=g['chapterTiming'][k]
        duration=float(timing['durationSec'])
        outfile=part_dir/f'{i:02d}_{slug}.mp4'
        length=normalize(video,audio,duration,outfile,loop_motion=timing.get('motionLoopApproved') is True)
        chapters.append({'sceneId':id,'title':scene['label'],'startMs':round(running*1000),
                         'endMs':round((running+length)*1000),'originalSHA256':hash_file(video)})
        running+=length;clips.append(outfile)
    listing=outdir/f'part_{part}.concat'
    listing.write_text(''.join("file '"+str(p).replace("'","'\\''")+"'\\n" for p in clips))
    joined=outdir/f'part_{part}_joined.mp4'
    invoke(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0',
            '-i',str(listing),'-c','copy',str(joined)])
    meta=outdir/f'part_{part}.ffmeta'
    lines=[';FFMETADATA1',f'title=M3 FLEX WORKOUT {part} MASTER - INTERNAL STAGING']
    for ch in chapters:
        lines+=['','[CHAPTER]','TIMEBASE=1/1000',f'START={ch["startMs"]}',
                f'END={ch["endMs"]}', 'title='+ch['title'].replace('\n',' ')]
    meta.write_text('\n'.join(lines)+'\n')
    final=outdir/f'M3_FLEX_Workout_{part}_UNRELEASED.mp4'
    invoke(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(joined),
            '-i',str(meta),'-map','0','-map_metadata','1','-c','copy','-movflags','+faststart',str(final)])
    (outdir/f'Workout_{part}_chapters.json').write_text(json.dumps(chapters,indent=2))
    return {'name':final.name,'sha256':hash_file(final),'chapters':len(chapters)}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('command',choices=['audit','build'])
    parser.add_argument('--output',default=str(ROOT/'production/two-part/local-output'))
    parser.add_argument('--cache',default=str(ROOT/'production/two-part/.source-cache'))
    opt=parser.parse_args()
    m,g=load();report=check(m,g)
    if opt.command=='audit':
        print(json.dumps({'ready':report['ready'],'lockedAssets':sorted(LOCKED),
              'parts':{p:{'positions':len(v),'sourceReady':sum(x['approvedSource'] for x in v),
                          'timingsReady':sum(x['timingVerified'] for x in v)}
                       for p,v in report['inventory'].items()},
              'blockingIssues':report['blockingIssues']},indent=2))
        return 0
    if not report['ready']:
        print('BLOCKED: complete sources, reviewed timing, owner approval, clinician clearance and mobile QA required.',file=sys.stderr)
        print(json.dumps({'problems':report['blockingIssues']},indent=2),file=sys.stderr)
        return 2
    if not shutil.which('ffmpeg') or not shutil.which('ffprobe'): raise RuntimeError('FFmpeg required')
    cache=Path(opt.cache)
    with tempfile.TemporaryDirectory(prefix='m3flex-staging-') as d:
        staging=Path(d)
        results={p:compose(p,m,g,staging,cache) for p in ('A','B')}
        outdir=Path(opt.output);outdir.mkdir(parents=True,exist_ok=True)
        for p in ('A','B'):
            for src in (staging/results[p]['name'],staging/f'Workout_{p}_chapters.json'):
                shutil.copy2(src,outdir/src.name)
        (outdir/'SOURCE_AND_OUTPUT_HASHES.json').write_text(json.dumps(results,indent=2))
        print(json.dumps({'status':'STAGED_ONLY_NOT_DEPLOYED','outputs':results},indent=2))
    return 0

if __name__=='__main__':
    try:sys.exit(main())
    except Exception as exc:
        print('ABORTED: '+str(exc),file=sys.stderr)
        sys.exit(3)
