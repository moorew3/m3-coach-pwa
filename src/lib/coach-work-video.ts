import { useSyncExternalStore } from "react";

export type CoachWorkVideoStatus = "idle" | "playing" | "paused" | "buffering" | "failed";
export interface CoachWorkVideoState {
  url: string | null;
  status: CoachWorkVideoStatus;
}

const initial: CoachWorkVideoState = Object.freeze({ url: null, status: "idle" });
let snapshot: CoachWorkVideoState = initial;
const listeners = new Set<() => void>();

function publish(next: CoachWorkVideoState) {
  if (snapshot.url === next.url && snapshot.status === next.status) return;
  snapshot = next;
  for (const listener of listeners) listener();
}

/** Only the active, owner-approved WORK video is allowed to drive coaching. */
export function updateCoachWorkVideo(url: string, status: CoachWorkVideoStatus) {
  if (!url) return;
  publish({ url, status });
}

export function releaseCoachWorkVideo(url: string) {
  if (snapshot.url === url) publish(initial);
}

export function getCoachWorkVideoSnapshot() { return snapshot; }
export function subscribeCoachWorkVideo(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function useCoachWorkVideo() {
  return useSyncExternalStore(subscribeCoachWorkVideo, getCoachWorkVideoSnapshot, () => initial);
}
