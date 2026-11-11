/**
 * Script-exact CAST program coaching.
 * The existing vetted white-left-cast footage stays mute; the only voice is
 * HeyGen voice 0fadce1e82af494a93873aa38ea8d106 (Marcus, English).
 * No default Android voice, no voice substitutions and no paid-model fallback.
 * When unpaired/offline, show the real exercise text rather than fake speech.
 */
import type {V2Exercise} from "./types";
import {requestMarcusLiveSpeech} from "@/lib/marcus-live-client";
import {playRecordedCoachAudio} from "./recorded-coach-player";

const cache=new Map<string,{url:string;at:number}>();
export function castCoachScript(exercise:V2Exercise):string|undefined {
 if(!exercise.motionKey.startsWith("cast-"))return;
 const lead="Marcus here. "+exercise.name.replace(/\s*·.*/,"")+". ";
 // Exact recorded visuals and instruction text are tied to this SAME stage.
 const lines=[lead,exercise.cues[0]||"",exercise.cues[1]||"",exercise.cues[2]||""];
 let result="";
 for(const line of lines){
  if((result+line+" ").length>350)break;
  result+=(result?" ":"")+line.trim();
 }
 return result.trim();
}
export async function speakCastCoach(exercise:V2Exercise,signal:AbortSignal):Promise<boolean>{
 const text=castCoachScript(exercise);
 if(!text||signal.aborted)return false;
 const now=Date.now(),prior=cache.get(text);
 let url=prior&&now-prior.at<12*60_000?prior.url:undefined;
 if(!url){
  // Fail closed if the owner has not paired the phone or Turbo Free is disabled.
  url=await requestMarcusLiveSpeech(text,signal);
  if(signal.aborted)return false;
  cache.set(text,{url,at:Date.now()});
 }
 if(signal.aborted)return false;
 return playRecordedCoachAudio(url,"trainer-scene");
}
