import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Preserve the already approved footage exactly; this changes hosting only.
const sources = JSON.parse(await readFile(new URL('./approved-motion-sources.json', import.meta.url), 'utf8'));
await mkdir('public/media/approved', { recursive: true });
let cursor = 0;
const audit = [];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < sources.length) {
    const source = sources[cursor++];
    const file = `public/media/approved/${source.key}.mp4`;
    const response = await fetch(source.url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Approved motion ${source.key}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 1000 || !bytes.subarray(0, 48).includes(Buffer.from('ftyp'))) {
      throw new Error(`Approved motion ${source.key}: invalid MP4`);
    }
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (source.sha256 && source.sha256 !== sha256) {
      throw new Error(`Approved motion ${source.key}: source changed; preserve the approved footage`);
    }
    await writeFile(file, bytes);
    audit.push({ key: source.key, bytes: bytes.length, sha256 });
    console.log(`Localized approved motion: ${source.key} (${bytes.length} bytes)`);
  }
}));
await writeFile('public/media/approved/audit.json', JSON.stringify(audit.sort((a,b) => a.key.localeCompare(b.key)), null, 2));
