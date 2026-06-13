import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 4.4 · "The mempool" — one interactive page.
//   Signed transactions wait in the mempool (a shared waiting room across nodes)
//   until a validator picks them — higher-tip ones first — into the next block.
//   Add transactions and let a validator pull the top tips into a block.
// ===========================================================================

const STEP_COUNT = 1;

interface Tx {
  id: number;
  tip: number;
}
let counter = 0;
const randTip = () => Math.floor(Math.random() * 9) + 1;

export function LessonMempool({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [pool, setPool] = useState<Tx[]>(() => [
    { id: ++counter, tip: 3 },
    { id: ++counter, tip: 7 },
    { id: ++counter, tip: 1 },
  ]);
  const [block, setBlock] = useState<Tx[]>([]);
  const stop = (e: MouseEvent) => e.stopPropagation();

  // Sort the pool so the highest tips sit at the front.
  const sorted = [...pool].sort((a, b) => b.tip - a.tip);

  function addTx() {
    setPool((p) => [...p, { id: ++counter, tip: randTip() }]);
  }
  // A validator pulls the top-tip transactions into the next block.
  function mineBlock() {
    const chosen = sorted.slice(0, 3);
    const ids = new Set(chosen.map((t) => t.id));
    setBlock(chosen);
    setPool((p) => p.filter((t) => !ids.has(t.id)));
  }

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        <h3 className="scene-heading">The mempool</h3>
        <p className="scene-paragraph">
          Once a transaction is signed and broadcast, it doesn’t go straight into the blockchain. It
          waits in the <strong>mempool</strong> — a shared “waiting room” every node keeps. Validators
          pick transactions from it (usually the highest tips 🎁 first) to build the next block 🧱.
          Add some and mine a block.
        </p>

        <div className="diagram diagram--mempool">
          <div className="mempool-pool">
            <div className="mempool-head">🕓 Mempool ({pool.length} waiting)</div>
            <div className="mempool-list">
              {sorted.map((t) => (
                <span key={t.id} className="mempool-tx fade-in">
                  📝 tip {t.tip} 🎁
                </span>
              ))}
              {pool.length === 0 && <span className="muted">empty — all included</span>}
            </div>
          </div>

          <span className="io-arrow">validator 👷 →</span>

          <div className="mempool-block">
            <div className="mempool-head">🧱 Next block</div>
            <div className="mempool-list">
              {block.map((t) => (
                <span key={t.id} className="mempool-tx mempool-tx--in fade-in">
                  📝 tip {t.tip} 🎁
                </span>
              ))}
              {block.length === 0 && <span className="muted">not mined yet</span>}
            </div>
          </div>
        </div>

        <div className="scene-controls" onClick={stop}>
          <button className="btn btn--ghost btn--sm" onClick={addTx}>
            ➕ Broadcast a transaction
          </button>
          <button className="btn btn--primary btn--sm" onClick={mineBlock} disabled={pool.length === 0}>
            Mine block (top tips) ⛏️
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
