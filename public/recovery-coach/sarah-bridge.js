/* Sarah ↔ the existing M3 FLEX player. No network, storage, AI or new media. */
(function(root){
 'use strict';
 const SARAH_ORIGIN='https://m3-sarah-voice.cvill4life.chatgpt.site';
 root.installSarahFlexBridge=function(player){
  const owner=root.opener;
  if(!owner)return ()=>{};
  const seen=new Set();
  const send=(origin,id,result)=>owner.postMessage({type:'m3-flex-response',version:1,id,...result},origin);
  const listener=async event=>{
   if(event.source!==owner||event.origin!==SARAH_ORIGIN)return;
   const m=event.data;
   if(!m||m.type!=='sarah-flex-command'||m.version!==1||typeof m.id!=='string'||m.id.length>100)return;
   if(!['status','start','pause','resume','next','stop'].includes(m.command))return;
   if(seen.has(m.id))return;
   if(seen.size>500){send(event.origin,m.id,{ok:false,error:'Reconnect the workout window.'});return;}
   seen.add(m.id);
   try{
    const result=m.command==='status'?{ok:true}:await player.command(m.command);
    send(event.origin,m.id,{...result,status:player.status()});
   }catch{send(event.origin,m.id,{ok:false,error:'Workout command could not be confirmed. Check the player.'});}
  };
  root.addEventListener('message',listener);
  return ()=>root.removeEventListener('message',listener);
 };
})(window);
