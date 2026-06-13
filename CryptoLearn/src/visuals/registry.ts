import type { ComponentType } from 'react';
import { TxBeforeBlockchain } from './TxBeforeBlockchain';

// Props every interactive visual scene receives.
export interface VisualProps {
  // Call when the user finishes the scene → advances to the lesson's question.
  onAdvance: () => void;
}

// Registry mapping a teach page's visualId → its interactive component.
// Teach pages without a registered id fall back to the static placeholder.
export const VISUALS: Record<string, ComponentType<VisualProps>> = {
  'tx-before-blockchain': TxBeforeBlockchain,
};
