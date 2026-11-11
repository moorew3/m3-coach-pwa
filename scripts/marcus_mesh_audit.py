#!/usr/bin/env python3
"""Read-only audit of real, owner-linked Marcus GLBs. Do not touch approved production assets."""
import json,struct,urllib.request,hashlib,pathlib,collections,sys
from io import BytesIO

ASSETS = {
 "base-rig":"https://v3b.fal.media/files/b/0ab1f374/vPQAs4jIWDuIQlXbUMvqb_rigged_character.glb",
 "base-unrigged":"https://v3b.fal.media/files/b/0ab1f370/ZZlog3iAT3sWigwE4Ckin_model.glb",
 "tattoo-retexture":"https://v3b.fal.media/files/b/0ab204d8/AgRw7EN0XgucQDEkntBea_model.glb",
 "highres-rig":"https://v3b.fal.media/files/b/0ab204a8/tRlXImMgp-unvjOBotywY_rigged_character.glb",
}
ROOT=pathlib.Path("artifacts/marcus-model-audit")
ROOT.mkdir(parents=True,exist_ok=True)
def parse_glb(b):
 assert b[:4]==b"glTF", "Invalid GLB magic"
 magic,version,size=struct.unpack_from("<4sII",b,0)
 assert version==2 and size==len(b), "Invalid GLB header"
 pos=12
 chunks=[]
 while pos<size:
  length,typ=struct.unpack_from("<I4s",b,pos)
  pos+=8
  chunks.append((typ,b[pos:pos+length]));pos+=length
 assert chunks[0][0]==b"JSON", "GLB must start with JSON"
 data=json.loads(chunks[0][1]);payloads=[v for typ,v in chunks if typ==b"BIN\x00"]
 return data,payloads
def accessor_data(gltf,bin_chunks,ix):
 acc=gltf["accessors"][ix];view=gltf["bufferViews"][acc["bufferView"]]
 n=acc["count"];component=acc["componentType"];shape=acc["type"]
 assert component in (5126,5123,5125,5121), "unsupported component"
 typ={5126:"f",5123:"H",5125:"I",5121:"B"}[component]
 width={"SCALAR":1,"VEC2":2,"VEC3":3,"VEC4":4,"MAT4":16}[shape]
 fmt="<"+typ*width
 size=struct.calcsize(fmt);stride=view.get("byteStride",size)
 raw=bin_chunks[view.get("buffer",0)]
 start=view.get("byteOffset",0)+acc.get("byteOffset",0)
 assert start+(n-1)*stride+size <= len(raw),"Accessor outside BIN"
 return [struct.unpack_from(fmt,raw,start+i*stride) for i in range(n)]
def attribute_stats(gltf,bins,attr):
 result={}
 for idx,p in [(i,p) for i,m in enumerate(gltf.get("meshes",[])) for p in m.get("primitives",[])]:
  if attr not in p["attributes"]:continue
  accidx=p["attributes"][attr]
  values=accessor_data(gltf,bins,accidx)
  d=len(values[0])
  extent=[(round(min(v[j] for v in values),5),round(max(v[j] for v in values),5)) for j in range(d)]
  # Hash direct floats and normalized quantization to discover UV mapping reuse
  chunks=[struct.pack("<"+"f"*d,*v) for v in values]
  result[str(idx)]={"count":len(values),"componentType":gltf["accessors"][accidx]["componentType"],
    "range":extent,"exact_sha256":hashlib.sha256(b"".join(chunks)).hexdigest(),
    "first":values[:4]}
 return result
def uv_overlap(a,b):
 aa=a[0]; bb=b[0]
 def uvset(v):return set((round(x,4),round(y,4)) for x,y,*_ in v)
 A=uvset(aa);B=uvset(bb)
 return {"a_unique":len(A),"b_unique":len(B),"intersection":len(A&B),
 "a_match_fraction":round(len(A&B)/max(1,len(A)),5),
 "b_match_fraction":round(len(A&B)/max(1,len(B)),5)}

