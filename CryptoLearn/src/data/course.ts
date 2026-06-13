import type { Course, Question } from '../types';

// ============================================================================
// Single source of truth for the course STRUCTURE.
//
// All teaching material is intentionally EMPTY for now:
//   - lesson.content   = ''      (no lesson body yet)
//   - question.prompt  = ''      (no question text yet)
//   - question.visual  = ''      (no visual yet)
//
// Only the section/lesson names and the number of question slots exist. The
// progress tables and the entire UI/data flow are driven off this object, so
// when material is written later, nothing else needs to change.
// ============================================================================

// How many practice-question slots each lesson has for now. Placeholder only —
// adjust per lesson when real questions are authored.
const QUESTIONS_PER_LESSON = 3;

function emptyQuestions(count: number): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    prompt: '',
    visual: '',
  }));
}

function lesson(id: string, title: string) {
  return { id, title, content: '', questions: emptyQuestions(QUESTIONS_PER_LESSON) };
}

export const COURSE: Course = {
  id: 'eth-transfers',
  title: 'Sending Crypto on Ethereum — From Architecture to Your First Transaction',
  sections: [
    {
      id: 's1',
      title: 'Blockchain & Ethereum Architecture',
      description:
        'Understand the machine before using it — what a blockchain is, how Ethereum is built, and how smart contracts make it programmable.',
      lessons: [
        lesson('s1l1', 'What is a blockchain? (blocks, chains, the distributed ledger)'),
        lesson('s1l2', 'Decentralization & consensus (nodes, validators, proof-of-stake)'),
        lesson('s1l3', "Ethereum's architecture (the EVM, accounts, world state)"),
        lesson('s1l4', 'Smart contracts — code that lives on-chain'),
        lesson('s1l5', 'Automation with smart contracts (how contracts execute automatically)'),
      ],
    },
    {
      id: 's2',
      title: 'Types of Cryptocurrencies & the Major Coins',
      description:
        'Understand what kinds of crypto exist and what the headline coins actually are.',
      lessons: [
        lesson('s2l1', 'Coins vs. tokens (native currency vs. assets on top of a chain)'),
        lesson('s2l2', 'Bitcoin (BTC) — the original, store-of-value model'),
        lesson('s2l3', 'Ether (ETH) — fuel for Ethereum'),
        lesson('s2l4', 'Stablecoins (USDC, USDT — value pegged to fiat)'),
        lesson('s2l5', 'Token standards on Ethereum (ERC-20 and what makes a token)'),
        lesson('s2l6', 'Other notable categories (altcoins, meme coins, NFTs)'),
      ],
    },
    {
      id: 's3',
      title: 'Wallet Architecture',
      description:
        'Understand what a wallet truly is, the key pair behind it, and how it connects to the chain.',
      lessons: [
        lesson('s3l1', 'What a wallet really is (it holds keys, not coins)'),
        lesson('s3l2', 'Public keys & addresses (your receiving identity)'),
        lesson('s3l3', 'Private keys & seed phrases (what grants control, and the danger)'),
        lesson('s3l4', 'How a wallet derives keys & addresses (key generation, simplified)'),
        lesson('s3l5', 'How wallets connect to the blockchain (nodes, RPC, reading vs. signing)'),
      ],
    },
    {
      id: 's4',
      title: 'Transactions',
      description:
        'Follow a transaction from creation to finality — through smart contracts, gas, the mempool, and confirmation.',
      lessons: [
        lesson('s4l1', 'Anatomy of a transaction (from, to, value, data, nonce)'),
        lesson('s4l2', 'Signing a transaction (the private key proves authorization)'),
        lesson('s4l3', 'Gas & gas fees (base fee + priority fee)'),
        lesson('s4l4', 'How transactions move through smart contracts (calls, EVM execution)'),
        lesson('s4l5', 'The mempool (the waiting room before inclusion)'),
        lesson('s4l6', 'Block inclusion & confirmations'),
        lesson('s4l7', 'Finality (when a transaction is truly irreversible)'),
      ],
    },
  ],
};

// Convenience: flat, ordered list of every question slot in the course.
// Used by resume logic and progress initialization.
export interface FlatQuestion {
  sectionId: string;
  lessonId: string;
  questionNumber: number;
}

export function flattenQuestions(course: Course = COURSE): FlatQuestion[] {
  const out: FlatQuestion[] = [];
  for (const section of course.sections) {
    for (const l of section.lessons) {
      for (const q of l.questions) {
        out.push({ sectionId: section.id, lessonId: l.id, questionNumber: q.number });
      }
    }
  }
  return out;
}
