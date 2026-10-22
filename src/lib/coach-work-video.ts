import { useSyncExternalStore } from "react";

export type CoachWorkVideoStatus = "idle" | "playing" | "paused" | "buffering" | "failed";
export interface CoachWorkVideoState {
  url: string | null;
  stepKey: string | null;
  status: CoachWorkVideoStatus;
}

const initial: CoachWorkVideoState = Object.freeze({ url: null, stepKey: null, status: "idle" });
let snapshot: CoachWorkVideoState = initial;
const listeners = new Set<() => void>();

function publish(next: CoachWorkVideoState) {
  if (snapshot.url === next.url && snapshot.stepKey === next.stepKey && snapshot.status === next.status) return;
  snapshot = next;
  for (const listener of listeners) listener();
}

/** Only the active, owner-approved WORK video is allowed to drive coaching. */
export function updateCoachWorkVideo(url: string, stepKey: string, status: CoachWorkVideoStatus) {
  if (!url) return;
  publish({ url, stepKey, status });
}

export function releaseCoachWorkVideo(url: string, stepKey: string) {
  if (snapshot.url === url && snapshot.stepKey === stepKey) publish(initial);
}

export function getCoachWorkVideoSnapshot() { return snapshot; }
export function subscribeCoachWorkVideo(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function useCoachWorkVideo() {
  return useSyncExternalStore(subscribeCoachWorkVideo, getCoachWorkVideoSnapshot, () => initial);
}
