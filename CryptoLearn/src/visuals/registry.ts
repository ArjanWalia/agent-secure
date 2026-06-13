import type { ComponentType } from 'react';
import { Lesson1Blockchain } from './Lesson1Blockchain';

// Props every interactive visual scene receives.
export interface VisualProps {
  // Advance within the lesson (teach → question). Used by simple scenes.
  onAdvance: () => void;
  // Finish the whole lesson and move to the NEXT lesson ("Continue").
  onComplete: () => void;
  // Go to the PREVIOUS lesson, or the course page if there isn't one ("Back").
  onBack: () => void;
}

// Registry mapping a teach page's visualId → its interactive component.
// Teach pages without a registered id fall back to the static placeholder.
export const VISUALS: Record<string, ComponentType<VisualProps>> = {
  'lesson1-blockchain': Lesson1Blockchain,
};
