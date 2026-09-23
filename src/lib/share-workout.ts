/**
 * SHAREABLE WORKOUT SUMMARIES
 * ------------------------------------------------------------------
 * Turns a saved day into plain text, a dark summary card (PNG) or a
 * one-page PDF. Everything is generated on-device with canvas — no
 * uploads, no accounts and no branding of any kind on the output.
 */

import { orderedExercises, planForDay } from "@/data/program";
import { getDay, type AppState } from "@/lib/store";

export interface ShareOptions {
  /** Include weights / loads next to each set. */
  weights: boolean;
  /** Include your written workout notes. */
  notes: boolean;
  /** Include pain flags and form feedback. */
  pain: boolean;
}

export const DEFAULT_SHARE_OPTIONS: ShareOptions = { weights: true, notes: false, pain: false };

export interface ShareRow {
  name: string;
  detail: string;
  flag?: string;
}

export interface ShareData {
  title: string;
  subtitle: string;
  stats: { k: string; v: string }[];
  rows: ShareRow[];
  notes: string;
  fileBase: string;
}

const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

/** Build the shareable view of one day from saved state. */
export function buildShareData(state: AppState, day: number, opts: ShareOptions): ShareData {
  const plan = planForDay(day);
  const log = getDay(state, day);
  const unit = state.settings.units;
  const list = orderedExercises(day, false);

  let doneSets = 0;
  let volume = 0;
  const rows: ShareRow[] = [];

  for (const e of list) {
    const entry = log.exercises[e.id];
    if (!entry) continue;
    const name = entry.replacedWith || e.name;
    if (entry.skipped) {
      rows.push({ name, detail: "Skipped" });
      continue;
    }
    const done = entry.sets.filter((s) => s.done);
    if (done.length === 0) continue;
    doneSets += done.length;
    volume += done.reduce((v, s) => v + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0);

    const detail = done
      .map((s) => {
        const reps = s.reps || s.time || "—";
        if (!opts.weights) return `${reps}`;
        const load = s.weight ? `${s.weight}${/^[\d.]+$/.test(s.weight) ? ` ${unit}` : ""}` : "BW";
        return `${reps} × ${load}`;
      })
      .join(",  ");

    const flags: string[] = [];
    if (opts.pain && (entry.pain ?? 0) > 0) flags.push(`pain ${entry.pain}/10`);
    if (opts.pain && entry.formClean === false) flags.push("form broke down");
    rows.push({ name, detail, flag: flags.join(" · ") || undefined });
  }

  const stats = [
    { k: "Time", v: mmss((log.elapsedMs ?? 0) / 1000) },
    { k: "Sets", v: String(doneSets) },
    { k: "Exercises", v: String(rows.filter((r) => r.detail !== "Skipped").length) },
    { k: "Volume", v: volume > 0 ? `${Math.round(volume)} ${unit}` : "—" },
  ];

  return {
    title: `Day ${day} · ${plan.title}`,
    subtitle: `${plan.weekday} · ${plan.focus}`,
    stats,
    rows,
    notes: opts.notes ? (log.notes ?? "").trim() : "",
    fileBase: `day-${day}-${plan.key}-workout`,
  };
}

/* ------------------------------- plain text ----------------------------- */

