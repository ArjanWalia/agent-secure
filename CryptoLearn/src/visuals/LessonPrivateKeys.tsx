import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 3.3 · "Private keys & seed phrases" — one interactive page, 3 sections.
//   §1  What a private key is — it signs transactions to authorize them.
//   §2  Seed phrases — human-readable backup of your keys; reveal it (carefully).
//   §3  How they protect you — without the key, a thief is locked out.
// ===========================================================================

const STEP_COUNT = 3;

const SEED = [
  'ocean', 'ladder', 'mirror', 'tiger', 'velvet', 'cabin',
  'puzzle', 'orbit', 'maple', 'frost', 'ember', 'comet',
];

export function LessonPrivateKeys({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [signed, setSigned] = useState(false); // §1
  const [revealed, setRevealed] = useState(false); // §2
  const [hasKey, setHasKey] = useState(false); // §3
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        {step === 0 && (
          <>
            <h3 className="scene-heading">What is a private key?</h3>
            <p className="scene-paragraph">
              Your <strong>private key</strong> 🗝️ is the master secret of your wallet. It{' '}
              <strong>signs</strong> your transactions — a digital signature proving you authorized
              them. Whoever holds it controls the funds. Sign a transaction.
            </p>
            <div className="diagram diagram--sign">
              <span className="sign-key">🗝️</span>
              <span className="io-arrow">→</span>
              <div className="sign-tx">
                📝 Send 1 ETH
                {signed && <div className="sign-sig fade-in">✅ signed &amp; authorized</div>}
              </div>
            </div>
            <div className="scene-controls" onClick={stop}>
              <button className="btn btn--primary btn--sm" onClick={() => setSigned((s) => !s)}>
                {signed ? 'Reset' : 'Sign transaction 🗝️'}
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="scene-heading">Seed phrases</h3>
            <p className="scene-paragraph">
              A <strong>seed phrase</strong> is your keys written as 12 simple words. From it, your
              wallet can recreate every private key you own — so it’s the backup of everything. Write
              it down, keep it offline, and <strong>never share it</strong>.
            </p>
            <div className="diagram diagram--seed">
              {revealed ? (
                <div className="seed-grid fade-in">
                  {SEED.map((w, i) => (
                    <span key={w} className="seed-word">
                      <span className="seed-num">{i + 1}</span> {w}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="seed-hidden">🙈 hidden — keep it secret</div>
              )}
            </div>
            <div className="scene-controls" onClick={stop}>
              <button className="btn btn--primary btn--sm" onClick={() => setRevealed((r) => !r)}>
                {revealed ? 'Hide seed phrase 🙈' : 'Reveal seed phrase 👀'}
              </button>
              <span className="muted">Anyone who sees these 12 words controls your wallet</span>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="scene-heading">How they keep you safe</h3>
            <p className="scene-paragraph">
              Cryptography means your address and public key are safe to share — but{' '}
              <strong>only the private key can unlock the funds</strong>. A thief who sees everything
              else still can’t get in. Toggle the key.
            </p>
            <div className="diagram diagram--vault">
              <span className="vault-actor">{hasKey ? '🧑🗝️' : '🦹'}</span>
              <span className="io-arrow">→</span>
              <span className="vault-lock">{hasKey ? '🔓' : '🔒'}</span>
              <div className={hasKey ? 'vault-msg vault-msg--ok fade-in' : 'vault-msg vault-msg--bad fade-in'} key={String(hasKey)}>
                {hasKey ? '✅ Access granted' : '⛔ Locked out — no key'}
              </div>
            </div>
            <div className="scene-controls" onClick={stop}>
              <button className="btn btn--primary btn--sm" onClick={() => setHasKey((k) => !k)}>
                {hasKey ? 'Remove key' : 'Use private key 🗝️'}
              </button>
              <span className="muted">Never share your key or seed — beware phishing 🎣</span>
            </div>
          </>
        )}
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
