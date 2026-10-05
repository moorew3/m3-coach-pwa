# V2 opening and media repair — 2026-10-05

The owner explicitly identified https://m3-coach-v2-visual-production.up.railway.app/v2 as the version to finish. Its existing Railway service follows rebuild/m3-coach-v2. Do not route this task back to the separate main-branch app.

No exercise footage is replaced by a stock demonstrator. All existing approved and recovered V2 avatar media is preserved. Previously localized clips are fetched from the existing V2 host with the deployed SHA-256 checksum enforced; original source URLs remain recorded. Existing Easy Walk, Trap-Bar Deadlift and Cable Punch footage is also localized, byte-for-byte, rather than relying on third-party playback or a per-play metadata request.

The opening greeting previously resolved when audio STARTED. The session then began work and could speak the first movement while the greeting was still audible. Opening now waits for actual audio end, keeps the entrance visible, and prevents repeated Start clicks. A workout Start/Resume gesture unlocks audio without adding another generic start announcement. New exercise/phase cues clear obsolete recorded/local speech. Pause stops speech as well as video.

All moving demonstrations use contain framing: no screen aspect ratio may crop out feet, hands or exercise equipment. Rest displays Rest / get ready instead of labeling a reset clip as the active exercise. Workout catalogue, seven-day recovery snapshot, sets, ordering and session reducer remain byte-for-byte unchanged.

Review: treadmill, shoulder mobility, band pull-apart, trap-bar footage, cable punch and chest press downloaded from their actual production sources and checked at multiple motion phases. Twelve recovered original clips inspected from local frame sequences. This is a playback/sequence repair, not new motion generation or a claim of biomechanics validation for every frame.

The 48 original movement keys still include one unavailable moving demonstration: Shoulder External Rotation. It is explicitly shown as pending. The original standing Dumbbell Shoulder Press was recovered, visually checked across its full press/return cycle, and restored after the owner explicitly reaffirmed the existing avatar footage. Existing static guides are not counted as moving footage. The historical External Rotation replacement is a pull-apart and must not be relabeled as rotation.

Validation: production build, TypeScript, preserved-workout gate, six boxing form checks, and a mocked AudioContext verification that the greeting waits for onended while ordinary cue playback retains start-time resolution. Live checks are recorded after deployment.
