/**
 * M3 FLEX ready-to-run video programs.
 *
 * Original approved videos and original workouts are immutable.
 * White LEFT CAST footage is restricted to cast-only seated plans.
 * Legacy canonical original-coach footage is a separate NO-CAST training lane.
 * Unreviewed C13-C23 and signed/expired archive links are never auto-promoted.
 *
 * The video stage is mandatory: programs do not contain a blank placeholder,
 * stock person, static head, or unrelated motion clip.
 */
import type {V2Exercise,V2Workout} from "./types";
import {coachingCuesFor} from "./exercise-coaching";
import {coachMotionFor} from "@/data/coach-identity";
import recovery from "@/data/recovery-scenes.json";

export type FootageLane="cast"|"no-cast";
export type ReadyVideoWorkout=V2Workout & {footageLane:FootageLane;verifiedVideoProgram:true};
const castOriginals=new Map(recovery.flatMap(g=>g.items).filter(x=>"video" in x&&!!x.video&&"approved" in x&&x.approved)
  .map(x=>[x.id,x])); // Only seven explicitly owner-approved cast originals.
const castIds=new Set(["C09-PRE-BREATH-R2","C01-R3","C02","C03","C04-R2","C08-PRESS-R3","C10-POST-BREATH-R1"]);

type VideoStep={id:string;name:string;motionKey:string;sets:number;reps?:string;seconds?:number;rest:number;instructions:readonly [string,string,string];role?:V2Exercise["stageRole"]};
const castPrep:VideoStep={id:"C09-PRE-BREATH-R2",name:"Seated breathing · left cast supported",motionKey:"cast-seated-breathing",sets:1,seconds:30,rest:0,role:"preparation",instructions:[
  "Sit with your left cast supported and completely unloaded. Relax your shoulders.",
  "Breathe in slowly and breathe out smoothly while the seated breathing video plays.",
  "Keep the cast elevated and stop if you notice pain or pressure.",
]};
const castFinish:VideoStep={id:"C10-POST-BREATH-R1",name:"Seated cooldown breathing · cast elevated",motionKey:"cast-seated-cooldown",sets:1,seconds:30,rest:0,role:"cooldown",instructions:[
  "Remain seated with your left cast securely elevated and no weight through your left foot.",
  "Breathe slowly. Let your shoulders relax as the approved cooldown video plays.",
  "Finish without twisting or pushing off the injured leg.",
]};
const castMoves:Record<string,VideoStep>={
  "C01-R3":{id:"C01-R3",name:"Seated dumbbell shrugs · cast supported",motionKey:"cast-seated-shrugs",sets:3,reps:"8–10",rest:50,instructions:[
    "Sit with your left cast supported and both dumbbells at your sides.",
    "Raise your shoulders upward without bending the elbows, then lower slowly.",
    "Exhale as you shrug. Keep your injured left leg still and unloaded.",
  ]},
  "C02":{id:"C02",name:"Seated neutral-grip hammer curls · cast supported",motionKey:"cast-seated-hammer-curls",sets:3,reps:"8–10",rest:60,instructions:[
    "Sit with your cast supported. Hold each dumbbell with palms facing inward.",
    "Keep your elbows close to your ribs and curl without swinging.",
    "Exhale up, lower slowly, and keep all pressure off your left foot.",
  ]},
  "C03":{id:"C03",name:"Seated dumbbell front raises · cast supported",motionKey:"cast-seated-front-raises",sets:3,reps:"8–10",rest:60,instructions:[
    "Sit securely with your left cast unloaded and dumbbells in front of your thighs.",
    "Lift your arms straight forward under control, only through a comfortable shoulder range.",
    "Lower slowly without rocking your torso or pushing off the cast.",
  ]},
  "C04-R2":{id:"C04-R2",name:"Seated alternating curls · cast supported",motionKey:"cast-seated-alternating-curls",sets:3,reps:"8–10 per arm",rest:60,instructions:[
    "Sit with your left cast fully elevated and an approved dumbbell in each hand.",
    "Alternate the curling arms while the opposite arm remains controlled at your side.",
    "Keep your torso steady, elbows close, and left foot completely unloaded.",
  ]},
  "C08-PRESS-R3":{id:"C08-PRESS-R3",name:"Seated INNSTAR chest press · cast supported",motionKey:"cast-seated-innstar-chest-press",sets:3,reps:"8–10",rest:75,instructions:[
    "Sit securely with the INNSTAR resistance behind your torso and the pad between your back and chair, never at your neck.",
    "Press both handles forward from chest level under control. Do not switch to dumbbells.",
    "Return slowly. Keep your injured left leg supported and completely unloaded.",
  ]},
};
function castStep(s:VideoStep):V2Exercise {
  if(!castIds.has(s.id)||!castOriginals.has(s.id))throw Error("Unapproved cast video "+s.id);
  return {id:"ready-cast-"+s.id,name:s.name,category:s.role?"mobility":"strength",sets:s.sets,reps:s.reps,seconds:s.seconds,
    restSeconds:s.rest,transitionSeconds:s.role?0:20,sceneId:s.id,motionKey:s.motionKey,stageRole:s.role,
    cues:[...s.instructions],warmupStyle:"none",loadClass:"upper"};
}
function castProgram(id:string,title:string,ids:readonly string[]):ReadyVideoWorkout {
  return {id,title,focus:"Owner-approved moving footage: LEFT WHITE CAST, seated upper body. 3 sets per move, real rest and manual reps.",footageLane:"cast",verifiedVideoProgram:true,requiresClearance:true,
    exercises:[castStep(castPrep),...ids.map(k=>castStep(castMoves[k])),castStep(castFinish)]};
}
type NoCastStep={key:string;name:string;reps:string;sets:number;rest:number;category?:V2Exercise["category"]};
function noCastStep(step:NoCastStep):V2Exercise {
 const media=coachMotionFor(step.key);
 if(!media?.url)throw Error("Non-cast stage missing exact verified coach footage: "+step.key);
 return {id:"ready-no-cast-"+step.key,name:step.name,category:step.category??"strength",sets:step.sets,reps:step.reps,
   restSeconds:step.rest,transitionSeconds:15,motionKey:step.key,
   cues:[...coachingCuesFor(step.key,step.category??"strength")],warmupStyle:"none",loadClass:"upper"};
}
function noCastProgram(id:string,title:string,steps:readonly NoCastStep[]):ReadyVideoWorkout {
 return {id,title,focus:"Original standing/non-cast coach footage only. NOT for the injured/cast or non-weight-bearing phase.",footageLane:"no-cast",verifiedVideoProgram:true,requiresClearance:true,
   exercises:steps.map(noCastStep)};
}
export const READY_VIDEO_WORKOUTS:readonly ReadyVideoWorkout[]=[
 castProgram("ready-cast-a","CAST · Seated Upper A",["C01-R3","C02","C08-PRESS-R3"]),
 castProgram("ready-cast-b","CAST · Seated Upper B",["C03","C04-R2","C02"]),
 castProgram("ready-cast-c","CAST · Upper Combination",["C08-PRESS-R3","C01-R3","C03","C04-R2"]),
 noCastProgram("ready-no-cast-push","NO CAST · Push & Shoulders",[
   {key:"benchPress",name:"Bench press",sets:3,reps:"8–10",rest:90},
   {key:"inclineDumbbellPress",name:"Incline dumbbell press",sets:3,reps:"8–10",rest:90},
   {key:"lateralRaise",name:"Dumbbell lateral raises",sets:3,reps:"10–12",rest:60},
   {key:"tricepsPressdown",name:"Cable triceps pressdowns",sets:3,reps:"10–12",rest:60},
 ]),
 noCastProgram("ready-no-cast-pull","NO CAST · Back & Arms",[
   {key:"latPulldown",name:"Lat pulldown",sets:3,reps:"8–12",rest:75},
   {key:"seatedRow",name:"Seated cable row",sets:3,reps:"10–12",rest:75},
   {key:"hammerCurl",name:"Dumbbell hammer curls",sets:3,reps:"10–12",rest:60},
   {key:"bandPullApart",name:"Band pull-aparts",sets:2,reps:"12–15",rest:45},
 ]),
 noCastProgram("ready-no-cast-boxing","NO CAST · Controlled Boxing",[
   {key:"boxingStance",name:"Boxing stance setup",sets:1,reps:"30 sec",rest:20,category:"boxing"},
   {key:"jab",name:"Straight jabs",sets:3,reps:"30 sec",rest:30,category:"boxing"},
   {key:"cross",name:"Rear-hand cross",sets:3,reps:"30 sec",rest:30,category:"boxing"},
   {key:"jabCross",name:"Jab-cross combinations",sets:3,reps:"30 sec",rest:45,category:"boxing"},
   {key:"defensiveReset",name:"Guard reset",sets:2,reps:"30 sec",rest:30,category:"boxing"},
 ]),
];
export function readyVideoWorkout(id:string|null|undefined){return READY_VIDEO_WORKOUTS.find(w=>w.id===id);}
export function footageLaneFor(id:string):FootageLane|undefined{return readyVideoWorkout(id)?.footageLane;}