/** Short social-style caption. */
export function socialText(d: ShareData): string {
  const s = d.stats.map((x) => `${x.k} ${x.v}`).join(" · ");
  return [
    d.title,
    s,
    "",
    ...d.rows.map((r) => `• ${r.name}: ${r.detail}`),
    d.notes && `\n${d.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Full training-log style text. */
export function logText(d: ShareData): string {
  const lines = [d.title, d.subtitle, "".padEnd(38, "-")];
  for (const s of d.stats) lines.push(`${s.k.padEnd(10)} ${s.v}`);
  lines.push("".padEnd(38, "-"));
  for (const r of d.rows) {
    lines.push(r.name);
    lines.push(`   ${r.detail}${r.flag ? `  (${r.flag})` : ""}`);
  }
  if (d.notes) lines.push("".padEnd(38, "-"), d.notes);
  return lines.join("\n");
}

/* --------------------------------- image -------------------------------- */

const BG = "#15171b";
const CARD = "#1d2026";
const TEXT = "#f5f5f4";
const MUTED = "#a1a1aa";
const GOLD = "#d9b166";
const CYAN = "#5fd3d3";

/** Render the summary as a dark share card. Returns the canvas. */
export function renderCard(d: ShareData): HTMLCanvasElement {
  const W = 1080;
  const pad = 64;
  const rowH = 92;
  const H = 600 + d.rows.length * rowH + (d.notes ? d.notes.length * 2 : 0);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d");
  if (!c) return canvas;

  c.fillStyle = BG;
  c.fillRect(0, 0, W, H);

  c.fillStyle = GOLD;
  c.fillRect(0, 0, W, 10);

  c.textBaseline = "top";
  c.fillStyle = TEXT;
  c.font = "bold 56px system-ui, sans-serif";
  c.fillText(d.title, pad, 70, W - pad * 2);
  c.fillStyle = MUTED;
  c.font = "32px system-ui, sans-serif";
  c.fillText(d.subtitle, pad, 146, W - pad * 2);

  // stat tiles
  const tileW = (W - pad * 2 - 24 * 3) / 4;
  d.stats.forEach((s, i) => {
    const x = pad + i * (tileW + 24);
    c.fillStyle = CARD;
    c.beginPath();
    c.roundRect(x, 210, tileW, 130, 20);
    c.fill();
    c.fillStyle = MUTED;
    c.font = "bold 22px system-ui, sans-serif";
    c.fillText(s.k.toUpperCase(), x + 20, 234);
    c.fillStyle = CYAN;
    c.font = "bold 40px system-ui, sans-serif";
    c.fillText(s.v, x + 20, 272, tileW - 40);
  });

  let y = 388;
  for (const r of d.rows) {
    c.fillStyle = CARD;
    c.beginPath();
    c.roundRect(pad, y, W - pad * 2, rowH - 16, 18);
    c.fill();
    c.fillStyle = GOLD;
    c.fillRect(pad, y + 14, 6, rowH - 44);
    c.fillStyle = TEXT;
    c.font = "bold 30px system-ui, sans-serif";
    c.fillText(r.name, pad + 28, y + 14, W - pad * 2 - 60);
    c.fillStyle = r.flag ? "#f87171" : MUTED;
    c.font = "26px system-ui, sans-serif";
    c.fillText(`${r.detail}${r.flag ? `   ${r.flag}` : ""}`, pad + 28, y + 50, W - pad * 2 - 60);
    y += rowH;
  }

  if (d.notes) {
    c.fillStyle = MUTED;
    c.font = "26px system-ui, sans-serif";
    const words = d.notes.split(/\s+/);
    let line = "";
    let ny = y + 20;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (c.measureText(test).width > W - pad * 2) {
        c.fillText(line, pad, ny);
        ny += 36;
        line = w;
      } else line = test;
    }
    if (line) {
      c.fillText(line, pad, ny);
      ny += 36;
    }
    y = ny + 4;
  }

  // crop away the unused tail so the card is exactly as tall as its content
  const out = document.createElement("canvas");
  out.width = W;
  out.height = Math.min(H, y + pad / 2);
  out.getContext("2d")?.drawImage(canvas, 0, 0);
  return out;
}

const blobOf = (canvas: HTMLCanvasElement, type: string, q?: number): Promise<Blob> =>
  new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("render failed"))), type, q),
  );

export const cardPng = (d: ShareData) => blobOf(renderCard(d), "image/png");

/* ---------------------------------- pdf --------------------------------- */

/** Wrap a JPEG of the card in a minimal single-page PDF (no dependencies). */
export async function cardPdf(d: ShareData): Promise<Blob> {
  const canvas = renderCard(d);
  const jpeg = new Uint8Array(await (await blobOf(canvas, "image/jpeg", 0.92)).arrayBuffer());

  const pw = 595.28;
  const ph = (canvas.height / canvas.width) * pw;
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let len = 0;
  const push = (u: Uint8Array) => {
    parts.push(u);
    len += u.length;
  };
  const text = (s: string) => push(enc.encode(s));
  const obj = (n: number, body: string, stream?: Uint8Array) => {
    offsets[n] = len;
    text(`${n} 0 obj\n${body}\n`);
    if (stream) {
      text("stream\n");
      push(stream);
      text("\nendstream\n");
    }
    text("endobj\n");
  };

  text("%PDF-1.4\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(2)} ${ph.toFixed(2)}] ` +
      "/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>",
  );
  obj(
    4,
    `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`,
    jpeg,
  );
  const content = enc.encode(`q ${pw.toFixed(2)} 0 0 ${ph.toFixed(2)} 0 0 cm /Im0 Do Q`);
  obj(5, `<< /Length ${content.length} >>`, content);

  const xref = len;
  text(`xref\n0 6\n0000000000 65535 f \n`);
  for (let i = 1; i <= 5; i++) text(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  text(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);

  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}

/* -------------------------------- delivery ------------------------------- */

/** Share a file with the OS sheet, falling back to a download. */
export async function shareFile(blob: Blob, filename: string, title: string): Promise<string> {
  const file = new File([blob], filename, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData_) => boolean };
  type ShareData_ = { files?: File[]; text?: string; title?: string };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title });
      return "Shared";
    } catch {
      return "Share cancelled";
    }
  }
  download(blob, filename);
  return `Saved ${filename}`;
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Share plain text, falling back to the clipboard. */
export async function shareText(text: string, title: string): Promise<string> {
  if (navigator.share) {
    try {
      await navigator.share({ text, title });
      return "Shared";
    } catch {
      return "Share cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "Copied to clipboard";
  } catch {
    return "Could not share on this device";
  }
}