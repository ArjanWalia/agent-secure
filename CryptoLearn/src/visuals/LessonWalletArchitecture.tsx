import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 3.4 · "Wallet architecture" — one interactive page, two sections.
//   §1  How a wallet gets its keys & address: randomness → private → public →
//       address. Generate to see fresh values.
//   §2  The complete A↔B flow: A's private key signs (control), funds are sent
//       to B's address (derived from B's public key), B receives.
// ===========================================================================

const STEP_COUNT = 2;

const HEX = '0123456789abcdef';
function randHex(n: number) {
  let s = '';
  for (let i = 0; i < n; i++) s += HEX[Math.floor(Math.random() * 16)];
  return s;
}

// Wallet card showing the priv → pub → address stack, with one row highlighted.
function WalletCard({
  name,
  priv,
  pub,
  addr,
  highlight,
}: {
  name: string;
  priv: string;
  pub: string;
  addr: string;
  highlight: 'priv' | 'pub' | 'addr' | 'all' | null;
}) {
  const hl = (k: string) => (highlight === k || highlight === 'all' ? 'arch-row arch-row--hl' : 'arch-row');
  return (
    <div className={highlight === 'all' ? 'arch-wallet arch-wallet--hl' : 'arch-wallet'}>
      <div className="arch-name">👛 {name}</div>
      <div className={hl('priv')}>🗝️ private <code>0x{priv}…</code></div>
      <div className={hl('pub')}>🔑 public <code>0x{pub}…</code></div>
      <div className={hl('addr')}>🏷️ address <code>0x{addr}…</code></div>
    </div>
  );
}

const FLOW_CAPTIONS = [
  'Wallet A signs the transaction with its private key 🗝️ — proving A controls the funds.',
  'The transaction is addressed to B’s address 🏷️, which was derived from B’s public key 🔑.',
  'The signed transaction travels across the network 💵 → to B.',
  'B receives the funds. B’s public key let anyone pay it — but only B’s private key can spend them.',
];

export function LessonWalletArchitecture({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [keys, setKeys] = useState(() => ({ priv: randHex(8), pub: randHex(12), addr: randHex(6) }));
  const [phase, setPhase] = useState(0); // §2 flow phase 0..3
  const stop = (e: MouseEvent) => e.stopPropagation();

  // Fixed demo keys for A and B in §2.
  const A = { priv: '3f9a', pub: 'c21e8b', addr: '1Ab…f0' };
  const B = { priv: 'b7d2', pub: '9e44a1', addr: '9Cd…22' };
  const moneyLeft = [6, 6, 50, 92][phase];

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        {step === 0 && (
          <>
            <h3 className="scene-heading">How a wallet makes its keys</h3>
            <p className="scene-paragraph">
              Creating a wallet starts with a huge <strong>random number</strong> 🎲 — that becomes
              your private key 🗝️. One-way math turns it into your public key 🔑, and hashing the
              public key gives your address 🏷️. The randomness is so vast no two wallets ever collide.
            </p>
            <div className="diagram diagram--derive">
              <div className="derive-step">
                <span className="derive-emoji">🎲</span>
                <div className="derive-label">Randomness</div>
              </div>
              <span className="derive-arrow">→</span>
              <div className="derive-step">
                <span className="derive-emoji">🗝️</span>
                <div className="derive-label">Private key</div>
                <code>0x{keys.priv}…</code>
              </div>
              <span className="derive-arrow">→ math →</span>
              <div className="derive-step">
                <span className="derive-emoji">🔑</span>
                <div className="derive-label">Public key</div>
                <code>0x{keys.pub}…</code>
              </div>
              <span className="derive-arrow">→ hash →</span>
              <div className="derive-step">
                <span className="derive-emoji">🏷️</span>
                <div className="derive-label">Address</div>
                <code>0x{keys.addr}…</code>
              </div>
            </div>
            <div className="scene-controls" onClick={stop}>
              <button
                className="btn btn--primary btn--sm"
                onClick={() => setKeys({ priv: randHex(8), pub: randHex(12), addr: randHex(6) })}
              >
                Generate wallet 🎲
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="scene-heading">The complete flow: A → B</h3>
            <p className="scene-paragraph">
              Here’s how it all fits together when A pays B. Step through it.
            </p>
            <div className="diagram diagram--arch">
              <WalletCard
                name="Wallet A"
                priv={A.priv}
                pub={A.pub}
                addr={A.addr}
                highlight={phase === 0 ? 'priv' : null}
              />
              <div className="arch-track">
                <span className="arch-money" style={{ left: `${moneyLeft}%` }}>💵</span>
              </div>
              <WalletCard
                name="Wallet B"
                priv={B.priv}
                pub={B.pub}
                addr={B.addr}
                highlight={phase === 1 ? 'addr' : phase === 3 ? 'all' : null}
              />
            </div>
            <p key={phase} className="arch-caption fade-in">
              {FLOW_CAPTIONS[phase]}
            </p>
            <div className="scene-controls" onClick={stop}>
              <button
                className="btn btn--primary btn--sm"
                onClick={() => setPhase((p) => Math.min(p + 1, 3))}
                disabled={phase >= 3}
              >
                Next step →
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => setPhase(0)}>
                Reset
              </button>
              <span className="muted">Step {phase + 1} of 4</span>
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
