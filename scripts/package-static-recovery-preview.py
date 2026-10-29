#!/usr/bin/env python3
"""Make a true self-contained *web-page* static preview, no Node runtime.

This deliberately does NOT embed original avatar/Marcus media binaries. Those
remain on the verified external provider URLs; the full application, historical
workouts, user accounts and two-way trainer are NOT in the standalone archive.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZIP_DEFLATED, ZipFile

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT / "artifacts"
ZIP=DEST / "m3-flex-seated-recovery-static-preview.zip"
FILES={
  "recovery-coach/index.html":ROOT/"public/recovery-coach/index.html",
  "recovery-coach/scene-library.js":ROOT/"public/recovery-coach/scene-library.js",
  "recovery-coach/bench-core/index.html":ROOT/"public/recovery-coach/bench-core/index.html",
  "recovery-coach/logbook/index.html":ROOT/"public/recovery-coach/logbook/index.html",
  "recovery-coach/programs/index.html":ROOT/"public/recovery-coach/programs/index.html",
  "recovery-coach/device-check/index.html":ROOT/"public/recovery-coach/device-check/index.html",
  "recovery-coach/update-safety/index.html":ROOT/"public/recovery-coach/update-safety/index.html",
  "recovery-coach/form-check/index.html":ROOT/"public/recovery-coach/form-check/index.html",
  "recovery-coach/form-check/vendor/sha256-manifest.json":ROOT/"public/recovery-coach/form-check/vendor/sha256-manifest.json",
  "recovery-coach/form-check/vendor/THIRD_PARTY_NOTICE.txt":ROOT/"public/recovery-coach/form-check/vendor/THIRD_PARTY_NOTICE.txt",
}
HOME="""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0b1521">
<title>M3 FLEX | Seated Recovery Preview</title>
<style>body{margin:0;background:#0b1521;color:#edf5f9;font:16px/1.6 system-ui,sans-serif}
main{max-width:560px;margin:8vh auto;padding:26px}h1{font-size:32px;line-height:1.13}
a{display:block;background:#c5f08c;color:#102015;border-radius:12px;padding:16px;
font-weight:800;text-align:center;text-decoration:none;margin-top:19px}
p{color:#b4ccda}small{color:#eecba1}</style></head><body>
<main><strong>M3 FLEX</strong><h1>Seated Recovery Coach · Preview</h1>
<p>Approved moving Flex scenes, original Marcus voice, timed sets and rest,
and phone diagnostics. This is the recovery component only, not the complete
interactive AI trainer or final Workout A/B product.</p>
<a href="./recovery-coach/">Open approved seated Recovery Coach →</a>
<a href="./recovery-coach/bench-core/" style="background:#d0e8ff">Open Bench Core A &amp; B →</a>
<small>Clinician clearance required before exercising. External videos and
Marcus recordings require internet. No paid speech APIs.</small></main>
</body></html>"""
README="""M3 FLEX — STANDALONE SEATED RECOVERY PREVIEW

What is included
- /index.html — preview homepage
- /recovery-coach/index.html — approved recovery workout (7 locked video scenes)
- /recovery-coach/bench-core/index.html — separate timed bench-supported Core A and Core B (text only; clearance required)
- /recovery-coach/logbook/index.html — manually entered REAL reps, weight and measurements, private JSON export/import
- /recovery-coach/programs/index.html — Workout A/B owner-review only, NOT active
- /recovery-coach/device-check/index.html — Galaxy Fold diagnostics
- /recovery-coach/update-safety/index.html — Android update and encrypted records backup checklist
- /recovery-coach/form-check/index.html — optional on-device landmark/camera check
- /recovery-coach/form-check/vendor/* — first-party MediaPipe runtime + lite pose model
- sha256-manifest.json — exact file hashes for independently checking ZIP contents

What is not included
- Historical standing-coach or full React application
- Account login, clinically validated camera form coaching, on-device voice recognition
- Offline copies of owner-original Flex video or Marcus audio binaries
- Any newly approved/created exercise footage, public production deployment

This small static package needs NO Node.js or paid app runtime. Use a NEW
separate HTTPS review site/subdomain on a plan you already pay for.
Do NOT overwrite any current WordPress site or production domain.

Upload the CONTENTS of this ZIP into the separate review site's document root,
preserving /recovery-coach/ subfolders exactly. HTTPS is required for local
camera and microphone permission tests. Verify /, /recovery-coach/, /recovery-coach/bench-core/,
/recovery-coach/device-check/ and /recovery-coach/form-check/ before sharing a preview URL.

Android hands-free: use optional Voice Access to tap named buttons; it is
system accessibility control, NOT embedded real-time coaching. Voice Access
may use Google services depending on device and settings. A/B scenes are
not active until original approved footage has been reviewed.
"""
def run():
    vendor_dir=ROOT/"public/recovery-coach/form-check/vendor"
    if not vendor_dir.is_dir():
        raise RuntimeError("Run node scripts/stage-pose-runtime.mjs before static packaging")
    vendor_manifest=json.loads((vendor_dir/"sha256-manifest.json").read_text("utf-8"))
    if vendor_manifest.get("schema")!=1:
        raise RuntimeError("Invalid MediaPipe vendor manifest")
    for filename,expected in vendor_manifest["files"].items():
        path=vendor_dir/filename
        if not path.is_file() or path.stat().st_size!=expected["bytes"]:
            raise RuntimeError("MediaPipe local runtime file size mismatch: "+filename)
        if hashlib.sha256(path.read_bytes()).hexdigest()!=expected["sha256"]:
            raise RuntimeError("MediaPipe local runtime hash mismatch: "+filename)
    for f in sorted(vendor_dir.rglob("*")):
        if f.is_file():
            logical="recovery-coach/form-check/vendor/"+f.relative_to(vendor_dir).as_posix()
            FILES[logical]=f
    for logical,physical in FILES.items():
        if not physical.is_file() or not physical.stat().st_size:
            raise RuntimeError("Missing static Recovery Coach page: "+logical)
    if ZIP.exists():
        raise FileExistsError("Refusing to overwrite a previous preview archive")
    DEST.mkdir(parents=True,exist_ok=True)
    content={"index.html":HOME.encode(),"README.txt":README.encode()}
    for logical,physical in FILES.items():
        content[logical]=physical.read_bytes()
    manifest={"schema":1,"description":"Read-only approved Recovery Coach static review (no original media binaries)","files":{
      name:{"bytes":len(blob),"sha256":hashlib.sha256(blob).hexdigest()}
      for name,blob in sorted(content.items())
    }}
    content["sha256-manifest.json"]=(json.dumps(manifest,indent=2)+"\n").encode()
    with ZipFile(ZIP,"x",ZIP_DEFLATED,compresslevel=9) as archive:
        for path,blob in sorted(content.items()):
            archive.writestr(path,blob)
    with ZipFile(ZIP,"r") as archive:
        assert set(archive.namelist()) == set(content)
        assert archive.testzip() is None
        for path,blob in content.items():
            assert archive.read(path) == blob
    print("Verified static M3 FLEX seated recovery preview:",ZIP)
    print("ZIP contains 4 original HTML feature pages, a root landing page, hash manifest, and instructions.")
    print("No owner media binaries, credential files, chargeable voice services or dynamic Node app included.")
if __name__=="__main__":
    run()
