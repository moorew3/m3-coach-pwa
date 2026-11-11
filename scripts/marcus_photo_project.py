#!/usr/bin/env python3
"""M3 Flex: project *existing* approved coach photo details onto rig texture.

No generated faces, no AI models, no paid API. Only edits the material of an
isolated review candidate. All 24 original joints, animation channels, vertices,
vertex weights, rig topology, and medical boot remain byte-identical.

Quality gate: this process is an informed texture projection, NOT an exact
face sculpt, guaranteed ink alignment, or approved replacement for Marcus.
"""
from __future__ import annotations
import hashlib, io, json, struct, sys, time
from pathlib import Path
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from marcus_texture_refine import glb_parts, image_bytes, pack

ROOT=Path("public")
ASSET=ROOT/"marcus-candidates/marcus-retattoo-rigged.glb"
REFERENCE=ROOT/"coach-source/coach-primary-standing.png"
DEST=ROOT/"marcus-candidates/marcus-photo-projected-review.glb"
REPORT=Path("artifacts/marcus-photo-projection-qa.json")
DETAIL=2048

def read_accessor(j,b,index):
    acc=j["accessors"][index]; view=j["bufferViews"][acc["bufferView"]]
    typ=acc["componentType"];dims={"SCALAR":1,"VEC2":2,"VEC3":3,"VEC4":4}[acc["type"]]
    dtype={5121:np.dtype("u1"),5123:np.dtype("<u2"),5125:np.dtype("<u4"),5126:np.dtype("<f4")}[typ]
    width=dtype.itemsize*dims
    off=view.get("byteOffset",0)+acc.get("byteOffset",0)
    stride=view.get("byteStride",width)
    if stride==width:
        out=np.frombuffer(b,dtype=dtype,count=acc["count"]*dims,offset=off).reshape((-1,dims)).copy()
    else:
        out=np.ndarray((acc["count"],dims),dtype=dtype,buffer=b,offset=off,strides=(stride,dtype.itemsize)).copy()
    return out

def smooth01(x):
    a=np.clip(x,0,1)
    return a*a*(3-2*a)

def rasterize_texture(positions,normals,uvs,triangles,old,photo):
    size=old.shape[0]; sw,sh=photo.shape[1],photo.shape[0]
    new=old.astype(np.float32).copy()
    strength=np.zeros((size,size),np.float32)
    total_t=0;painted_t=0
    # glTF UV images use the top-left origin; texture bytes are not flipped.
    du=np.array([size-1,size-1],dtype=np.float32)
    for tri in triangles:
        total_t+=1
        p=positions[tri]; n=normals[tri]; t=uvs[tri]*du
        ymin,ymax=float(p[:,1].min()),float(p[:,1].max())
        if ymax<1.05 or ymin>1.699:continue
        if np.max(np.abs(p[:,0]))>0.46 and ymin<1.47:continue
        if np.max(n[:,2])<0.30:continue
        tx,ty=t[:,0],t[:,1]
        lx=max(0,int(np.floor(tx.min())));rx=min(size-1,int(np.ceil(tx.max())))
        ly=max(0,int(np.floor(ty.min())));ry=min(size-1,int(np.ceil(ty.max())))
        if rx<lx or ry<ly or (rx-lx+1)*(ry-ly+1)>50000:continue
        det=(ty[1]-ty[2])*(tx[0]-tx[2])+(tx[2]-tx[1])*(ty[0]-ty[2])
        if abs(det)<1e-5:continue
        yy,xx=np.mgrid[ly:ry+1,lx:rx+1]
        xx=xx.astype(np.float32)+0.5;yy=yy.astype(np.float32)+0.5
        w0=((ty[1]-ty[2])*(xx-tx[2])+(tx[2]-tx[1])*(yy-ty[2]))/det
        w1=((ty[2]-ty[0])*(xx-tx[2])+(tx[0]-tx[2])*(yy-ty[2]))/det
        w2=1-w0-w1
        inside=(w0>=-0.001)&(w1>=-0.001)&(w2>=-0.001)
        if not np.any(inside):continue
        px=w0*p[0,0]+w1*p[1,0]+w2*p[2,0]
        py=w0*p[0,1]+w1*p[1,1]+w2*p[2,1]
        nz=w0*n[0,2]+w1*n[1,2]+w2*n[2,2]
        # The approved source is a front-view upper-body image.
        head=py>=1.45
        rx_photo=np.where(head,0.5+px*1.40,0.5+px*0.85)*sw
        ry_photo=np.where(head,0.075+(1.7-py)*0.67,0.243+(1.45-py)*1.05)*sh
        # Keep original boot, shorts, side/back inks and surfaces untouched.
        is_head=(py>1.465)&(np.abs(px)<0.132)
        is_chest=(py>1.08)&(py<1.46)&(np.abs(px)<0.305)
        head_alpha=smooth01((py-1.465)/0.055)*smooth01((0.134-np.abs(px))/0.043)*0.93
        chest_alpha=smooth01((py-1.08)/0.06)*smooth01((1.48-py)/0.08)*smooth01((0.305-np.abs(px))/0.075)*0.83
        # Best for visible forward-facing surfaces, not ears/back or hands.
        face_factor=smooth01((nz-0.21)/0.48)
        alpha=(head_alpha*is_head+chest_alpha*is_chest)*face_factor
        alpha*=inside
        src_x=np.rint(rx_photo).astype(np.int32)
        src_y=np.rint(ry_photo).astype(np.int32)
        src_good=(src_x>=0)&(src_x<sw)&(src_y>=0)&(src_y<sh)
        alpha*=src_good
        if alpha.max()<0.025:continue
        # Prevent source studio background from staining the 3D body.
        sx=np.clip(src_x,0,sw-1);sy=np.clip(src_y,0,sh-1)
        pixels=photo[sy,sx].astype(np.float32)
        r,g,b=pixels[:,:,0],pixels[:,:,1],pixels[:,:,2]
        # Gym background is neutral/desaturated, with occasional neon.
        skin=smooth01(((r-g)-4)/20)*smooth01(((g-b)-0)/13)
        ink_dark=(r<100)&(g<94)&(b<88)&(r>g*1.08)
        skin=np.maximum(skin,ink_dark.astype(np.float32)*0.50)
        # Center-of-face and existing chest tattoo details get a controlled blend.
        alpha*=skin
        if alpha.max()<0.025:continue
        old_roi=new[ly:ry+1,lx:rx+1]
        prev=strength[ly:ry+1,lx:rx+1]
        # Weight overlaps deterministically without smearing unrelated islands.
        apply=alpha>prev
        mix=np.where(apply,alpha,0)[:,:,None]
        old_roi[:]=old_roi*(1-mix)+pixels*mix
        prev[:]=np.maximum(prev,alpha)
        painted_t+=1
    affected=int(np.count_nonzero(strength>.16))
    return np.clip(new,0,255).astype(np.uint8),{"faces_total":total_t,"faces_touched":painted_t,"pixels_projected":affected,
         "pct_atlas_modified":round(100*affected/(size*size),2),
         "max_alpha":round(float(strength.max()),3),
         "front_normal_sign_assumed":"positive_Z"}

