/**
 * PERMANENT WORKOUT GUIDE IMAGES
 * ------------------------------------------------------------------
 * One uploaded guide image per training day. These replace all
 * generated/stick-figure diagrams. Keyed by DayPlan.key.
 */

export interface DayGuide {
  src: string;
  title: string;
  alt: string;
}

export const DAY_GUIDES: Record<string, DayGuide> = {
  mon: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/4660db21-124b-49c3-8dec-195fcb828cc9/monday_guide.png",
    title: "Monday Guide",
    alt: "Monday guide: chest, shoulders and biceps exercises with photos and technique cues",
  },
  tue: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/1d98a3c2-229e-4c5b-924f-27983a50a075/tuesday_guide.png",
    title: "Tuesday Guide",
    alt: "Tuesday guide: cardio, core and triceps exercises with photos and technique cues",
  },
  wed: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/3eb9d8c9-6932-466e-898c-65837fe9d4dc/wednesday_guide.png",
    title: "Wednesday Guide",
    alt: "Wednesday guide: legs, glutes and biceps exercises with photos and technique cues",
  },
  thu: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/6323e69d-d7e9-4797-98bb-6bcd3ea3839f/thursday_guide.png",
    title: "Thursday Guide",
    alt: "Thursday guide: back, rear shoulders and triceps exercises with photos and technique cues",
  },
  fri: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/e19085b6-368f-4b58-92e5-1924c9e7f25f/friday_guide.png",
    title: "Friday Guide",
    alt: "Friday guide: upper body, short cardio and arm exercises with photos and technique cues",
  },
};

export const guideFor = (key: string): DayGuide | undefined => DAY_GUIDES[key];

/** Weekday tabs used on the Program page. */
export const TRAINING_DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"] as const;