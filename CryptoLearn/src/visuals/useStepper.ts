import { useState } from 'react';

// Drives the click-to-advance section flow used by full-page lesson scenes.
// Advancing fades the next section IN; pressing "Previous" fades the current
// section OUT first, then shows the previous one (which fades in).
export function useStepper(count: number) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const isLast = step === count - 1;

  function advance() {
    if (!isLast && !exiting) setStep((s) => s + 1);
  }
  function prev() {
    if (step > 0 && !exiting) {
      setExiting(true);
      window.setTimeout(() => {
        setStep((s) => s - 1);
        setExiting(false);
      }, 280); // matches the fade-out animation duration
    }
  }

  // Class for the section container: fade out while leaving, fade in otherwise.
  const stepClass = exiting ? 'scene-step fade-out' : 'scene-step fade-in';
  return { step, isLast, advance, prev, exiting, stepClass };
}
