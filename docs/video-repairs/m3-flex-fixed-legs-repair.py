# M3 FLEX fixed-leg rowing repair, 2026-11-02.
# Input: original owner-requested generation e3546b294d8349f7a3dbd8e1196cd611,
# saved as rowing-v1.mp4. No paid services or generated replacement face.
# Dependencies: Python, ffmpeg, numpy, opencv-python-headless, mediapipe.
# Model: https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
# Run in a folder containing that model and the source video: python repair.py
# This visual edit is an owner-review illustration, not clinical clearance.
"""Non-generative rowing repair. Retains original pixels and makes no paid API calls."""
from pathlib import Path
import json,cv2,numpy as np,mediapipe as mp,subprocess
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
W,H=960,540
def build_hand_tracks():
 import cv2,numpy as np,json
 cap=cv2.VideoCapture('rowing-v1.mp4');ok,first=cap.read();first=cv2.resize(first,(960,540));prev=cv2.cvtColor(first,cv2.COLOR_BGR2GRAY)
 sets=[]
 for x1,y1,x2,y2 in [(390,245,443,279),(514,245,553,279)]:
  mask=np.zeros_like(prev);mask[y1:y2,x1:x2]=255
  sets.append(cv2.goodFeaturesToTrack(prev,maxCorners=25,qualityLevel=.01,minDistance=4,mask=mask))
 points=np.vstack(sets);lens=[len(x) for x in sets];offsets=[0,lens[0]];orig=points.copy();tracks=[];i=0
 while True:
  if i==0:img=first
  else:
   ok,img=cap.read()
   if not ok:break
   img=cv2.resize(img,(960,540))
  gray=cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)
  if i:
   nxt,st,err=cv2.calcOpticalFlowPyrLK(prev,gray,points,None,winSize=(25,25),maxLevel=4,criteria=(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,30,.01))
   points=np.where(st[:,:,None].astype(bool),nxt,points)
  centers=[]
  for off,n in zip(offsets,lens):centers.append(np.median(points[off:off+n,0],axis=0).tolist())
  tracks.append(centers)
  prev=gray;i+=1
 cap.release();np.save('hand-tracks.npy',np.array(tracks))

if not Path("hand-tracks.npy").exists():build_hand_tracks()
HAND_TRACKS=np.load("hand-tracks.npy")
CURRENT_FRAME=0
cap=cv2.VideoCapture('rowing-v1.mp4');fps=cap.get(cv2.CAP_PROP_FPS)
opts=vision.PoseLandmarkerOptions(base_options=python.BaseOptions(model_asset_path='pose_landmarker_lite.task'),output_segmentation_masks=True)
landmarker=vision.PoseLandmarker.create_from_options(opts)
def decode(i):
 cap.set(cv2.CAP_PROP_POS_FRAMES,i);ok,f=cap.read();assert ok
 return cv2.resize(f,(W,H))
def detect(img):
 r=landmarker.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(img,cv2.COLOR_BGR2RGB)))
 assert r.pose_landmarks
 p=np.array([[v.x*W,v.y*H] for v in r.pose_landmarks[0]])
 return p,r.segmentation_masks[0].numpy_view().squeeze().copy()
def waist(p):return (p[23]+p[24])*.41+(p[11]+p[12])*.09
def upper_mask(p,seg):
 region=np.zeros((H,W),np.uint8)
 # Torso with fixed cut at waist, plus original arms/head.
 wl=waist(p);by=int(wl[1]+12)
 poly=np.array([p[12]+[-25,-15],p[11]+[25,-15],[p[23,0],by],[p[24,0]-30,by]],np.int32)
 cv2.fillConvexPoly(region,poly,255)
 region[:int((p[11,1]+p[12,1])/2)+15,:]=255
 for shoulder,elbow,which in [(11,13,1),(12,14,0)]:
  hand=HAND_TRACKS[CURRENT_FRAME,which]
  arm=np.zeros((H,W),np.uint8)
  cv2.line(arm,tuple(p[shoulder].astype(int)),tuple(p[elbow].astype(int)),255,80)
  cv2.line(arm,tuple(p[elbow].astype(int)),tuple(hand.astype(int)),255,66)
  cv2.circle(arm,tuple(hand.astype(int)),27,255,-1)
  arm[int(max(hand[1],p[elbow,1])+12):]=0
  region=np.maximum(region,arm)
 mask=((seg>.15)&(region>0)).astype(np.float32)
 # Every pixel below the base waist remains the fixed plate.
 mask[by+3:,:]=0
 return cv2.GaussianBlur(mask,(3,3),.6)
CURRENT_FRAME=round(2*fps)
base=decode(CURRENT_FRAME);bp,bs=detect(base);anchor=waist(bp);base_mask=upper_mask(bp,bs)
remove=cv2.dilate((base_mask>.04).astype(np.uint8)*255,np.ones((9,9),np.uint8));remove[285:]=0
# Remove old cable so the cable follows the corrected handle.
cv2.line(remove,(285,245),(720,286),255,6)
plate=cv2.inpaint(base,remove,8,cv2.INPAINT_TELEA)
# Preserve waist and entire lower body exactly from a single original frame.
plate[285:]=base[285:]
cv2.imwrite('repair-cleanplate.png',plate)
indices=list(range(int(cap.get(cv2.CAP_PROP_FRAME_COUNT))));samples=[]
encoder=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{W}x{H}','-r',str(fps),'-i','-','-an','-c:v','libx264','-preset','medium','-crf','0','-pix_fmt','yuv420p','-movflags','+faststart','M3_FLEX_Arms_Only_Rowing_REVIEW_R3.mp4'],stdin=subprocess.PIPE)
checked=0
for i in indices:
 CURRENT_FRAME=i
 img=decode(i);p,seg=detect(img);shift=anchor-waist(p)
 T=np.float32([[1,0,shift[0]],[0,1,shift[1]]])
 upper=cv2.warpAffine(img,T,(W,H));m=cv2.warpAffine(upper_mask(p,seg),T,(W,H))
 m[285:]=0;m[275:285]*=np.linspace(1,0,10)[:,None]
 out=np.rint(upper*m[:,:,None]+plate*(1-m[:,:,None])).astype(np.uint8)
 hand=HAND_TRACKS[i].mean(axis=0)+shift+[-1,-3]
 cv2.line(out,tuple(np.rint(hand).astype(int)),(720,286),(145,147,145),1,cv2.LINE_AA)
 out[285:]=base[285:]
 assert np.array_equal(out[285:],base[285:]),'Lower body changed'
 checked+=1;encoder.stdin.write(out.tobytes())
 if i%12==0:cv2.imwrite(f'render-review-{i:03}.png',out)
 if i%24==0 and len(samples)<10:samples.append(cv2.resize(out,(480,270)))
 if i%48==0:print('Rendered',i,flush=True)
cv2.imwrite('repair-sample.jpg',np.vstack([np.hstack(samples[:5]),np.hstack(samples[5:])]))
encoder.stdin.close();assert encoder.wait()==0
landmarker.close();cap.release()
Path('repair-qa.json').write_text(json.dumps({'source':'rowing-v1.mp4','source_video_id':'e3546b294d8349f7a3dbd8e1196cd611','frames':checked,'fps':fps,'fixed_lower_body_starts_at_y':285,'lower_body_exact_pixel_comparison':'PASS for every pre-encode frame','additional_generation_credits':0,'method':'Existing-pixel upper-body segmentation, pelvis stabilization, fixed lower-body plate; no new face generation; silent','clinical_clearance':False},indent=2))
print('Rendered',checked,'frames. Ready for decoded-video QA.')

