// After a new deploy, an open tab still references the previous build's chunk
// filenames. Loading one 404s with "Failed to fetch dynamically imported module"
// and the route renders blank. Reload once (guarded by sessionStorage so a real
// network failure can't loop) to pick up the fresh asset manifest.

const FLAG = "arm-tracker:chunk-reload";

export function isStaleChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("error loading dynamically imported module") ||
    message.includes("Importing a module script failed")
  );
}

export function recoverFromStaleChunk(error: unknown): boolean {
  if (typeof window === "undefined") return false;
  if (!isStaleChunkError(error)) return false;
  try {
    if (sessionStorage.getItem(FLAG)) return false;
    sessionStorage.setItem(FLAG, "1");
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export function clearStaleChunkFlag() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(FLAG);
  } catch {
    /* ignore */
  }
}