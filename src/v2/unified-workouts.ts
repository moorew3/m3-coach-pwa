/** Adapters for existing programs only. Prescriptions and approved media are preserved. */
import recovery from '../data/recovery-scenes.json';
import core from '../data/bench-core-existing.json';
import { ORIGINAL_WEEK_WORKOUTS } from './original-week-workouts';
import { V2_WORKOUTS } from './catalog';
import type { V2Exercise, V2Workout } from './types';

const motion: Record<string,string> = {'C01-R3':'shrugs','C02':'hammerCurl','C03':'frontRaise','C04-R2':'dumbbellCurl','C08-PRESS-R3':'chestPress'};
const selections = {recovery:['C01-R3','C02','C03','C04-R2','C08-PRESS-R3'], A:['C01-R3','C02'], B:['C08-PRESS-R3','C03','C04-R2']};
const main = recovery[1].items;
export const RECOVERY_WORKOUTS: V2Workout[] = Object.entries(selections).map(([id, ids]) => {
  const stages = [recovery[0].items, main.filter(x=>ids.includes(x.id ?? '')), recovery[2].items];
  return {id, title:id==='recovery'?'Seated Recovery':`Workout ${id} · Approved scenes`,
    focus:id==='recovery'?'Five approved seated movements with original preparation and cooldown.':`Approved ${id} preview. Additional draft scenes remain in review.`, requiresClearance:true,
    exercises:stages.flatMap((items,phase)=>items.map((item,index):V2Exercise=>({
      id:item.id ?? `${id}-${phase}-${index}`, name:item.name,
      category:phase===1?'strength':'mobility', sets:1,
      seconds:('sec' in item ? item.sec : undefined) ?? 30,
      restSeconds:phase===1?20:0, transitionSeconds:phase===1?20:0,
      motionKey:motion[item.id ?? ''] ?? 'unavailable',
      sceneId:item.id ?? `recovery-${phase}-${index}`,
      stageRole:phase===0?'preparation':phase===2?'cooldown':'exercise',
      cues:[item.note], warmupStyle:'none',loadClass:'upper',
    }))) };
});
export const CORE_WORKOUTS: V2Workout[] = Object.entries(core.routines).map(([id, routine])=>({
  id:`core-${id}`,title:routine.label,focus:routine.info,requiresClearance:true,
  exercises:[0,1].flatMap(round=>routine.ids.map(key=>{
    const move=core.movements[key as keyof typeof core.movements];
    return {id:`core-${key}-${round}`,name:move.name,category:'core' as const,sets:1,seconds:20,restSeconds:30,transitionSeconds:30,motionKey:'unavailable',cues:[move.setup,move.cue,move.limit],stageRole:'exercise' as const};
  })),
}));
export const ALL_WORKOUTS: V2Workout[] = [...RECOVERY_WORKOUTS,...ORIGINAL_WEEK_WORKOUTS,...V2_WORKOUTS,...CORE_WORKOUTS];
export const workoutById = (id: string | null | undefined) => ALL_WORKOUTS.find(w=>w.id===id);

import type {AppState,SessionExercise} from '../lib/store';
export function existingExercise(e:SessionExercise):V2Exercise {
 const time=e.reps.match(/(\d+)\s*(min|sec|s\b)/i);
 const seconds=time?Number(time[1])*(/^min/i.test(time[2])?60:1):undefined;
 const range=e.reps.match(/^(\d+)\s*[–-]\s*(\d+)/);
 const category:V2Exercise['category']=e.category==='boxing'?'boxing':e.category==='kick'?'kickboxing':e.category==='core'?'core':e.category==='mobility'?'mobility':e.category==='cardio'?'cardio':'strength';
 return {id:e.id,name:e.name,category,sets:e.sets,reps:e.reps,seconds,restSeconds:e.rest,
  motionKey:e.mirror??'unavailable',repRange:range?[Number(range[1]),Number(range[2])]:undefined,
  cues:[e.notes??'Use the setup prescribed for this exercise.','Keep the movement controlled.','Breathe steadily.'],warmupStyle:'none'};
}
/** Existing saved/custom plans join the same engine; their original records stay intact. */
export function workoutsForApp(state:Pick<AppState,'savedWorkouts'|'days'>):V2Workout[] {
 const saved=state.savedWorkouts.filter(w=>w.exercises.length>0).map(w=>({id:'saved-'+w.id,title:w.name,focus:'Your saved workout',exercises:w.exercises.map(existingExercise)}));
 const selected=Object.entries(state.days).flatMap(([day,log])=>log.sessionPlan?.exercises.length?[{id:'session-'+day,title:log.sessionPlan.title,focus:log.sessionPlan.focus,exercises:log.sessionPlan.exercises.map(existingExercise)}]:[]);
 return [...ALL_WORKOUTS,...saved,...selected];
}
