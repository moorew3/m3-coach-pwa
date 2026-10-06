import { MARCUS_TRAINER_RECORDINGS } from './marcus-trainer-recordings';
import { playRecordedCoachAudio, preloadRecordedCoachAudio, stopRecordedCoachAudio } from './recorded-coach-player';

export type TrainerPart = 'full' | 'name' | 'setup' | 'movement' | 'breathing';
export function hasMarcusTrainer(key?: string): boolean {
  return Boolean(key && MARCUS_TRAINER_RECORDINGS[key]);
}
export function preloadMarcusTrainer(key?: string) {
  const clip = key && MARCUS_TRAINER_RECORDINGS[key];
  if (clip) preloadRecordedCoachAudio(clip.url);
}
export function stopMarcusTrainer() { stopRecordedCoachAudio('trainer'); }
export function playMarcusTrainer(key?: string, part: TrainerPart = 'full'): Promise<boolean> {
  const clip = key && MARCUS_TRAINER_RECORDINGS[key];
  if (!clip) return Promise.resolve(false);
  return playRecordedCoachAudio(clip.url, 'trainer', part === 'full' ? undefined : clip[part]);
}
