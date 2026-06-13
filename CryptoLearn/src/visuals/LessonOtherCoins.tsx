import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 2.6 · "Other notable categories" — one interactive page.
//   A grid of coin/token categories; tap one to read its purpose.
// ===========================================================================

const STEP_COUNT = 1;

const CATEGORIES = [
  { emoji: '🪙', name: 'Altcoins', desc: 'Any cryptocurrency other than Bitcoin — thousands exist, each with its own goal.' },
  { emoji: '🐕', name: 'Meme coins', desc: 'Started as jokes or community fun (like Dogecoin). Value comes mostly from hype.' },
  { emoji: '🖼️', name: 'NFTs', desc: 'Non-fungible tokens — one-of-a-kind tokens proving ownership of art or collectibles.' },
  { emoji: '🗳️', name: 'Governance', desc: 'Governance tokens give holders a vote on how a project or protocol is run.' },
  { emoji: '🔧', name: 'Utility', desc: 'Utility tokens give access to a product or service inside a specific app.' },
  { emoji: '🕵️', name: 'Privacy', desc: 'Privacy coins keep transactions private and hard to trace (like Monero).' },
  { emoji: '🎁', name: 'Wrapped', desc: 'Wrapped tokens represent another asset on a different chain (e.g. WBTC = Bitcoin on Ethereum).' },
  { emoji: '🏦', name: 'Stablecoins', desc: 'Pegged to a steady asset like the US dollar (covered earlier — USDC, USDT).' },
];

export function LessonOtherCoins({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [picked, setPicked] = useState(0);
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        <h3 className="scene-heading">Other types of crypto</h3>
        <p className="scene-paragraph">
          Beyond coins and stablecoins, crypto comes in many flavors — each built for a different
          purpose. Tap a category to see what it’s for.
        </p>
        <div className="diagram diagram--cats">
          <div className="cat-grid">
            {CATEGORIES.map((c, i) => (
              <button
                key={c.name}
                className={i === picked ? 'cat-card cat-card--active' : 'cat-card'}
                onClick={(e) => {
                  stop(e);
                  setPicked(i);
                }}
              >
                <span className="cat-emoji">{c.emoji}</span>
                <span className="cat-name">{c.name}</span>
              </button>
            ))}
          </div>
          <p key={picked} className="cat-desc fade-in">
            {CATEGORIES[picked].desc}
          </p>
        </div>
      </div>

      <div className="scene-nav" onClick={stop}>
        <button className="btn btn--ghost" onClick={prev} disabled={step === 0}>
          ← Previous
        </button>
        {isLast ? (
          <div className="scene-nav__end">
            <button className="btn btn--ghost" onClick={onBack}>
              ← Back
            </button>
            <button className="btn btn--primary" onClick={onComplete}>
              Continue →
            </button>
          </div>
        ) : (
          <span className="scene-hint muted">Click anywhere to continue →</span>
        )}
      </div>

      <div className="scene-progress" onClick={stop}>
        {Array.from({ length: STEP_COUNT }, (_, i) => (
          <span
            key={i}
            className={i === step ? 'q-dot q-dot--current' : i < step ? 'q-dot q-dot--done' : 'q-dot'}
          />
        ))}
      </div>
    </div>
  );
}
