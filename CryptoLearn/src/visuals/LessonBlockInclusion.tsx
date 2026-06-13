import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 4.5 · "Block inclusion & confirmations" — one interactive page.
//   After the mempool, a validator packs the transaction into a block that's
//   added to the chain (inclusion). Each new block on top = one more
//   confirmation, making it harder to reverse.
// ===========================================================================

const STEP_COUNT = 1;

export function LessonBlockInclusion({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [included, setIncluded] = useState(false);
  const [confirmations, setConfirmations] = useState(0);
  const stop = (e: MouseEvent) => e.stopPropagation();

  function include() {
    setIncluded(true);
    setConfirmations(1);
  }
  function reset() {
    setIncluded(false);
    setConfirmations(0);
  }

  const security = confirmations === 0 ? '' : confirmations < 3 ? 'fairly safe 🟡' : 'very safe 🟢';

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        <h3 className="scene-heading">Block inclusion &amp; confirmations</h3>
        <p className="scene-paragraph">
          After waiting in the mempool, a validator 👷 selects your transaction and packs it into a{' '}
          <strong>block</strong> 🧱, which is added to the chain — that’s <strong>inclusion</strong>.
          Every new block added on top is another <strong>confirmation</strong>: the deeper your
          transaction is buried, the harder it becomes to reverse.
        </p>

        <div className="diagram diagram--inclusion">
          {!included ? (
            <div className="incl-pending">
              <div className="mempool-head">🕓 Mempool</div>
              <span className="mempool-tx">📝 your transaction</span>
            </div>
          ) : (
            <div className="incl-chain">
              {Array.from({ length: confirmations }, (_, i) => (
                <span key={i} className="incl-block fade-in">
                  <span className="block-link">{i > 0 ? '🔗' : ''}</span>
                  <span className={i === 0 ? 'incl-brick incl-brick--yours' : 'incl-brick'}>🧱</span>
                  {i === 0 && <span className="incl-tag">your tx</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {included && (
          <p className="arch-caption fade-in" key={confirmations}>
            ✅ {confirmations} confirmation{confirmations > 1 ? 's' : ''} · {security}
          </p>
        )}

        <div className="scene-controls" onClick={stop}>
          {!included ? (
            <button className="btn btn--primary btn--sm" onClick={include}>
              Include in block ⛏️
            </button>
          ) : (
            <>
              <button className="btn btn--primary btn--sm" onClick={() => setConfirmations((c) => c + 1)}>
                Add next block 🧱
              </button>
              <button className="btn btn--ghost btn--sm" onClick={reset}>
                Reset
              </button>
            </>
          )}
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
