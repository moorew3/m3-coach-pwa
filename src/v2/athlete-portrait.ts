/**
 * Athlete portrait belongs to the USER, not the demonstration coach.
 *
 * A portrait is an identity asset only. It cannot replace skeletal/MP4
 * motion or claim to animate an exercise. An explicit local import allows
 * the original approved artwork to be used without uploading personal
 * imagery to an external service or inventing a different face.
 *
 * This is device-local until an owner-approved asset is staged in the repo.
 */
export const ATHLETE_PORTRAIT_KEY = "m3-coach-athlete-portrait-v1";
export const ATHLETE_RIG_URL = "/v2/athlete-approved.glb";
export const COACH_RIG_URL = "/v2/coach.glb";

const allowedDataUrl = /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=]+$/i;
const maxUploadBytes = 10 * 1024 * 1024;

export function readAthletePortrait(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(ATHLETE_PORTRAIT_KEY);
    return saved && allowedDataUrl.test(saved) ? saved : null;
  } catch {
    return null;
  }
}

/**
 * Resize without cropping, recoloring, restyling or facial changes.
 * Canvas output is a private local portrait; no camera frame is captured.
 */
export async function saveAthletePortrait(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose your approved PNG, JPEG or WebP avatar image.");
  if (file.size > maxUploadBytes)
    throw new Error("That image is too large. Select an image under 10 MB.");
  if (typeof window === "undefined")
    throw new Error("Your avatar can only be selected in the browser.");

  const source = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    const load = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not open this image."));
    });
    img.src = source;
    await load;
    const scale = Math.min(1, 960 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("The browser could not prepare your avatar.");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // Keep PNGs with transparent backgrounds intact. JPEG/WebP are downsized
    // without cropping and only for reliable local phone storage.
    const format = file.type === "image/png" ? "image/png" : "image/webp";
    const data = canvas.toDataURL(format, 0.82);
    if (!allowedDataUrl.test(data))
      throw new Error("The browser could not save your avatar.");
    try {
      window.localStorage.setItem(ATHLETE_PORTRAIT_KEY, data);
    } catch {
      throw new Error("Phone storage is full or blocked. Your original image is unchanged.");
    }
    return data;
  } finally {
    URL.revokeObjectURL(source);
  }
}
