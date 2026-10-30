# M3 FLEX — Full-screen TV / Samsung Smart View / Cast fit (October 29, 2026)

**Status:** Implemented and protected on a draft development branch; real TV hardware not yet acceptance-tested. This is a **mirror-friendly full-screen layout**, not an invented native Google Cast receiver.

## How the screen is designed

The existing seated Recovery Coach provides **TV / CAST · Full-screen workout**. This button:

- Enters an edge-to-edge, widescreen workout stage using the **same** active video and Marcus narration elements. It does not duplicate, restart, replace, download or switch owner-approved content.
- Gives the approved **portrait 9:16 full-body avatar** a large video area and uses the remaining 16:9 screen width for readable Marcus cues, exercise title, progress/rest countdown and status. Default CSS is `object-fit:contain`: the full Flex face, supported leg/cast, equipment, hands and movement framing are preserved. **No stretch and no unintended cropping.**
- Offers **Fit full body** (recommended) vs **Fill & crop** (optional; enlarged image crops video edges and could hide hands, cast or equipment). The rest of the screen remains useful regardless.
- Supports 1280×720, 1920×1080, 3840×2160 and small landscape layouts with viewport-relative font sizing and a television toolbar.
- Displays Start/Pause/Resume, Next, emergency STOP, fit mode, full-screen and Exit. TV controls are wired to existing timers/medical-clearance checks; manual skips never award fake athlete reps.
- Requests the browser Fullscreen API and an optional landscape orientation lock if supported; if permission is denied, theater layout stays available. A page cannot force Android or the television to change a screen-mirroring receiver aspect ratio.

## Cast from your Samsung Galaxy Fold

1. Open M3 FLEX Recovery Coach in Chrome or the existing installed web app. Check medical-clearance boxes on the phone before activating the TV layout.
2. Open the Galaxy Fold Quick Settings and select **Smart View**, if supported by the television, then choose the TV. On devices/TVs where Samsung offers it, set the phone's output aspect ratio to **Full screen on connected device**. Some TVs need Screen Fit / Just Scan or an overscan adjustment.
3. Rotate the Fold to **landscape**, tap **TV / CAST · Full-screen workout**, and confirm the original Marcus voice can be heard from the intended speaker system.
4. Use Start/Pause/Resume and Next on the TV-mode toolbar (or the existing voice-accessible/Bluetooth controls while the phone view is active). Use **STOP** immediately for pain or leg concerns.
5. If the browser refuses native fullscreen, use landscape + the TV theater layout; adjust TV receiver/phone aspect ratio in device settings as necessary.

For a compatible desktop Chrome + Chromecast/Google TV setup, choose Chrome's **Cast tab** or **Cast screen** option and present the same Recovery Coach TV view. This website does **not** launch a Cast session on its own; TV hardware support and manufacturer controls vary.

## Boundaries

- **A true full-body portrait video and a cropped edge-to-edge 16:9 video are mutually exclusive.** The default layout fills the *overall TV screen with workout content* while preserving the full portrait avatar, without promising a 9:16 source can become a distortion-free 16:9 frame.
- The live camera and private logbook panels close before TV mode to avoid accidentally displaying personal camera/measurements on a mirrored screen.
- This does not automatically play Marcus through a TV's speakers. Audio output depends on actual Smart View, HDMI or Chromecast routing and must be checked.
- These layout/tests do not certify a Samsung television's Smart View implementation, a Samsung Galaxy Fold's OS screen-mirroring pipeline, real Bluetooth audio routing, active native Cast receiver support, motion synchronization, or actual exercise form. Physical testing is a separate release gate.
- No change to the live site, subscriptions, original approved video URLs, Marcus voice, or hidden voice-recording permissions.
