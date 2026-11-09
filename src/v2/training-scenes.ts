/** One identity-gated scene resolver for Coach and Hologram views. */
import recovery from '../data/recovery-scenes.json';
import audioRuntime from '../../approved-recovery-audio-runtime.json';
const localAudio = (source:string|undefined) => source ? audioRuntime.items.find(x=>x.sourceURL===source)?.path : undefined;
import { approvedCoachMedia } from './approved-coach-media';
import { exerciseMotionFor, type ExerciseMotion } from '../data/coach-identity';
import { v2SessionReducer, type V2Action } from './session';
import { hasApprovedRealTimeCoach } from './rig-release';
import type { V2Exercise, V2Session } from './types';
export type TrainingScene = {url:string;sceneId:string;label:string;audioUrl?:string;embeddedAudio?:boolean;motion?:ExerciseMotion};
const trusted = new Map<string,TrainingScene>();
recovery.forEach((stage,phase)=>stage.items.forEach((item,index)=>{
  const id=item.id ?? `recovery-${phase}-${index}`;
  if ('video' in item && item.video) trusted.set(id,{url:item.video,sceneId:id,label:item.name,audioUrl:localAudio('voice' in item?item.voice:undefined),embeddedAudio:'embedded' in item&&item.embedded===true});
}));
// C13-C23 candidate footage, including C16, remains owner-review only in
// public/recovery-coach/scene-library.js. It is not approved for timed playback.
export const REST_SCENE = trusted.get('C09-PRE-BREATH-R2')!;
export const COOLDOWN_SCENE = trusted.get('C10-POST-BREATH-R1')!;
export function exerciseScene(exercise?:V2Exercise):TrainingScene|undefined {
  if (!exercise) return;
  if (exercise.sceneId) return trusted.get(exercise.sceneId);
  const media=approvedCoachMedia(exercise);
  if (media) return {url:media.url,sceneId:`canonical:${exercise.motionKey}`,label:exercise.name};
  // This exact Shoulder Press demonstration is already approved as a separately
  // credited workout partner, NOT as Marcus. Never promote the quarantined
  // historical shoulderPress actor or a mismatched chest-press clip.
  if (exercise.motionKey === 'shoulderPress') {
    const motion=exerciseMotionFor('shoulderPress');
    if (motion?.actor === 'demonstrator' && motion.credit)
      return {url:motion.url,sceneId:'demonstrator:shoulderPress',label:exercise.name,motion};
  }
  return undefined;
}
export function sceneForSession(session:V2Session) {
  const resting=session.phase==='rest'||session.phase==='transition';
  const complete=session.phase==='complete';
  const exercise=session.workout.exercises[session.exerciseIndex];
  const media=complete?COOLDOWN_SCENE:resting?REST_SCENE:exerciseScene(exercise);
  return {media,role:complete?'cooldown':resting?'rest':exercise?.stageRole??'exercise',
    playing:Boolean(media&&(complete||session.running&&session.phase==='work'||session.running&&resting)),
    missing:!media&&!resting&&!complete};
}
/** Voice-only existing preparation steps remain exact guidance, never unrelated motion. */
export function sceneAudio(exercise?:V2Exercise): string|undefined {
  if (!exercise?.sceneId) return;
  // The legacy shoulder-mobility recording is not a reach-specific instruction.
  if (exercise.sceneId==='recovery-0-2') return;
  for(const stage of recovery) for(let index=0;index<stage.items.length;index++){
    const item=stage.items[index];
    if((item.id??`recovery-${recovery.indexOf(stage)}-${index}`)===exercise.sceneId)
      return localAudio('voice' in item?item.voice:undefined);
  }
}

/** The visible session cannot start/count a movement without its matching demo. */
export function trainingSessionReducer(session:V2Session, action:V2Action):V2Session {
  const canDemonstrate=(s:V2Session)=> {
    const e=s.workout.exercises[s.exerciseIndex];
    return Boolean(exerciseScene(e)||hasApprovedRealTimeCoach(e?.motionKey));
  };
  if ((session.phase==='ready'||session.phase==='work') && !canDemonstrate(session)
      && ['start','tick','complete-set'].includes(action.type))
    return session.running?{...session,running:false}:session;
  const next=v2SessionReducer(session,action);
  return next.phase==='work'&&next.running&&!canDemonstrate(next)
    ? {...next,phase:'ready',phaseSecondsLeft:null,running:false}:next;
}
