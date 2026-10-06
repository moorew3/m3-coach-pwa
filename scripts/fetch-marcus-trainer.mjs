import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Existing owner-approved recordings only; never generate or substitute a voice.
const audit = JSON.parse(await readFile(new URL('./marcus-trainer-audit.json', import.meta.url), 'utf8'));
await mkdir('public/media/marcus-trainer', { recursive: true });
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
function sourceDuration(bytes) {
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE')
    throw new Error('Expected the approved source WAV');
  let byteRate = 0, dataSize = 0;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const key = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    if (offset + 8 + size > bytes.length) throw new Error('Truncated source WAV');
    if (key === 'fmt ' && size >= 16) byteRate = bytes.readUInt32LE(offset + 16);
    if (key === 'data') dataSize += size;
    offset += 8 + size + (size % 2);
  }
  if (!byteRate || !dataSize) throw new Error('Missing source WAV audio');
  return dataSize / byteRate;
}
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < audit.recordings.length) {
    const clip = audit.recordings[cursor++];
    const file = `public/media/marcus-trainer/${clip.key}.wav`;
    const existing = await readFile(file).catch(() => null);
    if (existing && hash(existing) === clip.sha256) continue;
    const response = await fetch(clip.audio_url, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Marcus recording ${clip.key}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    // The audit checksum identifies the locally encoded MP3. The exact
    // approved source URL returns WAV; preserve it without transcoding.
    const duration = sourceDuration(bytes);
    if (Math.abs(duration - clip.duration) > 0.25)
      throw new Error(`Marcus recording ${clip.key}: source duration mismatch`);
    await writeFile(file, bytes);
    console.log(`Restored approved Marcus recording: ${clip.key}`);
  }
}));
