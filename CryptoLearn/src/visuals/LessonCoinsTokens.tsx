import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 2.1 · "Coins vs. tokens" — one interactive page.
//   A side-by-side comparison: a COIN is native to its OWN blockchain (the
//   chain is named after the coin), while a TOKEN rides on top of an existing
//   network's blockchain (named after the network, e.g. Ethereum — not the
//   token). Cycle through examples to see the pattern.
// ===========================================================================

const STEP_COUNT = 1;

const COINS = [
  { name: 'Bitcoin', sym: '₿', emoji: '🪙' },
  { name: 'Ether', sym: 'Ξ', emoji: '💎', chain: 'Ethereum' },
  { name: 'Litecoin', sym: 'Ł', emoji: '🪙' },
];
const TOKENS = [
  { name: 'USDC', sym: '$', emoji: '💵' },
  { name: 'Shiba Inu', sym: 'SHIB', emoji: '🐕' },
  { name: 'Chainlink', sym: 'LINK', emoji: '🔗' },
];

function Chain({ label }: { label: string }) {
  return (
    <>
      <div className="chain-label">⛓️ {label}</div>
      <div className="chain-row-sm">🧱🔗🧱🔗🧱</div>
    </>
  );
}

export function LessonCoinsTokens({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [ex, setEx] = useState(0);
  const stop = (e: MouseEvent) => e.stopPropagation();

  const coin = COINS[ex % COINS.length];
  const token = TOKENS[ex % TOKENS.length];
  // A coin's blockchain is named after the coin (Ether's chain is "Ethereum").
  const coinChain = coin.chain ?? `${coin.name} blockchain`;

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        <h3 className="scene-heading">Coins vs. tokens</h3>
        <p className="scene-paragraph">
          They sound the same, but the difference is where they live. Tap “another example” to spot
          the pattern.
        </p>

        <div className="compare">
          {/* COIN */}
          <div className="compare-card" key={`c${ex}`}>
            <span className="tag">Coin</span>
            <div className="asset fade-in">
              {coin.emoji} <strong>{coin.name}</strong> <span className="asset-sym">{coin.sym}</span>
            </div>
            <div className="compare-note">native to its own blockchain ↓</div>
            <Chain label={coinChain} />
            <p className="compare-text">
              A <strong>coin</strong> is the native currency of its <strong>own</strong> blockchain —
              the chain is named after the coin.
            </p>
          </div>

          {/* TOKEN */}
          <div className="compare-card" key={`t${ex}`}>
            <span className="tag">Token</span>
            <div className="asset fade-in">
              {token.emoji} <strong>{token.name}</strong> <span className="asset-sym">{token.sym}</span>
            </div>
            <div className="compare-note">rides on top of a network ↓</div>
            <div className="token-layer">🎫 token layer</div>
            <Chain label="Ethereum" />
            <p className="compare-text">
              A <strong>token</strong> is built <strong>on top of</strong> an existing network — the
              chain is named after the network (Ethereum), not the token.
            </p>
          </div>
        </div>

        <div className="scene-controls" onClick={stop}>
          <button className="btn btn--primary btn--sm" onClick={() => setEx((e) => e + 1)}>
            Another example 🔄
          </button>
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
