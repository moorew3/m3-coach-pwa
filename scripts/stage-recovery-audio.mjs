/** Restore the exact existing Recovery Marcus audio without changing originals. */
import {readFile,mkdir,writeFile,rename,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await readFile(resolve(root,'approved-recovery-audio-runtime.json'),'utf8'));
const approved=JSON.parse(await readFile(resolve(root,'approved-recovery-media.json'),'utf8')).items.filter(x=>x.type==='audio');
if(manifest.schema!==1||manifest.items.length!==approved.length)throw new Error('Recovery audio inventory mismatch');
const hash=data=>createHash('sha256').update(data).digest('hex');
const queue=[...manifest.items];
async function worker(){
 while(queue.length){
  const item=queue.shift();
  if(!approved.some(x=>x.id===item.id&&x.url===item.sourceURL)||!/^\/media\/marcus-recovery\/[A-Z0-9-]+\.(wav|mp3)$/.test(item.path)||!/^[a-f0-9]{64}$/.test(item.sha256)||item.bytes<128||item.bytes>10_000_000)throw new Error('Unapproved recovery audio');
  const path=resolve(root,'public'+item.path);let data;
  try{data=await readFile(path);}catch{/* restored below */}
  if(!data||data.length!==item.bytes||hash(data)!==item.sha256){
   const response=await fetch(item.sourceURL,{redirect:'error',signal:AbortSignal.timeout(45000)});
   if(!response.ok)throw new Error('Approved recovery audio unavailable: '+item.id);
   data=Buffer.from(await response.arrayBuffer());
   if(data.length!==item.bytes||hash(data)!==item.sha256)throw new Error('Original recovery audio changed: '+item.id);
   await mkdir(dirname(path),{recursive:true});
   try{await writeFile(path+'.part',data);await rename(path+'.part',path);}finally{await rm(path+'.part',{force:true});}
  }
 }
}
await Promise.all(Array.from({length:4},worker));
console.log(`Bundled ${manifest.items.length} unchanged original Recovery Marcus recordings; SHA-256 verified.`);
