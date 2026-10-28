# Recovery Coach playback repair — October 28, 2026

A delayed media play request could resume a timer after step navigation. Pausing or failing during initial loading could also reduce a full step to zero, and audio-only failures did not freeze the timer. Video buffering near a step's end could finish its timer before the old buffering timeout ran. Selecting a step card during rest retained the previous rest destination.

The player now invalidates pending media requests whenever playback is stopped, ignores obsolete asynchronous results, preserves the untouched duration before the timer starts, and freezes active work timers immediately on video or voice buffering/error. Step-card navigation follows the same reset path as stage navigation. Successful playback still completes one step and automatically advances.

All approved stage definitions—including exact video and Marcus voice URLs, exercise order and durations—are byte-identical to the base commit. No media was generated or replaced. No dependency was added. The test command is `npm run test:recovery`; it uses Node's built-in test runner and a synthetic DOM/media clock rather than a real clinical session.

Validation: nine regression tests pass. Seven of those tests fail against the unmodified base player; successful-start and normal-completion behavior also remain covered. Tests cover stale start/resume, early error, early pause, audio-only failure/retry, late video buffering, audio-only buffering, navigation from rest, and normal completion. JavaScript syntax and whitespace checks pass. These tests do not certify physical Android playback, clinical suitability, audio synchronization or biomechanics.
