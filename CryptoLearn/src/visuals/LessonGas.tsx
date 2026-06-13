import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 4.2 · "Gas fees" — one interactive page, two sections.
//   §1  Why gas exists + base fee 🔥 (burned) and priority fee 🎁 (tip). Drag the
//       tip to see total cost and speed change.
//   §2  Congestion — when a contract gets flooded with requests, the base fee
//       rises. Drag demand to watch the queue pile up and gas spike.
// ===========================================================================

const STEP_COUNT = 2;
const BASE = 20; // gwei, fixed network base fee for the demo

export function LessonGas({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [priority, setPriority] = useState(2); // §1 tip (gwei)
  const [demand, setDemand] = useState(10); // §2 network demand 0..100
  const stop = (e: MouseEvent) => e.stopPropagation();

  const total = BASE + priority;
  const speed = priority <= 2 ? '🐢 slower' : priority <= 6 ? '🚶 normal' : '🚀 faster';

  // §2 derived
  const pending = Math.round(demand / 12) + 1; // queued requests
  const congestedBase = Math.round(BASE + demand * 0.9); // base fee rises with demand
  const busy = demand < 33 ? 'calm 🟢' : demand < 66 ? 'busy 🟡' : 'congested 🔴';

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        {step === 0 && (
          <>
            <h3 className="scene-heading">Gas fees</h3>
            <p className="scene-paragraph">
              Every action on Ethereum costs <strong>gas</strong> ⛽ — a fee that pays the validators
              who process it and stops spam. It has two parts: a <strong>base fee</strong> 🔥 set by
              the network (and burned), plus a <strong>priority fee</strong> 🎁 — a tip to the
              validator 👷 to include you faster. Drag the tip.
            </p>
            <div className="diagram diagram--gas">
              <div className="gas-tx">📝 Transaction</div>
              <span className="io-arrow">→</span>
              <div className="gas-breakdown">
                <div className="gas-row">🔥 Base fee <span>{BASE} gwei</span></div>
                <div className="gas-row">🎁 Priority fee <span>{priority} gwei</span></div>
                <div className="gas-row gas-row--total">⛽ Total <span>{total} gwei</span></div>
                <div className="gas-bar">
                  <div className="gas-bar-base" style={{ flex: BASE }} />
                  <div className="gas-bar-tip" style={{ flex: priority || 0.001 }} />
                </div>
                <div className="muted">Validator 👷 gets the tip · speed: {speed}</div>
              </div>
            </div>
            <div className="scene-controls" onClick={stop}>
              <input type="range" min={0} max={12} value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
              <span className="muted">Priority fee (tip)</span>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="scene-heading">When everyone wants in at once</h3>
            <p className="scene-paragraph">
              Each block has limited space. When a popular smart contract 📄 is flooded with requests
              at the same time, everyone competes — so the base fee automatically{' '}
              <strong>rises</strong> until demand cools. That’s why gas spikes during busy moments
              (a hot NFT mint, a market crash). Drag the demand up.
            </p>
            <div className="diagram diagram--congest">
              <div className="congest-queue">
                {Array.from({ length: pending }, (_, i) => (
                  <span key={i} className="congest-req fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                    📝
                  </span>
                ))}
                <span className="congest-contract">📄</span>
              </div>
              <div className="congest-meter">
                <div className="gas-bar">
                  <div className="gas-bar-tip" style={{ width: `${Math.min(100, (congestedBase / 110) * 100)}%` }} />
                </div>
                <div className="congest-price">⛽ base fee ≈ {congestedBase} gwei · {busy}</div>
              </div>
            </div>
            <div className="scene-controls" onClick={stop}>
              <input type="range" min={0} max={100} value={demand} onChange={(e) => setDemand(Number(e.target.value))} />
              <span className="muted">Network demand</span>
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
