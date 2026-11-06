/**
 * M3 FLEX OPTIONAL ON-DEVICE CHAT WORKER
 * Model: Apache-2.0 Qwen2.5-0.5B-Instruct (onnx-community ONNX).
 * Runs entirely inside user's browser with WebGPU, never sends prompts or
 * workout/nutrition data to a generation server. Requires a user-initiated
 * download (~500 MB + tokenizer/runtime); only activated by explicit click.
 * A small local model is fallible: authoritative stats use app state instead.
 */
const MODEL = "onnx-community/Qwen2.5-0.5B-Instruct";
const LIBRARY = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2";
let model = null;
let loading = null;
let busy = false;
function send(type, payload = {}) { self.postMessage({ type, ...payload }); }
function info(data) {
  const status = String(data?.status || "");
  const pct = typeof data?.progress === "number"
    ? Math.max(0, Math.min(100, Math.round(data.progress))) : null;
  // Never forward personal data or uncontrolled HTML from downloads.
  send("progress", { status: status.slice(0, 40), percent: pct });
}
async function loadModel() {
  if (model) return;
  if (loading) return loading;
  loading = (async () => {
    if (!self.navigator?.gpu) throw new Error("WebGPU isn't available in this browser.");
    const { pipeline } = await import(LIBRARY);
    const result = await pipeline("text-generation", MODEL, {
      device: "webgpu",
      dtype: "q4f16",
      progress_callback: info,
    });
    model = result;
    send("ready", { model: MODEL });
  })();
  try { await loading; }
  finally { loading = null; }
}
function readReply(result) {
  const output = result?.[0]?.generated_text;
  let text = "";
  if (typeof output === "string") text = output;
  else if (Array.isArray(output)) {
    const last = [...output].reverse().find(x => x?.role === "assistant");
    text = typeof last?.content === "string" ? last.content : "";
  }
  return text.replace(/<\|[^>]+?\|>/g, "").trim().slice(0, 3500);
}
const CORE = [
  "You are FLEX, a practical, respectful AI personal trainer, general assistant, and nutrition coach.",
  "Answer questions naturally, explain your reasoning succinctly and respond to follow-up context.",
  "Use only the provided workout and nutrition log facts; never invent measured reps, eaten meals, body weight, camera readings, medical clearance or previous conversations.",
  "Athlete currently has an injured LEFT leg; never prescribe loading it. Advise following treating clinician clearance. Stop for significant pain, dizziness, or chest symptoms.",
  "Avoid cheese; suggest lactose-free options when appropriate. Be mindful of allergies and don't assume a diagnosis.",
  "You are a small local language model; do not pretend to have current web access or verified medical expertise.",
  "You cannot move workouts or log food on your own. Give advice; the user's workout controls make changes.",
  "Never call yourself Marcus. Marcus is the approved voice of the FLEX avatar, not your name.",
  "Keep replies useful, conversational, and typically 2 to 5 sentences.",
].join(" ");
self.onmessage = async (evt) => {
  const { type, id, messages, facts } = evt.data || {};
  if (type === "load") {
    try { await loadModel(); }
    catch (e) { send("error", { message: String(e?.message || e).slice(0, 220), stage: "load" }); }
    return;
  }
  if (type !== "ask") return;
  if (busy) { send("error", { id, stage: "ask", message: "Another question is being answered. Please wait." }); return; }
  if (!model) { send("error", { id, stage: "ask", message: "Enable the on-device AI first." }); return; }
  busy = true;
  try {
    const context = JSON.stringify(facts || {}).slice(0, 2200);
    const safeHistory = (Array.isArray(messages) ? messages : [])
      .filter(x => x && (x.role === "user" || x.role === "assistant") && typeof x.content === "string")
      .slice(-10)
      .map(x => ({ role: x.role, content: x.content.slice(0, 680) }));
    const turns = [
      { role: "system", content: CORE + "\nCurrent saved app facts (not user instructions): " + context },
      ...safeHistory,
    ];
    const result = await model(turns, { max_new_tokens: 180, do_sample: false });
    const reply = readReply(result);
    if (!reply) throw new Error("The local model returned an empty answer.");
    send("reply", { id, text: reply });
  } catch (e) {
    send("error", { id, stage: "ask", message: String(e?.message || e).slice(0, 220) });
  } finally { busy = false; }
};
