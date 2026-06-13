import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 4.3 · "How transactions move through smart contracts" — one page.
//   A transaction calls a contract function; the EVM runs the code line by
//   line; state changes and a result comes out. Step through it.
// ===========================================================================

const STEP_COUNT = 1;

const CODE = [
  'function transfer(to, amt) {',
  '  require(bal[A] >= amt);',
  '  bal[A] -= amt;',
  '  bal[B] += amt;',
  '  emit Transfer(A, to); }',
];

// Which code line each phase highlights, plus a caption.
const PHASES = [
  { line: 0, cap: '📝 A transaction calls the contract: transfer(B, 1). The EVM activates the code.' },
  { line: 1, cap: '✅ require check passes — A has enough balance to send.' },
  { line: 2, cap: 'A’s balance is reduced: 5 → 4 ETH.' },
  { line: 3, cap: 'B’s balance is increased: 3 → 4 ETH.' },
  { line: 4, cap: '📢 A Transfer event is emitted. The new state is final — done ✅.' },
];

export function LessonContractExec({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [phase, setPhase] = useState(0);
  const stop = (e: MouseEvent) => e.stopPropagation();

  const balA = phase >= 2 ? 4 : 5;
  const balB = phase >= 3 ? 4 : 3;

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        <h3 className="scene-heading">How a transaction runs a contract</h3>
        <p className="scene-paragraph">
          A transaction can <strong>call a function</strong> on a smart contract. The EVM ⚙️ runs the
          contract’s code line by line — checking conditions, changing balances, and emitting a
          result. Step through one.
        </p>

        <div className="diagram diagram--exec">
          <div className="exec-call">
            📝<div className="muted">call: transfer(B, 1)</div>
            <span className="exec-arrow">→ ⚙️ EVM</span>
          </div>

          <div className="exec-code">
            {CODE.map((line, i) => (
              <div key={i} className={i === PHASES[phase].line ? 'exec-line exec-line--hot' : 'exec-line'}>
                <code>{line}</code>
              </div>
            ))}
          </div>

          <div className="exec-state">
            <div className="exec-state-head">📒 State</div>
            <div className={phase >= 2 ? 'exec-bal exec-bal--changed' : 'exec-bal'}>🧑 A: {balA} ETH</div>
            <div className={phase >= 3 ? 'exec-bal exec-bal--changed' : 'exec-bal'}>👩 B: {balB} ETH</div>
            {phase >= 4 && <div className="exec-done fade-in">📢 Transfer ✅</div>}
          </div>
        </div>

        <p key={phase} className="arch-caption fade-in">
          {PHASES[phase].cap}
        </p>

        <div className="scene-controls" onClick={stop}>
          <button
            className="btn btn--primary btn--sm"
            onClick={() => setPhase((p) => Math.min(p + 1, PHASES.length - 1))}
            disabled={phase >= PHASES.length - 1}
          >
            Step ▶
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => setPhase(0)}>
            Reset
          </button>
          <span className="muted">Step {phase + 1} of {PHASES.length}</span>
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
