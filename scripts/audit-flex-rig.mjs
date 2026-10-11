#!/usr/bin/env node
/**
 * Structural audit for the identity-matched LIVE FLEX full-body GLB.
 * Passing is necessary but NOT sufficient for release: human review of identity,
 * biomechanics, audio sync, and phone/TV performance is still required.
 *
 * Usage: node scripts/audit-flex-rig.mjs [public/v2/coach.glb]
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(process.argv[2] ?? "public/v2/coach.glb");
const required = ["Idle", "cablePunch", "jabCross"];
const problems = [];
const fail = (reason) => problems.push(reason);

function readGLB(file) {
  const data = readFileSync(file);
  if (data.length < 20 || data.readUInt32LE(0) !== 0x46546c67 || data.readUInt32LE(4) !== 2) {
    throw new Error("Not a binary glTF 2.0 file.");
  }
  if (data.readUInt32LE(8) !== data.length) throw new Error("GLB header length mismatch.");
  let gltf, binary;
  for (let offset = 12; offset < data.length;) {
    const size = data.readUInt32LE(offset);
    const kind = data.readUInt32LE(offset + 4);
    const begin = offset + 8;
    if (begin + size > data.length) throw new Error("Invalid GLB chunk size.");
    if (kind === 0x4e4f534a) gltf = JSON.parse(data.subarray(begin, begin + size).toString("utf8").trim());
    if (kind === 0x004e4942) binary = data.subarray(begin, begin + size);
    offset = begin + size;
  }
  if (!gltf) throw new Error("Missing glTF JSON chunk.");
  return { gltf, binary };
}

function outputChanges(gltf, binary, accessorId) {
  const accessor = gltf.accessors?.[accessorId];
  const view = gltf.bufferViews?.[accessor?.bufferView];
  if (!accessor || !view || !binary || view.buffer !== 0 || accessor.sparse) return false;
  const width = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[accessor.type];
  const unit = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }[accessor.componentType];
  if (!width || !unit || accessor.count < 2) return false;
  const stride = view.byteStride ?? width * unit;
  const base = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const sample = (index) => {
    const values = [];
    for (let j = 0; j < width; j++) {
      const at = base + index * stride + j * unit;
      if (at + unit > binary.length) return null;
      const dv = new DataView(binary.buffer, binary.byteOffset + at, unit);
      const read = {
        5120: () => dv.getInt8(0), 5121: () => dv.getUint8(0),
        5122: () => dv.getInt16(0, true), 5123: () => dv.getUint16(0, true),
        5125: () => dv.getUint32(0, true), 5126: () => dv.getFloat32(0, true),
      }[accessor.componentType];
      values.push(read());
    }
    return values;
  };
  const first = sample(0);
  if (!first) return false;
  const max = accessor.count - 1;
  const indices = new Set([1, Math.floor(max / 4), Math.floor(max / 2), Math.floor(3 * max / 4), max]);
  return [...indices].some(index => sample(index)?.some((v, j) => Math.abs(v - first[j]) > 0.0001));
}

function inspectAnimation(gltf, binary, clip) {
  const joints = new Set((gltf.skins ?? []).flatMap(skin => skin.joints ?? []));
  const animated = new Set();
  let changingTracks = 0, keyframes = 0;
  for (const channel of clip.channels ?? []) {
    const target = channel.target, sampler = clip.samplers?.[channel.sampler];
    if (!sampler || target?.node === undefined || !["rotation", "translation", "scale"].includes(target.path)) continue;
    const count = gltf.accessors?.[sampler.input]?.count ?? 0;
    keyframes = Math.max(keyframes, count);
    if (joints.has(target.node) && count > 1 && outputChanges(gltf, binary, sampler.output)) {
      animated.add(target.node);
      changingTracks++;
    }
  }
  return { channels: clip.channels?.length ?? 0, keyframes, animatedJoints: animated.size, changingTracks };
}

if (!existsSync(file)) {
  console.error("FLEX RIG NOT READY: No GLB at " + file);
  console.error("Keep the verified recorded workout videos and 3D release gate disabled.");
  process.exitCode = 1;
} else {
  try {
    const { gltf, binary } = readGLB(file);
    if (!(gltf.meshes?.length > 0)) fail("GLB has no mesh.");
    if (!(gltf.skins?.length > 0)) fail("GLB has no skinned skeleton.");
    const maxJoints = Math.max(0, ...(gltf.skins ?? []).map(skin => skin.joints?.length ?? 0));
    if (maxJoints < 12) fail("Fewer than 12 skeleton joints cannot reliably drive full-body motion.");
    const available = new Map((gltf.animations ?? []).map(a => [a.name, a]));
    const clips = Object.fromEntries(required.map(name => {
      const clip = available.get(name);
      if (!clip) {
        fail("Missing exact animation: " + name);
        return [name, { present: false }];
      }
      const details = inspectAnimation(gltf, binary, clip);
      if (name !== "Idle" && (details.animatedJoints < 2 || details.changingTracks < 2)) {
        fail(name + " appears frozen or does not animate skeletal joints.");
      }
      return [name, { present: true, ...details }];
    }));
    console.log(JSON.stringify({
      asset: file,
      meshCount: gltf.meshes?.length ?? 0,
      skinCount: gltf.skins?.length ?? 0,
      maxJoints,
      namedAnimations: (gltf.animations ?? []).map(a => a.name ?? "(unnamed)"),
      requiredClips: clips,
      structuralStatus: problems.length ? "FAIL" : "PASS",
      limitations: "Visual likeness, natural motion, equipment, Marcus timing, and device performance still require human approval.",
      problems,
    }, null, 2));
    if (problems.length) process.exitCode = 1;
  } catch (error) {
    console.error("FLEX RIG AUDIT FAILED: " + error.message);
    process.exitCode = 1;
  }
}