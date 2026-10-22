# M3 FLEX — C16 Controlled Arm Reaches R1: Technical and Movement QA

**Audit date:** October 19, 2026  
**Status:** REJECTED — do not play in an active workout, use as a professional exercise demonstration, or record additional Marcus coaching for this clip.  
**Owner-approved 7 clips:** unchanged; no live app deployment.

## New render identity
- HeyGen generation ID: `5a9d47da598f47adbb63e024a81fcf17`.
- New raw source video: `https://resource2.heygen.ai/videos/2f2323079d3c414087f76bbfd67fb0f5/2f2323079d3c414087f76bbfd67fb0f5/01a1572f-71b2-7966-91e8-4b1995fe477d.mp4`.
- Video-generation approach used the exact approved photo plus already-approved C03 weighted front raises and C09 breathing as references; it did NOT use a strict pose-driving motion control tool.
- New clip specifications inspected with FFprobe: H.264, **480 × 832**, ~**5.26 sec** overall, 571,616 bytes, embedded AAC audio.
- Audio gate **FAIL**: generated AAC track has non-silent segments, although prompt called for silent footage. Overall audio mean -28.5 dB, peak 0 dB. Do not use this generated soundtrack; only original approved Marcus voice is permitted, after movement approval.
- Raw frames captured at 4 per second; five-second contact sheet at 1 FPS plus a ten-frame grid at 2 FPS.
- GitHub Actions [frame audit](https://github.com/moorew3/m3-coach-pwa/actions/runs/39361266752) succeeded technically; downloadable artifact ID `12236863589`.

## Visual findings
| Requirement | Observed | Result |
|---|---|---|
| Photorealistic seated trainer resembling approved Flex face, beard, cornrows, tattoos and black shorts | Broad visual resemblance in sampled frames. Exact identity isn't independently certifiable by this still-frame check | Needs owner confirmation |
| White cast on anatomical LEFT leg elevated onto beige upholstered support; black sneaker on RIGHT grounded | Appears so in sampled frames | PASS within sampled frames |
| Both hands **empty** and **open** | No dumbbells or bands visible, but hands are curled/partly clenched | FAIL |
| Two complete controlled straight-arm forward reaches to chest/shoulder height, then full return | Two forward *arm pumping* motions appear, but elbows remain substantially bent; not two proper straight-arm reaches | FAIL |
| No unwanted audio | Embedded non-silent AAC audio present | FAIL |
| No altered original approved video/audio | New raw generation and separate QA artifact only | PASS |

## Root cause and next production method

The image/video *reference* generation method appears to preserve identity and injured-leg positioning reasonably, but it **does not enforce the correct joint movement, hand openness, or silence**.

**STOP generating variations with the same loose reference prompting method.** A convincing gym scene is not an accurate exercise.

Next candidate (if authorized later) must use:
1. A **separately verified real motion-driving video** of seated, unloaded arm reaches, with two complete open-hand reaches and returns, in a locked full-body shot.
2. Exact owner-approved Flex photo as character reference (HeyGen asset `fbc0d826660d479080f2c2ac5fbf5939`).
3. A motion-transfer tool that preserves the source actor's actual pose and timing rather than merely using a clip as a loose visual suggestion. [Higgsfield Genjutsu](https://higgsfield.ai/genjutsu) advertises this mode; that is a vendor claim, not a guarantee of correct output.
4. Rights to source footage, a true tool-reported price quote, and explicit spending approval **before** each paid generation. Connected accounts previously reported no free Genjutsu motion-transfer attempts.
5. Offline QA of full-motion performance, avatar/cast continuity and unwanted soundtrack removal. Only then overlay the exact previously approved Marcus voice and obtain owner approval.
6. Do not rely on the rejected animated-cartoon C13 motion reference. It was explicitly disapproved.

**Current release status:** Workout A and Workout B final master MP4s remain incomplete. The latest draft branch previously passed its TypeScript build, and no approved source was overwritten. C11, C12, C13 and C16 are excluded from production.
