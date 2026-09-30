# M3 Coach: locked character → one reusable real-time 3D trainer

## Source and identity (no generic stand-in)
- Approved visual reference: `public/coach-source/coach-primary-standing.png`.
- The exact approved original coach must retain recognizable face, short fade, beard, skin tone,
  muscular body, right-pec portrait tattoo, and correct shorts/styling. The approved
  reference is NOT a photo of the athlete/user and must never be replaced by a stock
  character. A close match is not sufficient for release.
- A MetaPerson 3D photo reconstruction is only a candidate. First standard character
  export is free, but tattoos/face/body/clothing must be checked; customize or correct
  textures in free Blender if needed. Do not assume a one-photo reconstruction can
  preserve complex tattoos or exercise-correct anatomy.
- The exported model and every motion must meet the provider's actual licensing
  terms before redistribution in this app. Retain the source license and receipts.

## One-time model and action creation
1. Export ONE textured, rigged version of the approved coach as FBX/GLB.
2. Use the SAME approved custom coach in Mixamo. Save a skinned FBX in a
   reference/rest pose as `source-3d/coach-base-with-skin.fbx`.
3. Export every motion for THAT character/skeleton (not Mixamo's generic man),
   ideally WITHOUT skin, into `source-3d/motions/`. Name each by V2 motion key,
   for example `Idle.fbx`, `boxingStance.fbx`, `jab.fbx`,
   `jabCross.fbx`, `boxingCombination.fbx`, `frontKick.fbx`,
   `roundKick.fbx`, `inclinePress.fbx`, `lateralRaise.fbx`.
4. For custom boxing/kickboxing motion not available in the stock library,
   capture it from a qualified coach, clean it in Rokoko/Blender, then retarget
   it to the exact SAME skeleton. A single-camera video is a movement-reference
   source, not a guarantee of precise pivot or impact mechanics.
5. Run `scripts/assemble-coach-glb.py` under Blender 4.x with those sources.
   The script rejects wrong skeletons, missing Idle, missing animation actions,
   malformed GLB, unskinned meshes, and absent exported clips. Output:
   `public/v2/coach.glb` with one model and named reusable animations.
6. Test GLB load and frame rate on the actual Android phone and Windows
   desktop, check facial and tattoo identity from all four viewpoints, confirm
   no hip/root translation snaps, no joint inversions, proper guard and
   recovery, equipment placement, movement loops, and warm-up/rest blends.

## Promotion rule
`src/v2/rig-release.ts` defaults to blocking all real-time GLB playback.
Turn on `identityApproved`, `rigAndMobileApproved`, and the reviewed
`motionKey` allowlist only AFTER the actual user visually approves the
specific rig and movement. The app will then select its real 3D gym for those
approved keys. Every unapproved movement keeps the old identity-audited,
real-human video; there is NO procedural mannequin fallback.

## Billing guard
Keep the existing PWA and its Three.js/MediaPipe engine. MetaPerson's
standard first export and Mixamo's normal library are free as currently
advertised; avoid upgrades unless an exact missing feature requires them.
Rokoko offers a limited free video-to-motion allowance. Do not activate
another paid avatar, browser-run, cloud-GPU or animation subscription
without a specific need and the owner's approval.
