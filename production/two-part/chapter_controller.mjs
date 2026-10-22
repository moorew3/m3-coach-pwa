/** M3 FLEX guarded chapter controls for two completed MASTER MP4s.
 * Integrate only after both masters, owner approval and clinician clearance.
 * Designed to attach to the EXISTING application video element: no new app.
 * External chapter JSON comes from build_masters.py.
 */
export class M3FlexChapterController {
  constructor({video, part, chapters, storage=null, onUpdate=()=>{}}) {
    if (!video || typeof video.addEventListener!=="function") throw new TypeError("HTMLVideoElement required");
    if (!["A","B"].includes(part)) throw new TypeError("Part must be A or B");
    if (!Array.isArray(chapters) || chapters.length===0) throw new Error("Master chapters required");
    this.chapters=chapters.map((c,i)=>({
      index:i,id:String(c.sceneId),title:String(c.title),
      start:Number(c.startMs)/1000,end:Number(c.endMs)/1000
    }));
    for(const c of this.chapters) {
      if(!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end<=c.start)
        throw new Error("Invalid chapter timing");
      if(c.index>0 && Math.abs(this.chapters[c.index-1].end-c.start)>.2)
        throw new Error("Discontinuous chapter timing");
    }
    this.video=video;this.part=part;this.storage=storage;this.onUpdate=onUpdate;
    this.key="m3flex-two-master-"+part+"-progress-v1";
    this.watch=this.chapters.map(()=>0);
    this.lastTime=null;this.status="ready";this.started=false;
    this.load();
    video.addEventListener("play",()=>{this.status="playing";this.started=true;this.lastTime=video.currentTime;this.notify()});
    video.addEventListener("pause",()=>{if(this.status==="playing")this.status="paused";this.lastTime=null;this.save();this.notify()});
    video.addEventListener("seeking",()=>{this.lastTime=null;this.notify()});
    video.addEventListener("timeupdate",()=>this.onTimeUpdate());
    video.addEventListener("ended",()=>this.onEnd());
    video.addEventListener("error",()=>{this.lastTime=null;this.status="error";this.notify()});
  }
  get currentChapterIndex() {
    const t=Math.max(0,Number(this.video.currentTime)||0);
    const idx=this.chapters.findIndex(c=>t>=c.start && t<c.end);
    return idx>=0?idx:(t>=this.chapters.at(-1).end?this.chapters.length-1:0);
  }
  get currentChapter(){return this.chapters[this.currentChapterIndex]}
  get completion() {
    return this.chapters.map((c,i)=>{
      const d=c.end-c.start;
      return {title:c.title,watchedSeconds:+this.watch[i].toFixed(1),
        durationSeconds:+d.toFixed(1),complete:this.watch[i]>=d*.8};
    });
  }
  get fullyCompleted(){return this.completion.every(c=>c.complete)}
  get watchedPercent(){
    const target=this.chapters.reduce((s,c)=>s+(c.end-c.start),0);
    return target>0?Math.min(100,Math.floor(100*this.watch.reduce((a,b)=>a+b,0)/target)):0;
  }
  onTimeUpdate() {
    const t=Number(this.video.currentTime);
    if(!Number.isFinite(t))return;
    if(!this.video.paused && this.lastTime!==null) {
      const d=t-this.lastTime;
      // A seek, stall, background transition or large time jump is never
      // counted as watched exercise. Only actual continuous playback accrues.
      if(d>0 && d<=2.0){
        const chapter=this.chapters.findIndex(c=>this.lastTime>=c.start && this.lastTime<c.end);
        if(chapter>=0){
          const c=this.chapters[chapter];
          this.watch[chapter]=Math.min(c.end-c.start,this.watch[chapter]+Math.min(d,c.end-this.lastTime));
        }
      }
    }
    this.lastTime=t;
    this.save();this.notify();
  }
  onEnd() {
    this.lastTime=null;
    this.status=this.fullyCompleted?"complete":"partially-watched";
    this.save();this.notify();
  }
  async play(){return this.video.play()}
  pause(){this.video.pause()}
  resume(){return this.play()}
  seekChapter(index) {
    if(!Number.isInteger(index)||index<0||index>=this.chapters.length)throw new RangeError("Invalid chapter index");
    this.lastTime=null;
    this.video.currentTime=this.chapters[index].start;
    this.save();this.notify();
  }
  nextChapter(){const i=this.currentChapterIndex;if(i<this.chapters.length-1)this.seekChapter(i+1)}
  previousChapter(){
    const i=this.currentChapterIndex;
    this.seekChapter(this.video.currentTime-this.chapters[i].start>3?i:Math.max(0,i-1));
  }
  repeatChapter(){this.seekChapter(this.currentChapterIndex)}
  save(){
    if(!this.storage)return;
    try{
      this.storage.setItem(this.key,JSON.stringify({
        chapters:this.chapters.map(c=>c.id+"@"+c.start+"-"+c.end),
        watch:this.watch,
        resumeAt:Number(this.video.currentTime)||0,
        status:this.status
      }));
    }catch(_){}
  }
  load(){
    if(!this.storage)return;
    try{
      const state=JSON.parse(this.storage.getItem(this.key)||"null");
      if(!state || JSON.stringify(state.chapters)!==JSON.stringify(this.chapters.map(c=>c.id+"@"+c.start+"-"+c.end)))return;
      if(!Array.isArray(state.watch)||state.watch.length!==this.chapters.length)return;
      this.watch=state.watch.map((v,i)=>Math.max(0,Math.min(this.chapters[i].end-this.chapters[i].start,Number(v)||0)));
      this.resumeAt=Number(state.resumeAt)||0;
      this.status=state.status==="complete"&&this.fullyCompleted?"complete":"ready";
    }catch(_){}
  }
  resetProgress(){this.watch.fill(0);this.status="ready";this.lastTime=null;this.seekChapter(0)}
  notify(){this.onUpdate({
    part:this.part,status:this.status,chapter:this.currentChapter,
    watchedPercent:this.watchedPercent,chapters:this.completion,
    fullyCompleted:this.fullyCompleted
  })}
}
