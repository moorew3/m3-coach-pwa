import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const code=fs.readFileSync(new URL('../public/recovery-coach/sarah-bridge.js',import.meta.url),'utf8');
function bridge(){const replies=[],calls=[];let listener;const owner={postMessage:(m,o)=>replies.push({m,o})};const window={opener:owner,addEventListener:(t,fn)=>{listener=fn;},removeEventListener(){}};vm.runInNewContext(code,{window,Set});window.installSarahFlexBridge({status:()=>({mode:'ready',actualRepsMeasured:false}),command:async c=>{calls.push(c);return {ok:false,error:'Clearance required'};}});return {replies,calls,send:(origin,source,command='start',id='one')=>listener({origin,source,data:{type:'sarah-flex-command',version:1,id,command}}),owner};}
test('bridge rejects untrusted origins and other windows',async()=>{const b=bridge();await b.send('https://attacker.test',b.owner);await b.send('https://m3-sarah-voice.cvill4life.chatgpt.site',{});assert.equal(b.calls.length,0);assert.equal(b.replies.length,0);});
test('status is read-only and duplicate movement IDs execute at most once',async()=>{const b=bridge(),o='https://m3-sarah-voice.cvill4life.chatgpt.site';await b.send(o,b.owner,'status');assert.equal(b.calls.length,0);assert.equal(b.replies[0].m.status.actualRepsMeasured,false);await b.send(o,b.owner,'start','two');await b.send(o,b.owner,'start','two');assert.deepEqual(b.calls,['start']);assert.equal(b.replies[1].m.ok,false);assert.equal(b.replies[1].m.error,'Clearance required');});
test('unsupported commands cannot alter logs or approvals',async()=>{const b=bridge();await b.send('https://m3-sarah-voice.cvill4life.chatgpt.site',b.owner,'clear-records');assert.equal(b.calls.length,0);assert.equal(b.replies.length,0);});
