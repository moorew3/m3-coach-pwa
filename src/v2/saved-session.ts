import type {V2Session,V2Workout} from './types';
import {createV2Session} from './session';
/** A restored session is always paused and never restores medical clearance. */
export function restoreSavedSession(raw:string|null,workout:V2Workout,today:string):V2Session|null {
 try{
  const data=JSON.parse(raw??'null');
  if(data?.version!==2||data.savedOn!==today||data.workoutId!==workout.id||!data.session)return null;
  const s=data.session;
  const ex=Number.isInteger(s.exerciseIndex)?Math.max(0,Math.min(workout.exercises.length-1,s.exerciseIndex)):0;
  const set=Number.isInteger(s.setIndex)?Math.max(0,Math.min(workout.exercises[ex].sets-1,s.setIndex)):0;
  return {...createV2Session(workout),workout,mode:'coach',running:false,exerciseIndex:ex,setIndex:set,
    phase:['ready','work','rest','transition','complete'].includes(s.phase)?s.phase:'ready',
    phaseSecondsLeft:typeof s.phaseSecondsLeft==='number'&&Number.isFinite(s.phaseSecondsLeft)?Math.max(0,Math.floor(s.phaseSecondsLeft)):null,
    elapsedSeconds:typeof s.elapsedSeconds==='number'&&Number.isFinite(s.elapsedSeconds)?Math.max(0,Math.floor(s.elapsedSeconds)):0,
    completedSetIds:Array.isArray(s.completedSetIds)?s.completedSetIds.filter((id:unknown)=>typeof id==='string'):[],
    targetWeights:s.targetWeights&&typeof s.targetWeights==='object'&&!Array.isArray(s.targetWeights)?s.targetWeights:{},
    setResults:s.setResults&&typeof s.setResults==='object'&&!Array.isArray(s.setResults)?s.setResults:{},
  };
 }catch{return null;}
}
