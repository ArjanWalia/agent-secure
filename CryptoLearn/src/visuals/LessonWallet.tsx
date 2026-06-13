import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 3.1 · "What a wallet is" — one interactive page.
//   The big surprise: a wallet doesn't hold coins. It holds KEYS. The coins are
//   records on the blockchain; the keys prove they're yours. Open the wallet.
// ===========================================================================

const STEP_COUNT = 1;

export function LessonWallet({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [open, setOpen] = useState(false);
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        <h3 className="scene-heading">What a wallet really holds</h3>
        <p className="scene-paragraph">
          Surprise: a crypto wallet doesn’t actually hold your coins. Your coins are just records on
          the blockchain ⛓️. The wallet holds your <strong>keys</strong> 🔑 — and whoever holds the
          keys controls the coins. Open it up.
        </p>

        <div className="diagram diagram--wallet">
          <div className="wallet-side">
            <span className="wallet-emoji">{open ? '👜' : '👛'}</span>
            {open && (
              <div className="wallet-keys fade-in">
                <div className="wallet-key">
                  🔑 <strong>Public key</strong> — your address. Safe to share.
                </div>
                <div className="wallet-key">
                  🗝️ <strong>Private key</strong> — your secret. Never share!
                </div>
                <div className="wallet-nocoins">🚫🪙 no coins inside</div>
              </div>
            )}
          </div>

          <div className="wallet-link">
            <span className="io-arrow">→</span>
            <span className="muted">keys prove ownership</span>
          </div>

          <div className="wallet-chain">
            <div className="wallet-chain-head">⛓️ Blockchain</div>
            <div className="wallet-balance">0xAbc… : 5 ETH</div>
            <div className="muted">the real balance lives here</div>
          </div>
        </div>

        <div className="scene-controls" onClick={stop}>
          <button className="btn btn--primary btn--sm" onClick={() => setOpen((o) => !o)}>
            {open ? 'Close wallet' : 'Open wallet 👛'}
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
