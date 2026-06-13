import type { Course, Lesson, Question } from '../types';

// ============================================================================
// Single source of truth for the course STRUCTURE.
//
// A lesson = an ordered list of (teach page → question) PAIRS, then a QUIZ.
// All teaching material is intentionally EMPTY for now:
//   - teach.content  = ''   (no teaching body yet)
//   - question.prompt = ''  (no question text yet)
//
// Only the section/lesson names, the teach-page sub-topic titles, and the
// number of quiz questions exist. Progress tracking and the whole UI are driven
// off this object, so authoring material later requires no other changes.
//
// QUESTION NUMBERING (for progress tracking, 1-based within a lesson):
//   pair questions   → 1 .. pairs.length
//   quiz questions   → pairs.length+1 .. pairs.length+quiz.length
// ============================================================================

const emptyQuestion = (): Question => ({ prompt: '', visual: '' });

// A teach page spec: either just a sub-topic title, or a title plus the id of
// an interactive visual scene to render on that page.
type TeachSpec = string | { title: string; visualId?: string };

// Build a lesson from a list of teach-page specs plus a quiz size.
function lesson(
  id: string,
  title: string,
  opts: { teach?: TeachSpec[]; quiz?: number } = {},
): Lesson {
  // Default for not-yet-mapped lessons: 1 placeholder teach page + 5 quiz Qs.
  const teachSpecs = opts.teach ?? [''];
  const quizCount = opts.quiz ?? 5;
  return {
    id,
    title,
    pairs: teachSpecs.map((spec) => {
      const t = typeof spec === 'string' ? { title: spec } : spec;
      return {
        teach: { title: t.title, content: '', visualId: t.visualId },
        question: emptyQuestion(),
      };
    }),
    quiz: Array.from({ length: quizCount }, emptyQuestion),
  };
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
        // Lesson 1 — one big interactive page covering the whole topic.
        lesson('s1l1', 'What is a blockchain?', {
          teach: [{ title: 'What is a blockchain?', visualId: 'lesson1-blockchain' }],
          quiz: 0,
        }),
        lesson('s1l2', 'Decentralization & consensus (nodes, validators, proof-of-stake)', {
          teach: [{ title: 'Nodes, validators & proof of stake', visualId: 'lesson2-nodes' }],
          quiz: 0,
        }),
        lesson('s1l3', "Ethereum's architecture (the EVM, accounts, world state)", {
          teach: [{ title: 'Ethereum: a global computer', visualId: 'lesson3-ethereum' }],
          quiz: 0,
        }),
        lesson('s1l4', 'Smart contracts — code that lives on-chain', {
          teach: [{ title: 'Smart contracts', visualId: 'lesson4-contracts' }],
          quiz: 0,
        }),
        lesson('s1l5', 'Ethereum development — tokens & the flow of value', {
          teach: [{ title: 'Ethereum development', visualId: 'lesson5-development' }],
          quiz: 0,
        }),
      ],
    },
    {
      id: 's2',
      title: 'Types of Cryptocurrencies & the Major Coins',
      description:
        'Understand what kinds of crypto exist and what the headline coins actually are.',
      lessons: [
        lesson('s2l1', 'Coins vs. tokens (native currency vs. assets on top of a chain)', {
          teach: [{ title: 'Coins vs. tokens', visualId: 'coins-vs-tokens' }],
          quiz: 0,
        }),
        lesson('s2l2', 'Bitcoin (BTC) — the original, store-of-value model', {
          teach: [{ title: 'Bitcoin', visualId: 'bitcoin' }],
          quiz: 0,
        }),
        lesson('s2l3', 'Ether (ETH) — fuel for Ethereum', {
          teach: [{ title: 'Ether', visualId: 'ether' }],
          quiz: 0,
        }),
        lesson('s2l4', 'Stablecoins (USDC, USDT — value pegged to fiat)', {
          teach: [{ title: 'Stablecoins', visualId: 'stablecoins' }],
          quiz: 0,
        }),
        lesson('s2l5', 'Token standards on Ethereum (ERC-20 and what makes a token)', {
          teach: [{ title: 'Token standards', visualId: 'token-standards' }],
          quiz: 0,
        }),
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

// ---- Structure helpers ----

// Total answerable questions in a lesson (pair questions + quiz questions).
export function lessonQuestionCount(l: Lesson): number {
  return l.pairs.length + l.quiz.length;
}

// 1-based question numbers for a lesson: [1, 2, …, count].
export function lessonQuestionNumbers(l: Lesson): number[] {
  return Array.from({ length: lessonQuestionCount(l) }, (_, i) => i + 1);
}

// Convenience: flat, ordered list of every question in the course.
export interface FlatQuestion {
  sectionId: string;
  lessonId: string;
  questionNumber: number;
}

export function flattenQuestions(course: Course = COURSE): FlatQuestion[] {
  const out: FlatQuestion[] = [];
  for (const section of course.sections) {
    for (const l of section.lessons) {
      for (const n of lessonQuestionNumbers(l)) {
        out.push({ sectionId: section.id, lessonId: l.id, questionNumber: n });
      }
    }
  }
  return out;
}
