/* M3 FLEX · Owner-reviewed visual clips with original narration replaced during playback.
 * Only the already approved Marcus voice ID and HeyGen Turbo Free are accepted.
 * Non-destructive: immutable source MP4, mute source audio, overlay Marcus WAV.
 * This is a composite in-app preview, NOT a rendered/lip-synced MP4.
 */
(function(root) {
  "use strict";
  var PAIR_KEY="m3-flex-marcus-owner-pair-v1";
  var MARCUS_ID="0fadce1e82af494a93873aa38ea8d106";
  var FREE_MODEL="heygen-voice-1-turbo-free";
  var MAX_LENGTH=350;
  var MAX_CACHE_MS=12*60*1000;
  var cache=new Map(), currentId="", currentVideo="", revision=0;
  var currentAudio=null, currentUrl="", currentText="", busy=false, saveScript=null;
  var byId=function(id){return document.getElementById(id)};
  var panel=function(){return byId("dubPanel")};
  function status(message){var e=byId("dubStatus");if(e)e.textContent=message}
  function getToken(){
    try {
      var token=sessionStorage.getItem(PAIR_KEY)||"";
      return /^[a-zA-Z0-9_-]{32,80}$/.test(token)?token:"";
    }catch(e){return ""}
  }
  function voiceURL(value){
    if(!value||typeof value!=="string"||value.length>2048)return "";
    try {
      var u=new URL(value,window.location.origin),host=u.hostname.toLowerCase();
      return u.protocol==="https:"&&!u.username&&!u.password&&
        (host==="heygen.ai"||host.endsWith(".heygen.ai")||host==="heygen.com"||host.endsWith(".heygen.com"))
        ?u.toString():"";
    }catch(e){return ""}
  }
  function labelFor(x){
    var n=String(x&&x.name||"").replace(/\s+/g," ").trim();
    if(n.length>57||/^(?:M3 FLEX|Animate|Internal review|REHAB VIDEO)/i.test(n))return "";
    return n.replace(/[^\p{L}\p{N} ,'&–-]/gu,"").slice(0,57);
  }
  function buildScript(x){
    var n=String(x&&x.name||"").toLowerCase(), label=labelFor(x);
    var instruction="Watch this exercise demonstration and move only within your clinician's clearance.";
    if(/wrist circles/.test(n))instruction="Keep your forearms supported as your wrists make small smooth circles.";
    else if(/wrist curls|wrist strength/.test(n))instruction="Keep your forearms supported and move only through the wrist, without swinging your elbows.";
    else if(/lateral raises/.test(n))instruction="Keep your shoulders relaxed. Lift your arms to the sides with control and lower slowly.";
    else if(/front raises|arm reaches/.test(n))instruction="Raise or reach your arms forward slowly, without leaning or using momentum.";
    else if(/hammer curls|alternating curls|biceps curls/.test(n))instruction="Keep your elbows near your sides and curl slowly, without swinging your upper arms.";
    else if(/rope pressdown|triceps pressdown/.test(n))instruction="Keep your elbows stable and extend your arms smoothly against the resistance.";
    else if(/chest fly/.test(n))instruction="Keep the resistance behind your torso, never around your neck. Bring your hands together in a controlled arc.";
    else if(/chest press|forward pressing/.test(n))instruction="Press forward with control. Keep the resistance behind your torso, not around your neck.";
    else if(/lat pulldown/.test(n))instruction="Pull the bar toward your upper chest with control. Avoid leaning or arching your back.";
    else if(/boxing|jab|punch/.test(n))instruction="Stay seated and send controlled punches from your shoulders, without any footwork.";
    else if(/stretch|mobility/.test(n))instruction="Move gently into a comfortable range without forcing your shoulders or twisting.";
    else if(/shrugs/.test(n))instruction="Lift both shoulders gently toward your ears, then lower with control.";
    else if(/hand opening/.test(n))instruction="Open and close your hands smoothly, with your forearms supported.";
    var lead=label?"Marcus here. "+label+". ":"Marcus here. Here is your visual movement demonstration. ";
    var finalText=lead+instruction+" Keep your injured left leg supported and completely unloaded. Stop for new pain.";
    return finalText.slice(0,MAX_LENGTH);
  }
  function stop(){
    revision++;
    if(currentAudio){
      currentAudio.onended=null;currentAudio.onerror=null;currentAudio.onplaying=null;
      try{currentAudio.pause();currentAudio.currentTime=0}catch(e){}
      currentAudio=null;
    }
    busy=false;
    var play=byId("dubPlay"); if(play)play.disabled=!currentUrl;
  }
  function sync(item,opts){
    var box=panel();
    if(!box)return;
    var allow=!!(item&&opts&&opts.visualApproved);
    box.hidden=!allow;
    if(!allow){if(currentId){stop();currentId="";currentUrl="";currentText=""}return;}
    var id=String(item.id||"");
    var video=String(item.video||"");
    var saved=typeof opts.savedScript==="string"?opts.savedScript.trim():"";
    var newScene=id!==currentId||video!==currentVideo;
    if(newScene){
      stop();currentId=id;currentVideo=video;currentUrl="";currentText="";
      byId("dubScript").value=(saved||buildScript(item)).slice(0,MAX_LENGTH);
      byId("dubPlay").disabled=true;
      status("Movement kept; original speaker muted. Generate approved Marcus narration to preview it. Lip movements are not yet edited.");
    }
    byId("dubSource").textContent="Video: "+id+" · Original unchanged · Not yet final lip-sync approved";
  }
  function onSave(fn){saveScript=typeof fn==="function"?fn:null}
  function saveDraft(){
    if(!currentId)return;
    var line=(byId("dubScript").value||"").trim().replace(/\s+/g," ").slice(0,MAX_LENGTH);
    if(saveScript)saveScript(currentId,line);
  }
  function allowedForPlayback(){
    var box=panel(),video=byId("film");
    return box&&!box.hidden&&video&&!video.error&&!!video.src&&!!currentId;
  }
  async function prepare(){
    if(busy)return;
    if(!allowedForPlayback()){status("Select a visual-approved clip with playable source footage.");return;}
    var token=getToken();
    if(!token){status("This browser is not paired for private Marcus voice. Open M3 FLEX from your owner voice link in this same tab, then select Review Videos.");return;}
    var line=String(byId("dubScript").value||"").trim().replace(/\s+/g," ");
    if(!line||line.length>MAX_LENGTH){status("Enter 1 to 350 characters of narration for this reviewed exercise.");return;}
    saveDraft();
    var sceneId=currentId,reqId=++revision,key=sceneId+"|"+line;
    var stored=cache.get(key);
    if(stored&&Date.now()-stored.at<MAX_CACHE_MS){
      currentUrl=stored.url;currentText=line;
      byId("dubPlay").disabled=false;
      status("Approved Marcus audio is ready. Tap Play Marcus + video. Original speaker remains muted.");
      return;
    }
    var source=byId("film");
    source.muted=true;
    busy=true;byId("dubGenerate").disabled=true;
    status("Generating this exact script in Marcus – Warm & Friendly with HeyGen Turbo Free. No paid-model fallback.");
    try{
      var response=await fetch("/api/public/marcus-speech",{
        method:"POST",
        headers:{"content-type":"application/json","x-m3-flex-owner":token},
        body:JSON.stringify({text:line}),cache:"no-store",
      });
      var body=await response.json().catch(function(){return {}});
      if(reqId!==revision||sceneId!==currentId)return;
      if(!response.ok)throw Error(String(body.message||"Marcus speech service unavailable.").slice(0,220));
      if(body.voiceId!==MARCUS_ID||body.model!==FREE_MODEL)throw Error("Generated speech is not the approved Marcus voice and free model.");
      var checked=voiceURL(body.audioUrl);
      if(!checked)throw Error("HeyGen provided no trusted Marcus audio URL.");
      cache.set(key,{url:checked,at:Date.now()});
      currentUrl=checked;currentText=line;
      byId("dubPlay").disabled=false;
      status("Marcus narration ready. Tap Play Marcus + video to hear the source video with the wrong audio muted.");
    }catch(e){
      if(reqId!==revision)return;
      currentUrl="";currentText="";
      byId("dubPlay").disabled=true;
      status("Could not generate Marcus narration: "+(e&&e.message||"Unknown error")+". Original voice remains muted. No different voice was substituted.");
    }finally{
      if(reqId===revision){
        busy=false;byId("dubGenerate").disabled=false;
      }
    }
  }
  function play(){
    if(!allowedForPlayback()||!currentUrl){status("Generate Marcus narration first.");return;}
    if(String(byId("dubScript").value||"").trim().replace(/\s+/g," ")!==currentText){status("Script changed. Generate the updated Marcus recording before playing.");byId("dubPlay").disabled=true;return;}
    stop();
    var film=byId("film");film.muted=true;film.loop=true;
    try{film.currentTime=0}catch(e){}
    var a=new Audio(currentUrl);
    currentAudio=a;
    a.volume=1;a.preload="auto";
    a.onplaying=function(){status("Marcus voice playing over the original video. Original video audio muted. This is not yet a lip-synced export.");};
    a.onerror=function(){if(currentAudio!==a)return;status("Marcus audio could not play. The original narration remains muted.");};
    a.onended=function(){if(currentAudio!==a)return;status("Marcus voice finished. Video demonstration can continue silently. Lip-sync still needs final review.");};
    var vp=film.play();
    if(vp&&vp.catch)vp.catch(function(){if(currentAudio===a){a.pause();status("Video playback was blocked or its source expired. Nothing was approved.");}});
    var ap=a.play();
    if(ap&&ap.catch)ap.catch(function(){if(currentAudio===a){status("Tap Play Marcus + video once more to allow sound on this device. No alternate voice was used.");}});
  }
  function init(){
    var box=panel();if(!box)return;
    byId("dubGenerate").addEventListener("click",function(){void prepare()});
    byId("dubPlay").addEventListener("click",play);
    byId("dubStop").addEventListener("click",function(){stop();status("Marcus narration stopped; source audio remains muted.");});
    byId("dubScript").addEventListener("change",function(){saveDraft();currentUrl="";currentText="";byId("dubPlay").disabled=true;status("Script saved with your review. Generate this version to hear Marcus.");});
    byId("dubScript").addEventListener("input",function(){if(currentText&&this.value.trim()!==currentText)byId("dubPlay").disabled=true;});
    byId("film").addEventListener("volumechange",function(){if(!box.hidden&&!this.muted)this.muted=true;});
    byId("film").addEventListener("error",function(){if(!box.hidden)stop();});
    window.addEventListener("pagehide",stop);
  }
  root.M3_FLEX_DUB={buildScript:buildScript,sync:sync,onSave:onSave,stop:stop,
    _test:{voiceURL:voiceURL,getToken:getToken,saveDraft:saveDraft,prepare:prepare,play:play}};
  if(typeof document!=="undefined")init();
})(window);
