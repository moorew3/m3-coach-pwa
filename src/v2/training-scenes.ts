/** One identity-gated scene resolver for Coach and Hologram views. */
import recovery from '../data/recovery-scenes.json';
import { approvedCoachMedia } from './approved-coach-media';
import type { V2Exercise, V2Session } from './types';
export type TrainingScene = {url:string;sceneId:string;label:string;audioUrl?:string;embeddedAudio?:boolean};
const trusted = new Map<string,TrainingScene>();
recovery.forEach((stage,phase)=>stage.items.forEach((item,index)=>{
  const id=item.id ?? `recovery-${phase}-${index}`;
  if ('video' in item && item.video) trusted.set(id,{url:item.video,sceneId:id,label:item.name,audioUrl:'voice' in item?item.voice:undefined,embeddedAudio:'embedded' in item&&item.embedded===true});
}));
export const REST_SCENE = trusted.get('C09-PRE-BREATH-R2')!;
export const COOLDOWN_SCENE = trusted.get('C10-POST-BREATH-R1')!;
export function exerciseScene(exercise?:V2Exercise):TrainingScene|undefined {
  if (!exercise) return;
  if (exercise.sceneId) return trusted.get(exercise.sceneId);
  const media=approvedCoachMedia(exercise);
  return media?{url:media.url,sceneId:`canonical:${exercise.motionKey}`,label:exercise.name}:undefined;
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
  for(const stage of recovery) for(let index=0;index<stage.items.length;index++){
    const item=stage.items[index];
    if((item.id??`recovery-${recovery.indexOf(stage)}-${index}`)===exercise.sceneId)
      return 'voice' in item?item.voice:undefined;
  }
}
