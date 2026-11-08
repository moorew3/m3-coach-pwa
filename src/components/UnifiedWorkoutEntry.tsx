import { useEffect } from 'react';
/** Preserve old addresses; every workout now lands in the same training screen. */
export function UnifiedWorkoutEntry({workout}:{workout:string}) {
  const href='/v2?workout='+encodeURIComponent(workout);
  useEffect(()=>{window.location.replace(href);},[href]);
  return <main className="p-6"><p>Opening your workout…</p><a href={href} className="tap-target mt-3 flex items-center text-primary">Open with Marcus</a></main>;
}
