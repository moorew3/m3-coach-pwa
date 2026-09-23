# Entrance voice and walk-in correction

## Build
- Keep the existing identity-safe vertical walk-in clip and 900 ms smoke-only opening beat.
- Add a silent voice-preparation path so tapping anywhere during the entrance unlocks the approved coach audio without speaking early.
- Pass that preparation action from the app-entry overlay into the existing entrance.
- Keep the exact question triggered only when the walk video ends (with the existing safety timeout as fallback), then show YES/NO.
- Preserve YES → workout home/experience selection and the once-per-session gate; do not alter workouts, timers, tracking, navigation, or branding.

## Technical details
- Extend the current coach voice module with a gesture-safe silent unlock that primes the same audio elements and context used by the approved voice.
- Do not generate another person, replace the approved clip, or add paid services.

## Verification
- Test at 412×915: smoke-only opening, identity-safe walk, stopped foreground, exact spoken-line request, YES/NO, and YES landing on workout home without starting a workout.
- Confirm the intro does not repeat in the same session and report browser audio-policy limitations honestly.
- Do not publish.