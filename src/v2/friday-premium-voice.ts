/** Compatibility exports; every workout now uses verified Marcus recordings. */
import { hasMarcusTrainer, playMarcusTrainer, preloadMarcusTrainer, stopMarcusTrainer } from './marcus-trainer-audio';
export const hasFridayPremiumCue = hasMarcusTrainer;
export const playFridayPremiumCue = playMarcusTrainer;
export const preloadFridayPremiumCue = preloadMarcusTrainer;
export const stopFridayPremiumCue = stopMarcusTrainer;
