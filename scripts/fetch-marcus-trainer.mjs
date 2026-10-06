import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Existing owner-approved recordings only; never generate or substitute a voice.
const audit = JSON.parse(await readFile(new URL('./marcus-trainer-audit.json', import.meta.url), 'utf8'));
await mkdir('public/media/marcus-trainer', { recursive: true });
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
function sourceDuration(bytes) {
  if ((bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) || bytes.toString('ascii', 0, 3) === 'ID3') {
    let offset = bytes.toString('ascii', 0, 3) === 'ID3'
      ? 10 + ((bytes[6] & 127) << 21) + ((bytes[7] & 127) << 14) + ((bytes[8] & 127) << 7) + (bytes[9] & 127)
      : 0;
    let seconds = 0, frames = 0;
    while (offset + 4 <= bytes.length && bytes[offset] === 0xff && (bytes[offset + 1] & 0xe0) === 0xe0) {
      const version = (bytes[offset + 1] >> 3) & 3;
      const layer = (bytes[offset + 1] >> 1) & 3;
      const bitrateIndex = bytes[offset + 2] >> 4;
      const sampleIndex = (bytes[offset + 2] >> 2) & 3;
      if (version === 1 || layer !== 1 || sampleIndex === 3 || bitrateIndex === 0 || bitrateIndex === 15)
        throw new Error('Invalid approved MP3 frame');
      const rates = version === 3 ? [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320] : [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160];
      const sampleRate = [44100,48000,32000][sampleIndex] / (version === 3 ? 1 : version === 2 ? 2 : 4);
      const size = Math.floor((version === 3 ? 144 : 72) * rates[bitrateIndex] * 1000 / sampleRate) + ((bytes[offset + 2] >> 1) & 1);
      if (offset + size > bytes.length) throw new Error('Truncated approved MP3');
      seconds += (version === 3 ? 1152 : 576) / sampleRate;
      frames++;
      offset += size;
    }
    if (frames < 10 || bytes.length - offset > 1024) throw new Error('Invalid approved MP3 data');
    return seconds;
  }
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
    const file = `public/media/marcus-trainer/${clip.key}.mp3`;
    const existing = await readFile(file).catch(() => null);
    if (existing && hash(existing) === clip.sha256) continue;
    const response = await fetch(clip.audio_url, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Marcus recording ${clip.key}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    // The audit identifies the local 64kbps copy. The approved source can
    // return a higher bitrate MP3 despite its .wav suffix. Validate its
    // actual audio frames and duration, then preserve the source bytes.
    const duration = sourceDuration(bytes);
    if (Math.abs(duration - clip.duration) > 0.25)
      throw new Error(`Marcus recording ${clip.key}: source duration mismatch`);
    await writeFile(file, bytes);
    console.log(`Restored approved Marcus recording: ${clip.key}`);
  }
}));
