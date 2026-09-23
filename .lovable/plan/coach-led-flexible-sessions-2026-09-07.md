# Coach-led flexible sessions

## Goal
Make Coach Mode ask how the user wants to train, keep Camera, Gestures, Voice, and workout choice visible at the top, and let programmed or user-defined activities run through the same coached experience without adding paid services.

## Implementation
1. **Session start and always-visible controls**
   - Add a short coach-led setup card immediately after the existing audio start step. The coach asks whether to use camera coaching, gestures, and today’s programmed workout.
   - Offer large tap choices and matching voice answers; every choice remains reversible in the compact top session strip.
   - Expand the current top strip to show Camera, Gestures, Voice, and **Change today’s workout**, with live status and one visible **Tracking details** control for calibration, skeleton, confidence, and metrics.

2. **Flexible activity model and chooser**
   - Add session-safe activity types for walk, treadmill walk, weighted-vest walk, cardio, boxing, custom exercise, and saved custom workout.
   - Store the selected session plan and activity details with the day log so resume, cloud sync, backup, history, glasses, and presentation recover the same session.
   - Support duration, distance, steps, calories, heart rate, notes, and activity-specific fields: vest load, incline/speed, or lifting sets/reps/load/rest.
   - Treat weighted-vest walking as a valid coached session, not an incomplete resistance workout.

3. **Custom workout builder**
   - Add a simple builder reachable from **Change today’s workout** and Program.
   - Users can add movements from the existing exercise library or enter a custom movement; edit sets, reps or time, rest, and load; reorder; save; edit; duplicate; delete; and start a reusable workout.
   - Custom movements use category-based coaching and clearly show when no matching approved coach demonstration exists rather than substituting the wrong visual.

4. **Adaptive coach script and tracking**
   - Generalize script generation to accept the selected session plan instead of always reading the scheduled day.
   - Add natural opening language for each activity and coach duration/pace/form fields that apply to the chosen activity.
   - Keep existing premium voice, leader-only speech, local camera processing, gestures, audio mixing, performance logging, and completion flow unchanged for programmed workouts.

5. **Avatar and wearable readiness**
   - Keep the approved coach identity unchanged and separate from a new user-avatar preference.
   - Allow choosing the default user image or uploading a small personal image stored with app data; no avatar generation service is added.
   - Add a provider-neutral wearable metric model with manual entry for steps, heart rate, calories, distance, and duration. Do not show a connect action until a real supported connector exists; label imported-provider fields internally for future standards-based integrations.

6. **Validation and report**
   - Test the full setup and workout-change flow at 412×915 after dismissing the audio gate; verify Camera, Gestures, Voice, and workout change are visible without scrolling and count the taps from opening Coach Mode.
   - Test programmed strength, weighted-vest walk, custom exercise, and saved custom workout through start, logging, resume, completion, backup, and synced state.
   - Verify follower displays mirror the selected session silently, camera/gesture processing remains local, and no recurring-cost dependency was introduced.

## Technical details
- Extend the existing JSON app snapshot and local offline state; the current storage format can carry additive fields without a new backend table.
- Store uploaded user-avatar images as size-limited local data initially to avoid binary cloud-sync and storage costs; retain the approved coach assets separately.
- Extend the shared coached-session state with a stable selected-plan reference/revision so phone, glasses, desktop, and presentation render the same activity.
- Use the current exercise library, category cue fallback, browser speech recognition, on-device MediaPipe, and existing cloud pairing infrastructure. No paid API, paid avatar generation, or cloud video processing will be added.