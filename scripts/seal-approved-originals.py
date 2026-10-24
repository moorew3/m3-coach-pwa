#!/usr/bin/env python3
"""M3 FLEX owner-original archive encryption (PUBLIC key only).
Never print secret keys, record live media files in logs, or upload plaintext.
The output is a sealed backup suitable for transfer through public CI artifacts
to the owner's PRIVATE Google Drive storage.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import struct
import zipfile

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

MAGIC = b"M3FLEXB1"
SALT = b"M3-FLEX-ORIGINALS-V1"
INFO = b"approved-workout-video-marcus-backup"
CHUNK = 1024 * 1024


def key_from_shared_secret(shared_secret: bytes) -> bytes:
    return HKDF(algorithm=hashes.SHA256(), length=32, salt=SALT, info=INFO).derive(shared_secret)


def encrypt_file(source: pathlib.Path, encrypted: pathlib.Path, public_key_hex: str) -> dict:
    recipient = x25519.X25519PublicKey.from_public_bytes(bytes.fromhex(public_key_hex))
    ephemeral = x25519.X25519PrivateKey.generate()
    ephemeral_public = ephemeral.public_key().public_bytes(
        encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw
    )
    key = key_from_shared_secret(ephemeral.exchange(recipient))
    nonce = os.urandom(12)
    header = MAGIC + ephemeral_public + nonce
    engine = Cipher(algorithms.AES(key), modes.GCM(nonce)).encryptor()
    engine.authenticate_additional_data(header)
    digest = hashlib.sha256()
    with source.open("rb") as input_stream, encrypted.open("xb") as output_stream:
        output_stream.write(header)
        digest.update(header)
        while True:
            plain = input_stream.read(CHUNK)
            if not plain:
                break
            ciphertext = engine.update(plain)
            output_stream.write(ciphertext)
            digest.update(ciphertext)
        last = engine.finalize()
        if last:
            output_stream.write(last)
            digest.update(last)
        output_stream.write(engine.tag)
        digest.update(engine.tag)
    return {
        "format": "M3FLEXB1",
        "algorithm": "X25519-HKDF-SHA256 + AES-256-GCM",
        "bytes": encrypted.stat().st_size,
        "ciphertext_sha256": digest.hexdigest(),
        "private_key_never_uploaded": True,
    }


def decrypt_file(source: pathlib.Path, target: pathlib.Path, private_key_hex: str) -> None:
    """Owner-only helper: verify AES-GCM before considering originals restored."""
    key_bytes = bytes.fromhex(private_key_hex.strip())
    private = x25519.X25519PrivateKey.from_private_bytes(key_bytes)
    size = source.stat().st_size
    if size < len(MAGIC) + 32 + 12 + 16 + 1:
        raise ValueError("Encrypted backup is truncated")
    with source.open("rb") as input_stream:
        header = input_stream.read(52)
        if header[:8] != MAGIC:
            raise ValueError("Incorrect M3 FLEX encrypted backup format")
        ephemeral_public = x25519.X25519PublicKey.from_public_bytes(header[8:40])
        nonce = header[40:52]
        key = key_from_shared_secret(private.exchange(ephemeral_public))
        input_stream.seek(-16, os.SEEK_END)
        tag = input_stream.read(16)
        input_stream.seek(len(header))
        remaining = size - len(header) - len(tag)
        engine = Cipher(algorithms.AES(key), modes.GCM(nonce, tag)).decryptor()
        engine.authenticate_additional_data(header)
        temp = target.with_name(target.name + ".incomplete")
        try:
            with temp.open("xb") as output_stream:
                while remaining:
                    chunk = input_stream.read(min(CHUNK, remaining))
                    if not chunk:
                        raise ValueError("Unexpected end of encrypted backup")
                    remaining -= len(chunk)
                    output_stream.write(engine.update(chunk))
                output_stream.write(engine.finalize())  # Raises InvalidTag if wrong key.
            temp.replace(target)
        except Exception:
            temp.unlink(missing_ok=True)
            raise


def main() -> None:
    parser = argparse.ArgumentParser(description="Encrypt M3 Flex original media; never put the PRIVATE key into GitHub.")
    parser.add_argument("--input", type=pathlib.Path, help="Downloaded originals folder")
    parser.add_argument("--output", type=pathlib.Path, help="Encrypted archive filename")
    parser.add_argument("--recipient-public-key", help="Public X25519 key (safe to expose)")
    parser.add_argument("--decrypt", type=pathlib.Path, help="Owner's encrypted archive")
    parser.add_argument("--out-zip", type=pathlib.Path, help="Private restored ZIP file")
    parser.add_argument("--private-key-file", type=pathlib.Path, help="PRIVATE original decryption key")
    args = parser.parse_args()
    if args.decrypt:
        if not args.out_zip or not args.private_key_file:
            parser.error("--decrypt requires --out-zip and --private-key-file")
        decrypt_file(args.decrypt, args.out_zip, args.private_key_file.read_text("utf-8"))
        print("Restored authenticated ZIP. Verify all 16 originals and their SHA-256 receipt before use.")
        return
    if not args.input or not args.output or not args.recipient_public_key:
        parser.error("--input, --output and --recipient-public-key are required for encryption")
    report_path = args.input / "sha256-backup-report.json"
    report = json.loads(report_path.read_text("utf-8"))
    good = [entry for entry in report["entries"] if entry.get("status") == "backed_up"]
    if len(good) != 16 or any(entry.get("status") == "FAILED" for entry in report["entries"]):
        raise ValueError("Refusing to seal incomplete original-media backup")
    for item in good:
        name = item["file"]
        path = args.input / name
        if path.stat().st_size != item["bytes"]:
            raise ValueError("Media size differs from receipt: " + name)
        digest = hashlib.file_digest(path.open("rb"), "sha256").hexdigest()
        if digest != item["sha256"]:
            raise ValueError("Media hash differs from receipt: " + name)
    plain = args.output.with_suffix(".temporary-plaintext.zip")
    if plain.exists() or args.output.exists():
        raise FileExistsError("Backup output already exists")
    try:
        with zipfile.ZipFile(plain, "x", allowZip64=True, compression=zipfile.ZIP_STORED) as archive:
            archive.write(report_path, arcname="sha256-backup-report.json")
            for entry in good:
                archive.write(args.input / entry["file"], arcname="approved-originals/" + entry["file"])
        details = encrypt_file(plain, args.output, args.recipient_public_key)
        report_file = args.output.with_suffix(args.output.suffix + ".receipt.json")
        report_file.write_text(json.dumps(details, indent=2) + "\n", "utf-8")
        print("Sealed all 16 original media files with SHA-256 receipt. Private key never used by GitHub.")
        print("Encrypted archive SHA-256: " + details["ciphertext_sha256"])
    finally:
        plain.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
