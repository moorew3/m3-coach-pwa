/** Bundle the existing approved Marcus recordings unchanged; never generate speech. */
import { readFile, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inventory = JSON.parse(await readFile(resolve(root, 'approved-marcus-runtime.json'), 'utf8'));
const source = 'https://m3-coach-v2-visual-production.up.railway.app';
if (inventory.schema !== 1 || inventory.source !== source || inventory.items.length !== 68) throw new Error('Unexpected Marcus recording inventory');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const pending = [...inventory.items];
let count = 0;
let total = 0;
async function worker() {
  while (pending.length) {
    const item = pending.shift();
    if (!/^\/media\/marcus(?:-trainer)?\/[A-Za-z0-9-]+\.(mp3|wav)$/.test(item.path) ||
        !/^[a-f0-9]{64}$/.test(item.sha256) || item.bytes < 128 || item.bytes > 5_000_000) throw new Error('Invalid approved audio entry');
    const target = resolve(root, 'public' + item.path);
    let bytes;
    try { bytes = await readFile(target); } catch { /* restored below */ }
    if (!bytes || bytes.length !== item.bytes || digest(bytes) !== item.sha256) {
      const response = await fetch(source + item.path, { redirect: 'error', signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw new Error(`Marcus recording unavailable: ${item.path} (${response.status})`);
      if (Number(response.headers.get('content-length') || item.bytes) > 5_000_000) throw new Error('Oversized audio response');
      bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length !== item.bytes || digest(bytes) !== item.sha256) throw new Error(`Approved audio checksum mismatch: ${item.path}`);
      await mkdir(dirname(target), { recursive: true });
      try { await writeFile(target + '.part', bytes); await rename(target + '.part', target); }
      finally { await rm(target + '.part', { force: true }); }
    }
    total += bytes.length;
    count++;
  }
}
await Promise.all(Array.from({length:6}, worker));
console.log(`Bundled ${count} unchanged approved Marcus recordings (${total} bytes); SHA-256 verified.`);
