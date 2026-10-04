import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const assets = [
  {
    url: "https://resource2.heygen.ai/text_to_speech/f9cf147f9f16428d960df47c12971b9f/0fadce1e82af494a93873aa38ea8d106/id=dbee98ea-0805-47f5-adc3-18333a8b8f71.wav",
    path: "public/media/marcus/intro.wav",
    minBytes: 1000,
  },
  {
    url: "https://resource2.heygen.ai/text_to_speech/f9cf147f9f16428d960df47c12971b9f/0fadce1e82af494a93873aa38ea8d106/id=6f4f3443-074c-492f-a81d-2f46557413e6.wav",
    path: "public/media/marcus/cues.wav",
    minBytes: 1000,
  },
];

for (const asset of assets) {
  const response = await fetch(asset.url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Marcus audio download failed: ${response.status} ${response.statusText}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < asset.minBytes) {
    throw new Error(`Marcus audio download was unexpectedly small: ${asset.path}`);
  }

  await mkdir(dirname(asset.path), { recursive: true });
  await writeFile(asset.path, bytes);
  console.log(`Saved ${asset.path} (${bytes.byteLength} bytes)`);
}
