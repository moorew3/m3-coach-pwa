import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Existing owner-approved recordings only; never generate or substitute a voice.
const audit = JSON.parse(await readFile(new URL('./marcus-trainer-audit.json', import.meta.url), 'utf8'));
await mkdir('public/media/marcus-trainer', { recursive: true });
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < audit.recordings.length) {
    const clip = audit.recordings[cursor++];
    const file = `public/media/marcus-trainer/${clip.key}.mp3`;
    const existing = await readFile(file).catch(() => null);
    if (existing && hash(existing) === clip.sha256) continue;
    const response = await fetch(clip.audio_url, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Marcus recording ${clip.key}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length !== clip.bytes || hash(bytes) !== clip.sha256)
      throw new Error(`Marcus recording ${clip.key}: source checksum mismatch`);
    await writeFile(file, bytes);
    console.log(`Restored approved Marcus recording: ${clip.key}`);
  }
}));