def main():
    start=time.time()
    assert ASSET.exists() and REFERENCE.exists(),"Existing rig and approved original reference required"
    blob=ASSET.read_bytes()
    base,bin_chunk=glb_parts(blob)
    original_json=json.loads(json.dumps(base))
    prim=base["meshes"][0]["primitives"][0]
    verts=read_accessor(base,bin_chunk,prim["attributes"]["POSITION"]).astype(np.float32)
    norms=read_accessor(base,bin_chunk,prim["attributes"]["NORMAL"]).astype(np.float32)
    uvs=read_accessor(base,bin_chunk,prim["attributes"]["TEXCOORD_0"]).astype(np.float32)
    triangles=read_accessor(base,bin_chunk,prim["indices"]).ravel().reshape((-1,3)) if "indices" in prim else np.arange(len(verts)).reshape((-1,3))
    material=base["materials"][prim["material"]]
    image_index=base["textures"][material["pbrMetallicRoughness"]["baseColorTexture"]["index"]]["source"]
    encoded=image_bytes(base,bin_chunk,image_index)
    texture=Image.open(io.BytesIO(encoded)).convert("RGB")
    assert texture.size==(DETAIL,DETAIL),f"Expected original {DETAIL}px atlas, got {texture.size}"
    old=np.array(texture)
    photo=np.array(Image.open(REFERENCE).convert("RGB"))
    new,stats=rasterize_texture(verts,norms,uvs,triangles,old,photo)
    assert stats["pixels_projected"]>4000,("Projected too few pixels",stats)
    assert stats["pct_atlas_modified"]<22,("Projection is too broad; reject",stats)
    out=io.BytesIO()
    Image.fromarray(new).save(out,format="JPEG",quality=94,subsampling=0,optimize=True)
    raw=out.getvalue()
    changed=json.loads(json.dumps(base))
    data=bytearray(bin_chunk)
    while len(data)%4:data.append(0)
    view_index=len(changed["bufferViews"])
    changed["bufferViews"].append({"buffer":0,"byteOffset":len(data),"byteLength":len(raw)})
    data.extend(raw)
    img_idx=len(changed["images"])
    changed["images"].append({"mimeType":"image/jpeg","bufferView":view_index,
                               "name":"Original approved Marcus face and tattoo photo projection"})
    changed["textures"][material["pbrMetallicRoughness"]["baseColorTexture"]["index"]]["source"]=img_idx
    changed.setdefault("asset",{}).setdefault("extras",{}).update({
        "owner":"Created for and owned by Willie Moore III",
        "asset_code":"WM3-20261111-M3FLEX-004",
        "status":"UNAPPROVED_FACE_TATTOO_PROJECTION",
        "source":"Original approved photo in owner repository, not synthetic replacement"})
    output=pack(changed,bytes(data))
    chk,chk_bin=glb_parts(output)
    assert chk["skins"]==original_json["skins"],"Bones altered"
    assert chk.get("animations")==original_json.get("animations"),"Animation altered"
    assert chk["meshes"]==original_json["meshes"],"Geometry or skin weights altered"
    assert chk["accessors"]==original_json["accessors"],"Vertex channels altered"
    assert chk_bin[:len(bin_chunk)]==bin_chunk,"Binary mesh/animation modified"
    assert len(output)<12000000,"Android candidate oversized"
    DEST.write_bytes(output)
    REPORT.parent.mkdir(parents=True,exist_ok=True)
    info={**stats,"size_bytes":len(output),"sha256":hashlib.sha256(output).hexdigest(),
          "reference":str(REFERENCE),"rig":"original_24_joints","animations":len(chk.get("animations",[])),
          "identity_approval":False,"safety_gate":"unchanged",
          "status":"review_candidate_only","elapsed_sec":round(time.time()-start,1)}
    REPORT.write_text(json.dumps(info,indent=2))
    print("MARCUS_PHOTO_PROJECTION_OK",json.dumps(info),flush=True)
if __name__=="__main__":main()
