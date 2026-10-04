#!/usr/bin/env python3
"""Assemble the identity-approved M3 Coach's Mixamo FBX actions into ONE GLB.

Run inside Blender 4.x, not system Python:
  blender -b --python scripts/assemble-coach-glb.py -- \
    --base source-3d/coach-base-with-skin.fbx \
    --motions source-3d/motions --output public/v2/coach.glb

The base FBX must be the approved customized coach exported from Mixamo
WITH skin. Each animation FBX must use that SAME Mixamo character/skeleton
and be named for its canonical V2 motion key (e.g., boxingCombination.fbx).
Do not import motions from another body or publish the output without
face/tattoo, joint deformation, equipment, and Android performance QA.
"""
from __future__ import annotations

import argparse
import json
import struct
import sys
from pathlib import Path

import bpy

ALLOWED_MOTIONS = {
    "Idle",
    "boxingStance",
    "jab",
    "cross",
    "jabCross",
    "defensiveReset",
    "guardReset",
    "boxingCombination",
    "frontKick",
    "roundKick",
    "kneeChamber",
    "inclinePress",
    "shoulderPress",
    "chestPress",
    "lateralRaise",
    "tricepsPressdown",
    "latPulldown",
    "seatedRow",
    "bentOverRow",
    "facePull",
    "dumbbellCurl",
    "backSquat",
    "reverseLunge",
    "legPress",
    "legExtension",
    "calfRaise",
    "hangingKneeRaise",
    "vSitCrunch",
    "sidePlank",
    "treadmillWalk",
}


def read_arguments() -> argparse.Namespace:
    user_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True, type=Path)
    parser.add_argument("--motions", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args(user_args)


def first_armature(objects: set[bpy.types.Object]) -> bpy.types.Object:
    armatures = [obj for obj in objects if obj.type == "ARMATURE"]
    if len(armatures) != 1:
        raise ValueError(
            f"Expected exactly one humanoid armature, got {len(armatures)}."
        )
    return armatures[0]


def import_fbx(file: Path) -> set[bpy.types.Object]:
    if not file.is_file():
        raise FileNotFoundError(file)
    existing = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=str(file.resolve()))
    return set(bpy.data.objects) - existing


def read_glb_animations(file: Path) -> tuple[int, int, list[str]]:
    with file.open("rb") as stream:
        header = stream.read(12)
        if len(header) != 12:
            raise ValueError("GLB output has an incomplete header.")
        magic, version, declared_length = struct.unpack("<4sII", header)
        if magic != b"glTF" or version != 2 or declared_length != file.stat().st_size:
            raise ValueError("GLB magic, version or declared length is incorrect.")
        chunk_length, chunk_type = struct.unpack("<I4s", stream.read(8))
        if chunk_type != b"JSON":
            raise ValueError("The first GLB chunk is not JSON.")
        gltf = json.loads(stream.read(chunk_length).decode("utf-8").rstrip(" \x00"))
    return (
        len(gltf.get("skins", [])),
        len(gltf.get("meshes", [])),
        [item.get("name", "") for item in gltf.get("animations", [])],
    )


def main() -> None:
    args = read_arguments()
    if not args.base.is_file() or not args.motions.is_dir():
        raise ValueError("Approved base FBX and motion directory must exist.")

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.outliner.orphans_purge(do_recursive=True)

    base_objects = import_fbx(args.base)
    coach = first_armature(base_objects)
    skinned = [
        obj for obj in base_objects
        if obj.type == "MESH"
        and any(mod.type == "ARMATURE" and mod.object == coach for mod in obj.modifiers)
    ]
    if not skinned:
        raise ValueError("The base character has no skinned humanoid mesh.")

    target_bones = {bone.name for bone in coach.data.bones}
    if len(target_bones) < 20:
        raise ValueError("Base armature is not a complete humanoid skeleton.")

    coach.animation_data_create()
    coach.animation_data.action = None
    for track in tuple(coach.animation_data.nla_tracks):
        coach.animation_data.nla_tracks.remove(track)

    files = sorted(args.motions.glob("*.fbx"))
    if not files:
        raise ValueError("No FBX motions were supplied.")
    unknown = [file.stem for file in files if file.stem not in ALLOWED_MOTIONS]
    if unknown:
        raise ValueError(f"Unrecognized motion filenames: {unknown}")
    if not any(file.stem == "Idle" for file in files):
        raise ValueError("An Idle.fbx clip is required for rests and paused sessions.")

    imported = []
    for file in files:
        source_objects = import_fbx(file)
        source = first_armature(source_objects)
        source_bones = {bone.name for bone in source.data.bones}
        if source_bones != target_bones:
            missing = sorted(target_bones - source_bones)[:8]
            extra = sorted(source_bones - target_bones)[:8]
            raise ValueError(
                f"{file.name}: motion must use the exact SAME approved rig. "
                f"Missing bones {missing}; extra bones {extra}."
            )
        action = source.animation_data.action if source.animation_data else None
        if action is None:
            raise ValueError(f"{file.name}: FBX has no recorded armature animation.")

        approved_action = action.copy()
        approved_action.name = file.stem
        approved_action.use_fake_user = True
        track = coach.animation_data.nla_tracks.new()
        track.name = file.stem
        strip = track.strips.new(
            file.stem, max(1, int(approved_action.frame_range[0])), approved_action
        )
        strip.name = file.stem
        strip.blend_type = "REPLACE"
        imported.append(file.stem)

        for obj in source_objects:
            bpy.data.objects.remove(obj, do_unlink=True)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    export_options = {
        "filepath": str(args.output.resolve()),
        "export_format": "GLB",
        "export_animations": True,
        "export_yup": True,
        "export_apply": False,
    }
    # Blender's glTF export options changed between minor versions.
    valid_props = {
        prop.identifier for prop in bpy.ops.export_scene.gltf.get_rna_type().properties
    }
    if "export_animation_mode" in valid_props:
        export_options["export_animation_mode"] = "NLA_TRACKS"
    elif "export_nla_strips" in valid_props:
        export_options["export_nla_strips"] = True
    if "export_force_sampling" in valid_props:
        export_options["export_force_sampling"] = True
    bpy.ops.export_scene.gltf(**export_options)

    skin_count, mesh_count, clips = read_glb_animations(args.output)
    missing = sorted(set(imported) - set(clips))
    if skin_count < 1 or mesh_count < 1 or missing:
        args.output.unlink(missing_ok=True)
        raise ValueError(
            f"Export rejected: skins={skin_count}, meshes={mesh_count}, "
            f"missing animation clips={missing}."
        )
    print(
        json.dumps({
            "output": str(args.output),
            "skins": skin_count,
            "meshes": mesh_count,
            "animations": clips,
            "bytes": args.output.stat().st_size,
            "note": "Structural export passed. Human identity/motion QA still required.",
        }, indent=2)
    )


if __name__ == "__main__":
    main()
