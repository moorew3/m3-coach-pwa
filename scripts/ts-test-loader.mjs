import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
registerHooks({
 resolve(specifier,context,next){
   if(specifier.startsWith('@/')||specifier.startsWith('.')){
     const base=specifier.startsWith('@/')?resolve(root,'src',specifier.slice(2)):resolve(dirname(fileURLToPath(context.parentURL)),specifier);
     for(const path of [base,base+'.ts',base+'.tsx',base+'.json']) if(existsSync(path)) return {url:pathToFileURL(path).href,shortCircuit:true};
   }
   return next(specifier,context);
 },
 load(url,context,next){
   if(url.endsWith('.ts')||url.endsWith('.tsx')) return {format:'module',shortCircuit:true,source:ts.transpileModule(readFileSync(fileURLToPath(url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText};
   if(url.endsWith('.json'))return {format:'module',shortCircuit:true,source:'export default '+readFileSync(fileURLToPath(url),'utf8')};
   return next(url,context);
 }
});
