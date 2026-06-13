import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 4.1 · "Anatomy of a transaction" — one interactive slider diagram.
//   Wallet A (🗝️ private key, 🏷️ address) → Smart contract 📄 → Wallet B (🏷️),
//   recorded on the node ledger 💻📒. Drag the slider: A signs with its private
//   key, the 💵 travels A → contract → B, and B records it.
// ===========================================================================

const STEP_COUNT = 1;

function lerp(a: number, b: number, u: number) {
  return a + (b - a) * u;
}

export function LessonTxFlow({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [s, setS] = useState(0); // slider 0..100
  const stop = (e: MouseEvent) => e.stopPropagation();

  const t = s / 100;
  const moneyX = t <= 0.5 ? lerp(12, 50, t / 0.5) : lerp(50, 86, (t - 0.5) / 0.5);

  const signed = t > 0;
  const aHot = t > 0 && t < 0.55;
  const cHot = t >= 0.38 && t <= 0.62;
  const bHot = t >= 0.9;
  const recorded = t >= 0.97;

  let caption = 'Drag the slider to send a transaction →';
  if (t > 0 && t < 0.45) caption = 'Wallet A signs with its private key 🗝️ and releases the funds.';
  else if (t >= 0.45 && t < 0.6) caption = 'The smart contract 📄 in the middle processes the transfer.';
  else if (t >= 0.6 && t < 0.97) caption = 'The contract forwards the funds toward Wallet B.';
  else if (recorded) caption = 'Wallet B receives the funds — recorded on the node’s ledger 📒 ✅.';

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        <h3 className="scene-heading">The full flow of a transaction</h3>
        <p className="scene-paragraph">
          Every transfer is the same journey: Wallet A authorizes it with its private key, the value
          moves through a smart contract, and Wallet B receives it — written into the shared ledger.
          Slide to send it.
        </p>

        <div className="diagram diagram--txflow">
          <svg className="diagram-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="14" y1="40" x2="50" y2="40" stroke="var(--border)" strokeWidth="0.7" />
            <line x1="50" y1="40" x2="86" y2="40" stroke="var(--border)" strokeWidth="0.7" />
          </svg>

          {/* Wallet A */}
          <div className={aHot ? 'txflow-node txflow-node--hot' : 'txflow-node'} style={{ left: '12%', top: '40%' }}>
            <span className="txflow-emoji">👛</span>
            <div className="txflow-label">Wallet A</div>
            <div className={signed ? 'txflow-key txflow-key--on' : 'txflow-key'}>
              🗝️ {signed ? 'signed ✅' : 'private key'}
            </div>
            <div className="txflow-addr">🏷️ 0xA…</div>
          </div>

          {/* Smart contract */}
          <div className={cHot ? 'txflow-node txflow-node--hot' : 'txflow-node'} style={{ left: '50%', top: '40%' }}>
            <span className="txflow-emoji">📄</span>
            <div className="txflow-label">Smart contract</div>
          </div>

          {/* Wallet B */}
          <div className={bHot ? 'txflow-node txflow-node--hot' : 'txflow-node'} style={{ left: '86%', top: '40%' }}>
            <span className="txflow-emoji">👛</span>
            <div className="txflow-label">Wallet B</div>
            <div className="txflow-addr">🏷️ 0xB…</div>
          </div>

          {/* Ledger under B */}
          <div className="txflow-ledger" style={{ left: '86%', top: '76%' }}>
            💻📒
            <div className={recorded ? 'txflow-record txflow-record--on' : 'txflow-record'}>
              {recorded ? '+1 ETH ✅' : '—'}
            </div>
          </div>

          {/* Moving money */}
          <div className="txflow-money" style={{ left: `${moneyX}%`, top: '40%', opacity: t > 0 ? 1 : 0.3 }}>
            💵<span className="txflow-amt">1 ETH</span>
          </div>
        </div>

        <p key={caption} className="arch-caption fade-in">
          {caption}
        </p>

        <div className="scene-controls" onClick={stop}>
          <input type="range" min={0} max={100} value={s} onChange={(e) => setS(Number(e.target.value))} />
          <span className="muted">{recorded ? 'Transaction complete ✓' : 'Send the transaction'}</span>
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