def summaries():
 out={}
 for key,url in ASSETS.items():
  print("FETCH",key,flush=True)
  with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"M3-Flex-Audit/1.0"}),timeout=80) as resp:
   assert resp.status==200 and int(resp.headers.get("Content-Length","0") or "0") < 100_000_000
   b=resp.read(95_000_000)
  if not b or len(b)>=95_000_000:raise RuntimeError("Empty/oversized input")
  (ROOT/(key+".glb")).write_bytes(b)
  j,chunks=parse_glb(b)
  primitives=[(mi,p) for mi,m in enumerate(j.get("meshes",[])) for p in m.get("primitives",[])]
  hist=collections.Counter()
  for mi,p in primitives:hist.update(p.get("attributes",{}).keys())
  report={"sha256":hashlib.sha256(b).hexdigest(),"bytes":len(b),
   "nodes":len(j.get("nodes",[])),"skins":len(j.get("skins",[])),
   "mesh_count":len(j.get("meshes",[])),"primitive_count":len(primitives),
   "materials":len(j.get("materials",[])),
   "accessors":len(j.get("accessors",[])),
   "images":len(j.get("images",[])),
   "bin_bytes":[len(x) for x in chunks],
   "attr_counts":hist,
   "meshes":[{"name":m.get("name",""),"primitives":[{"attrs":p.get("attributes",{}),"indices":p.get("indices"),"material":p.get("material"),"mode":p.get("mode",4)} for p in m.get("primitives",[])]} for m in j.get("meshes",[])],
   "skin_info":[{"name":s.get("name"),"skeleton":s.get("skeleton"),"joints":len(s.get("joints",[])),"joint_names":[j.get("nodes",[])[i].get("name") for i in s.get("joints",[])[:60]]} for s in j.get("skins",[])],
   "image_info":[{"name":im.get("name"),"mimeType":im.get("mimeType"),"bufferView":im.get("bufferView"),"uri":im.get("uri","")[:100]} for im in j.get("images",[])],
   "material_info":[{"name":m.get("name"),"pbr":m.get("pbrMetallicRoughness"),"normal":m.get("normalTexture")} for m in j.get("materials",[])],
   "animation_names":[a.get("name") for a in j.get("animations",[])],
   "positions":attribute_stats(j,chunks,"POSITION"),
   "uvs":attribute_stats(j,chunks,"TEXCOORD_0"),
   "node_mesh_skins":[{"node":i,"name":n.get("name"),"mesh":n.get("mesh"),"skin":n.get("skin"),"children":len(n.get("children",[]))} for i,n in enumerate(j.get("nodes",[])) if "mesh" in n]}
  out[key]=report
  print("SUMMARY",key,json.dumps({k:v for k,v in report.items() if k not in ("meshes","skin_info","material_info","node_mesh_skins")},default=str))
  print("MESHES",key,json.dumps([(m["name"],len(m["primitives"]),str(m["primitives"][0]["attrs"])[:240]) for m in report["meshes"][:30]]))
  print("SKINS",key,json.dumps(report["skin_info"][:2]))
  print("MESH-NODES",key,json.dumps(report["node_mesh_skins"][:20]))
  print("MATERIALS",key,json.dumps(report["material_info"][:10]))
  print("GEOMETRY",key,json.dumps({"positions":report["positions"],"uvs":report["uvs"]})[:1700])
 # Quantify whether original rig UVs match the re-textured source geometry.
 original=out["base-rig"]; clean=out["base-unrigged"]; retextured=out["tattoo-retexture"]
 print("UV-DIRECT",json.dumps({
  "rig_vs_unrigged":original["uvs"]["0"]["exact_sha256"]==clean["uvs"]["0"]["exact_sha256"],
  "unrigged_vs_retextured":clean["uvs"]["0"]["exact_sha256"]==retextured["uvs"]["0"]["exact_sha256"],
  "original_vertex_count":original["positions"]["0"]["count"],
  "retexture_vertex_count":retextured["positions"]["0"]["count"]}))
 (ROOT/"audit.json").write_text(json.dumps(out,indent=2,default=list))
 # Safety invariant: don't conflate transformed unrigged textures with rigged geometry
 assert out["base-rig"]["skins"] > 0,"Original rig not present"
 assert out["base-unrigged"]["skins"] == 0,"Unexpected source skin"
 assert out["tattoo-retexture"]["skins"] == 0,"Retextured mesh changed rig unexpectedly"
 print("AUDIT_OK Four real GLBs fetched and parsed. No deployed assets changed.")
if __name__=="__main__":
 summaries()
