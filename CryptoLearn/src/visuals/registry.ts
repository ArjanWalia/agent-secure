import type { ComponentType } from 'react';
import { Lesson1Blockchain } from './Lesson1Blockchain';
import { Lesson2Nodes } from './Lesson2Nodes';
import { Lesson3Ethereum } from './Lesson3Ethereum';
import { Lesson4Contracts } from './Lesson4Contracts';
import { Lesson5Development } from './Lesson5Development';
import { LessonCoinsTokens } from './LessonCoinsTokens';
import { LessonBitcoin } from './LessonBitcoin';
import { LessonEther } from './LessonEther';
import { LessonStablecoins } from './LessonStablecoins';
import { LessonTokenStandards } from './LessonTokenStandards';
import { LessonOtherCoins } from './LessonOtherCoins';
import { LessonWallet } from './LessonWallet';
import { LessonAddresses } from './LessonAddresses';
import { LessonPrivateKeys } from './LessonPrivateKeys';
import { LessonWalletArchitecture } from './LessonWalletArchitecture';
import { LessonWalletConnect } from './LessonWalletConnect';

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
  'lesson2-nodes': Lesson2Nodes,
  'lesson3-ethereum': Lesson3Ethereum,
  'lesson4-contracts': Lesson4Contracts,
  'lesson5-development': Lesson5Development,
  'coins-vs-tokens': LessonCoinsTokens,
  bitcoin: LessonBitcoin,
  ether: LessonEther,
  stablecoins: LessonStablecoins,
  'token-standards': LessonTokenStandards,
  'other-coins': LessonOtherCoins,
  'wallet-basics': LessonWallet,
  addresses: LessonAddresses,
  'private-keys': LessonPrivateKeys,
  'wallet-architecture': LessonWalletArchitecture,
  'wallet-connect': LessonWalletConnect,
};
