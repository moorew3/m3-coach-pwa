#!/usr/bin/env python3
"""Build an M3 boxing-flow video from COMPLETE approved human-coach clips.

The previous video cut jabs/crosses to ~1.1s and used 80ms hard-looking
transitions. That can delete the hand retraction and snap back to guard.
This builder keeps EACH original movement and full guard return at native
tempo, normalizes display cadence and overlaps only the transitions.

Run in CI (Ubuntu with ffmpeg/ffprobe). NEVER replace approved clips with
stock footage or reverse a punch to fake recovery.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

SRC = Path(".tmp/boxing-flow-source")
NORM = Path(".tmp/boxing-flow-normalized")
OUT = Path("public/media/boxingFlow3.mp4")
FADE = 0.22
MOVES = [
    ("boxingStance", "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/ba2daa61-d337-44ea-9fe0-12f6698cc43f/boxingStanceV2.mp4"),
    ("jab", "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/fea6c3ab-2ad2-4c0a-8380-432cc8496e49/jabV2.mp4"),
    ("cross", "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/767f7369-4a91-4f1e-bbe3-ad429dc80d15/crossV2.mp4"),
    ("jabCross", "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/4a42a4f8-dc38-44ee-93fa-b62815263ebd/jabCrossV2.mp4"),
    ("defensiveReset", "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/39d355b3-eb12-4628-98d6-107ebbd966c4/defensiveResetV2.mp4"),
    ("jabCrossRepeat", "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/4a42a4f8-dc38-44ee-93fa-b62815263ebd/jabCrossV2.mp4"),
    ("guardReset", "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/de47b48c-3ce6-4ebc-9ee8-56ac2acb0161/guardResetV2.mp4"),
]


def run(*cmd: str) -> str:
    p = subprocess.run(cmd, check=True, text=True, stdout=subprocess.PIPE,
                       stderr=subprocess.PIPE)
    return p.stdout


def probe(file: Path) -> dict:
    return json.loads(run("ffprobe", "-v", "error", "-show_entries",
                          "stream=width,height,avg_frame_rate:format=duration,size",
                          "-of", "json", str(file)))


def main() -> None:
    SRC.mkdir(parents=True, exist_ok=True)
    NORM.mkdir(parents=True, exist_ok=True)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    clips: list[Path] = []
    lengths: list[float] = []
    reports: list[dict] = []

    for i, (name, url) in enumerate(MOVES):
        raw = SRC / f"{name}.mp4"
        if not raw.exists():
            subprocess.run(["curl", "-fL", "--retry", "3", "--connect-timeout",
                            "12", "--max-time", "90", url, "-o", str(raw)], check=True)
        info = probe(raw)
        duration = float(info["format"]["duration"])
        if duration < 1.4 or duration > 25:
            raise ValueError(f"{name}: invalid or suspicious source duration {duration:.2f}s")

        normalized = NORM / f"{i:02d}-{name}.mp4"
        # No -ss, -t or setpts speed-up here: preserve the complete original
        # punch, extension, retraction, reset and kick recovery if present.
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(raw), "-an",
            "-vf", "fps=30,scale=960:540:force_original_aspect_ratio=decrease,"
                   "pad=960:540:(ow-iw)/2:(oh-ih)/2:black,setsar=1,"
                   "format=yuv420p,setpts=PTS-STARTPTS",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
            "-movflags", "+faststart", str(normalized))
        normalized_info = probe(normalized)
        length = float(normalized_info["format"]["duration"])
        clips.append(normalized)
        lengths.append(length)
        reports.append({"motion": name, "originalSeconds": duration,
                        "preservedSeconds": length})

    # Dynamic offsets from the ACTUAL normalized durations remove the timestamp
    # errors and hard gaps of the old hand-coded 0.08s xfade graph.
    filters = []
    previous = "[0:v]"
    elapsed = lengths[0]
    for i in range(1, len(clips)):
        output = f"[v{i}]"
        offset = elapsed - FADE
        filters.append(
            f"{previous}[{i}:v]xfade=transition=fade:duration={FADE:.3f}:"
            f"offset={offset:.3f}{output}"
        )
        previous = output
        elapsed += lengths[i] - FADE
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    for clip in clips:
        cmd += ["-i", str(clip)]
    cmd += ["-filter_complex", ";".join(filters), "-map", previous, "-an",
            "-c:v", "libx264", "-preset", "medium", "-crf", "21",
            "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart",
            str(OUT)]
    run(*cmd)
    output_info = probe(OUT)
    total = float(output_info["format"]["duration"])
    width = int(output_info["streams"][0]["width"])
    height = int(output_info["streams"][0]["height"])
    if not (6 < total < 120 and width == 960 and height == 540):
        OUT.unlink(missing_ok=True)
        raise ValueError("Output dimensions or duration are invalid.")
    if OUT.stat().st_size > 15_000_000:
        OUT.unlink(missing_ok=True)
        raise ValueError("Video too large for mobile preview.")
    print(json.dumps({
        "output": str(OUT),
        "durationSeconds": total,
        "bytes": OUT.stat().st_size,
        "seamSeconds": FADE,
        "fullRecoverySource": reports,
        "note": "Full source cycles and transitions verified by duration; "
                "biomechanical and actual visual smoothness require review.",
    }, indent=2))


    # The original Cardio+Core session uses 60s rounds, NOT the dedicated
    # 40/20 boxing rounds. Add full, already-normalized guard-to-guard cycles
    # so there is NO hidden 40.7s video restart in a 60s work interval.
    long_clips = clips + [clips[1], clips[2], clips[3], clips[6]]
    long_lengths = lengths + [lengths[1], lengths[2], lengths[3], lengths[6]]
    long_filters: list[str] = []
    long_previous = "[0:v]"
    long_elapsed = long_lengths[0]
    for i in range(1, len(long_clips)):
        node = f"[v{i}]"
        long_filters.append(
            f"{long_previous}[{i}:v]xfade=transition=fade:duration={FADE:.3f}:"
            f"offset={long_elapsed - FADE:.3f}{node}"
        )
        long_previous = node
        long_elapsed += long_lengths[i] - FADE
    long_output = Path("public/media/boxingFlow60.mp4")
    long_cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    for clip in long_clips:
        long_cmd += ["-i", str(clip)]
    long_cmd += ["-filter_complex", ";".join(long_filters), "-map", long_previous,
                 "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "21",
                 "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart",
                 str(long_output)]
    run(*long_cmd)
    long_info = probe(long_output)
    long_duration = float(long_info["format"]["duration"])
    if not (60 <= long_duration <= 68 and long_output.stat().st_size < 15_000_000):
        long_output.unlink(missing_ok=True)
        raise ValueError("60-second cardio boxing footage would restart during the round.")
    print(json.dumps({
        "output": str(long_output),
        "durationSeconds": long_duration,
        "bytes": long_output.stat().st_size,
        "note": "Complete original strike-and-return cycles preserved; no loop before 60-second bell.",
    }, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, subprocess.CalledProcessError) as exc:
        print(f"Boxing flow build FAILED: {exc}", file=sys.stderr)
        sys.exit(1)
