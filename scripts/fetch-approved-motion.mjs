import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Preserve the already approved footage exactly; this changes hosting only.
// Builds must not depend exclusively on the currently-live V2 service because
// that creates a circular recovery failure if production is temporarily down.
const sources = JSON.parse(await readFile(new URL('./approved-motion-sources.json', import.meta.url), 'utf8'));
await mkdir('public/media/approved', { recursive: true });
let cursor = 0;
const audit = [];

function verify(source, bytes) {
  if (bytes.length < 1000 || !bytes.subarray(0, 48).includes(Buffer.from('ftyp'))) {
    throw new Error(`Approved motion ${source.key}: invalid MP4`);
  }
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (source.sha256 && source.sha256 !== sha256) {
    throw new Error(`Approved motion ${source.key}: source changed; preserve the approved footage`);
  }
  return sha256;
}

async function existingApproved(source, file) {
  try {
    const bytes = await readFile(file);
    const sha256 = verify(source, bytes);
    return { bytes, sha256 };
  } catch {
    return null;
  }
}

async function fetchApproved(source) {
  const candidates = [...new Set([source.url, source.originalUrl].filter(Boolean))];
  const failures = [];
  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) {
        failures.push(`${url} -> HTTP ${response.status}`);
        continue;
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      const sha256 = verify(source, bytes);
      return { bytes, sha256, url };
    } catch (error) {
      failures.push(`${url} -> ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`Approved motion ${source.key} unavailable from verified sources: ${failures.join(' | ')}`);
}

await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < sources.length) {
    const source = sources[cursor++];
    const file = `public/media/approved/${source.key}.mp4`;

    const existing = await existingApproved(source, file);
    if (existing) {
      audit.push({ key: source.key, bytes: existing.bytes.length, sha256: existing.sha256, source: 'repository' });
      console.log(`Preserved approved motion: ${source.key} (${existing.bytes.length} bytes)`);
      continue;
    }

    const fetched = await fetchApproved(source);
    await writeFile(file, fetched.bytes);
    audit.push({
      key: source.key,
      bytes: fetched.bytes.length,
      sha256: fetched.sha256,
      source: fetched.url,
    });
    console.log(`Localized approved motion: ${source.key} (${fetched.bytes.length} bytes)`);
  }
}));

await writeFile(
  'public/media/approved/audit.json',
  JSON.stringify(audit.sort((a, b) => a.key.localeCompare(b.key)), null, 2),
);
