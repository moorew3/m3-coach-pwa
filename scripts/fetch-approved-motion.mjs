import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Preserve the already approved footage exactly; this changes hosting only.
// Builds must not depend exclusively on the currently-live V2 service because
// that creates a circular recovery failure if production is temporarily down.
const sources = JSON.parse(await readFile(new URL('./approved-motion-sources.json', import.meta.url), 'utf8'));
await mkdir('public/media/approved', { recursive: true });
let cursor = 0;
const audit = [];

const VIGGLE_VIDEO_ID = {
  "../recovered/bulgarianSplitSquat": "anim_f92bd259-9d71-42db-b1bc-21cc18cc3ba9",
  "../recovered/chestPress": "anim_6651c88c-06d3-4145-bda2-6681c88afad8",
};

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
  const viggleId = VIGGLE_VIDEO_ID[source.key];
  const viggleKey = process.env.VIGGLE_API_KEY;
  if (viggleId && viggleKey) {
    try {
      const meta = await fetch(`https://apis.viggle.ai/v1/videos/${encodeURIComponent(viggleId)}`, {
        headers: { Authorization: `Bearer ${viggleKey}` },
        signal: AbortSignal.timeout(60000),
      });
      if (!meta.ok) {
        failures.push(`Viggle ${viggleId} metadata -> HTTP ${meta.status}`);
      } else {
        const data = await meta.json();
        if (data?.status !== "ready" || !data?.video_url) {
          failures.push(`Viggle ${viggleId} -> not ready`);
        } else {
          const video = await fetch(data.video_url, { signal: AbortSignal.timeout(60000) });
          if (!video.ok) {
            failures.push(`Viggle ${viggleId} video -> HTTP ${video.status}`);
          } else {
            const bytes = Buffer.from(await video.arrayBuffer());
            const sha256 = verify(source, bytes);
            return { bytes, sha256, url: `viggle:${viggleId}` };
          }
        }
      }
    } catch (error) {
      failures.push(`Viggle ${viggleId} -> ${error instanceof Error ? error.message : String(error)}`);
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

    let fetched;
    try {
      fetched = await fetchApproved(source);
    } catch (error) {
      // These exact recovered exercise clips remain in the repository with
      // independent hashes. Never relabel them as identity-approved footage
      // when the separately audited source is unavailable.
      if (source.key === '../recovered/bulgarianSplitSquat' ||
          source.key === '../recovered/chestPress') {
        console.warn(`Approved source unavailable for ${source.key}; retaining the recovered demo without substituting unverified footage.`);
        audit.push({ key: source.key, status: 'source-unavailable', source: 'recovered-original-retained' });
        continue;
      }
      throw error;
    }
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
