#!/usr/bin/env python3
"""M3 FLEX: preserve approved 24-joint rig while baking upgraded tattoo texture.
Review candidate only. No GPU/AI calls. Never mark model identity approved.
"""
import io,hashlib,json,pathlib,struct,sys,collections
from PIL import Image

HERE=pathlib.Path("artifacts/marcus-model-audit")
OUT=pathlib.Path("artifacts/marcus-texture-refined")
OUT.mkdir(parents=True,exist_ok=True)
def glb_parts(blob):
    assert blob[:4]==b"glTF" and struct.unpack_from("<I",blob,4)[0]==2
    size=struct.unpack_from("<I",blob,8)[0]
    assert size==len(blob)
    chunks=[]
    p=12
    while p<size:
        n,kind=struct.unpack_from("<I4s",blob,p);p+=8
        chunks.append((kind,blob[p:p+n]));p+=n
    return json.loads(chunks[0][1].decode("utf8")),next(b for typ,b in chunks if typ==b"BIN\x00")
def image_bytes(j,b,idx):
    im=j["images"][idx]
    assert im.get("mimeType") in ("image/jpeg","image/png"),"Unsupported image"
    v=j["bufferViews"][im["bufferView"]]
    return b[v.get("byteOffset",0):v.get("byteOffset",0)+v["byteLength"]]
def texture_image(j,b,name):
    mat=j["materials"][0]
    t=mat["pbrMetallicRoughness"]["baseColorTexture"] if name=="base" else mat["normalTexture"]
    tex=j["textures"][t["index"]]
    return image_bytes(j,b,tex["source"])
def accessor_points(j,buffer,index):
    a=j["accessors"][index];v=j["bufferViews"][a["bufferView"]]
    assert a["type"]=="VEC2" and a["componentType"]==5126
    start=v.get("byteOffset",0)+a.get("byteOffset",0)
    stride=v.get("byteStride",8)
    return [struct.unpack_from("<ff",buffer,start+i*stride) for i in range(a["count"])]
def uv_check(ja,ba,jb,bb):
    pa=ja["meshes"][0]["primitives"][0]
    pb=jb["meshes"][0]["primitives"][0]
    aa=accessor_points(ja,ba,pa["attributes"]["TEXCOORD_0"])
    bbp=accessor_points(jb,bb,pb["attributes"]["TEXCOORD_0"])
    qa=set((round(u,3),round(v,3)) for u,v in aa)
    qb=set((round(u,3),round(v,3)) for u,v in bbp)
    inter=qa&qb
    ratio=len(inter)/max(1,len(qb))
    # Detect UV atlas re-use, not identical geometry; vertex count differs after rigging.
    stats={"rig_uvs":len(qa),"texture_uvs":len(qb),"matching_uvs":len(inter),
           "texture_match_fraction":round(ratio,4)}
    print("UV_ALIGNMENT",json.dumps(stats),flush=True)
    if ratio<0.15:
        raise RuntimeError("UV atlases do not correspond sufficiently: refuse transfer")
    return stats
def smaller_jpeg(raw,label,max_px=2048):
    im=Image.open(io.BytesIO(raw));im.load()
    original_size=im.size
    if im.mode!="RGB":im=im.convert("RGB")
    if max(im.size)>max_px:
        im.thumbnail((max_px,max_px),Image.Resampling.LANCZOS)
    b=io.BytesIO();im.save(b,format="JPEG",quality=91,optimize=True,progressive=True,subsampling=0)
    result=b.getvalue()
    print("TEXTURE",label,"source_px",original_size,"output_px",im.size,"output_bytes",len(result),flush=True)
    return result
def pack(j,b):
    j["buffers"][0]["byteLength"]=len(b)
    js=json.dumps(j,separators=(",",":"),ensure_ascii=False).encode("utf8")
    js+=b" "*((-len(js))%4)
    b+=b"\x00"*((-len(b))%4)
    total=12+8+len(js)+8+len(b)
    return (struct.pack("<4sII",b"glTF",2,total)+struct.pack("<I4s",len(js),b"JSON")+js+
            struct.pack("<I4s",len(b),b"BIN\x00")+b)
def main():
    orig=(HERE/"base-rig.glb").read_bytes()
    source=(HERE/"tattoo-retexture.glb").read_bytes()
    rig,jbin=glb_parts(orig)
    texture,tbin=glb_parts(source)
    assert len(rig.get("skins",[]))==1 and len(rig["skins"][0]["joints"])==24,"Rig missing"
    assert len(texture.get("skins",[]))==0,"Unexpected shape of source texture"
    uv=uv_check(rig,jbin,texture,tbin)
    modified=json.loads(json.dumps(rig))
    # Preserve original render bones, animations, 3D vertices, winding & identity gate.
    newbin=bytearray(jbin)
    data=[]
    for kind in ("base","normal"):
        try:
            raw=texture_image(texture,tbin,kind)
        except (KeyError,IndexError):
            if kind=="normal":continue
            raise
        data.append((kind,smaller_jpeg(raw,kind)))
    for kind,pixels in data:
        while len(newbin)%4:newbin.append(0)
        view=len(modified["bufferViews"])
        modified["bufferViews"].append({"buffer":0,"byteOffset":len(newbin),"byteLength":len(pixels)})
        newbin.extend(pixels)
        imageidx=len(modified["images"])
        modified["images"].append({"bufferView":view,"mimeType":"image/jpeg","name":"Marcus transferred high-resolution "+kind})
        textureidx=len(modified["textures"])
        modified["textures"].append({"source":imageidx})
        if kind=="base":
            modified["materials"][0].setdefault("pbrMetallicRoughness",{})["baseColorTexture"]={"index":textureidx}
        else:
            modified["materials"][0]["normalTexture"]={"index":textureidx,"scale":0.5}
    blob=pack(modified,bytes(newbin))
    parsed,b=parse=glb_parts(blob)
    assert len(parsed["skins"])==len(rig["skins"])
    assert json.dumps(parsed["skins"],sort_keys=True)==json.dumps(rig["skins"],sort_keys=True)
    assert json.dumps(parsed.get("animations",[]),sort_keys=True)==json.dumps(rig.get("animations",[]),sort_keys=True)
    assert json.dumps(parsed["meshes"],sort_keys=True)==json.dumps(rig["meshes"],sort_keys=True)
    assert parsed["accessors"]==rig["accessors"]
    assert bytes(b[:len(jbin)])==jbin,"Bone/position/animation binary modified"
    fp=OUT/"marcus-rig-texture-candidate.glb"
    fp.write_bytes(blob)
    report={"status":"CANDIDATE_REVIEW_ONLY","source_sha256":hashlib.sha256(orig).hexdigest(),
        "generated_sha256":hashlib.sha256(blob).hexdigest(),"source_bytes":len(orig),"generated_bytes":len(blob),
        "joint_count":len(parsed["skins"][0]["joints"]),
        "animation_count":len(parsed.get("animations",[])),"mesh_primitives":len(parsed["meshes"][0]["primitives"]),
        "UV_comparison":uv,
        "texture_transfer":[kind for kind,_ in data],
        "production_approved":False,
        "warning":"Textures are approximations; exact face and tattoos are NOT verified; no exercise animations approved."}
    (OUT/"refinement-report.json").write_text(json.dumps(report,indent=2))
    print("REFINED_GLB_OK",json.dumps(report),flush=True)
if __name__=="__main__":main()
