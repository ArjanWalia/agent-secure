import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 1 · "What is a blockchain?" — one big page, five sections.
//
// The user CLICKS ANYWHERE to advance to the next section (no Next button).
// A "Previous" button steps back. Every symbol is an emoji and every section
// has an interactive diagram (slider / button). On the last section, "Continue"
// finishes the lesson (→ next lesson) and "Back" goes to the previous lesson.
// ===========================================================================

const STEP_COUNT = 5;

// Quadratic bézier helper for the money path (percentage coordinates).
function quad(p0: number[], p1: number[], p2: number[], u: number): number[] {
  const v = 1 - u;
  return [
    v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0],
    v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1],
  ];
}

export function Lesson1Blockchain({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);

  // Per-diagram interactive state.
  const [pay, setPay] = useState(0); // §1 slider 0..100 (money A→bank→B)
  const [decent, setDecent] = useState(0); // §2 slider 0..100 (dissolve bank)
  const [blocks, setBlocks] = useState(3); // §3 slider 1..6 (chain length)
  const [ledgerRows, setLedgerRows] = useState(1); // §4 shared-ledger entries
  const [combo, setCombo] = useState(0); // §5 slider 0..100 (replay)

  // Stop clicks on interactive controls from advancing the page.
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        {step === 0 && <SectionTransactions pay={pay} setPay={setPay} stop={stop} />}
        {step === 1 && <SectionBlockchain decent={decent} setDecent={setDecent} stop={stop} />}
        {step === 2 && <SectionBlocks blocks={blocks} setBlocks={setBlocks} stop={stop} />}
        {step === 3 && (
          <SectionLedger rows={ledgerRows} addRow={() => setLedgerRows((r) => Math.min(r + 1, 6))} stop={stop} />
        )}
        {step === 4 && <SectionCombo combo={combo} setCombo={setCombo} stop={stop} />}
      </div>

      {/* Bottom controls */}
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

      {/* Section progress dots */}
      <div className="scene-progress" onClick={stop}>
        {Array.from({ length: STEP_COUNT }, (_, i) => (
          <span key={i} className={i === step ? 'q-dot q-dot--current' : i < step ? 'q-dot q-dot--done' : 'q-dot'} />
        ))}
      </div>
    </div>
  );
}

// --- §1 How transactions used to be -------------------------------------
function SectionTransactions({
  pay,
  setPay,
  stop,
}: {
  pay: number;
  setPay: (n: number) => void;
  stop: (e: MouseEvent) => void;
}) {
  const t = pay / 100;
  const A = [12, 34];
  const C1 = [32, 86];
  const BANK = [50, 74];
  const C2 = [68, 86];
  const B = [88, 34];
  const [x, y] = t <= 0.5 ? quad(A, C1, BANK, t / 0.5) : quad(BANK, C2, B, (t - 0.5) / 0.5);
  let opacity = 1;
  if (t > 0.43 && t <= 0.5) opacity = (0.5 - t) / 0.07;
  else if (t > 0.5 && t < 0.57) opacity = (t - 0.5) / 0.07;
  opacity = Math.max(0, Math.min(1, opacity));

  return (
    <>
      <h3 className="scene-heading">How transactions used to be</h3>
      <p className="scene-paragraph">
        Before blockchain, sending money online meant trusting a middleman — a bank 🏦 — to confirm
        and record every payment 💵 between you 🧑 and someone else 👩.
      </p>
      <div className="diagram">
        <svg className="diagram-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M16 36 Q32 82 48 72" fill="none" stroke="var(--border)" strokeWidth="0.6" />
          <path d="M52 72 Q68 82 84 36" fill="none" stroke="var(--border)" strokeWidth="0.6" />
        </svg>
        <span className="diagram-emoji" style={{ left: '12%', top: '34%' }}>🧑</span>
        <span className="diagram-emoji" style={{ left: '50%', top: '74%' }}>🏦</span>
        <span className="diagram-emoji" style={{ left: '88%', top: '34%' }}>👩</span>
        <span className="diagram-emoji" style={{ left: `${x}%`, top: `${y}%`, opacity, fontSize: 30 }}>
          💵
        </span>
      </div>
      <div className="scene-controls" onClick={stop}>
        <input type="range" min={0} max={100} value={pay} onChange={(e) => setPay(Number(e.target.value))} />
        <span className="muted">{pay >= 99 ? 'Delivered ✓' : 'Drag to send 💵'}</span>
      </div>
    </>
  );
}

// --- §2 What blockchain did ---------------------------------------------
function SectionBlockchain({
  decent,
  setDecent,
  stop,
}: {
  decent: number;
  setDecent: (n: number) => void;
  stop: (e: MouseEvent) => void;
}) {
  const d = decent / 100;
  const nodes = [
    [35, 30],
    [65, 30],
    [35, 70],
    [65, 70],
    [50, 50],
  ];
  return (
    <>
      <h3 className="scene-heading">What blockchain did</h3>
      <p className="scene-paragraph">
        Blockchain removed the middleman. Instead of one bank, a whole network of computers 💻 agrees
        on what happened. Drag to dissolve the bank 🏦 and form the network.
      </p>
      <div className="diagram">
        <svg className="diagram-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {nodes.flatMap((n, i) =>
            nodes.slice(i + 1).map((m, j) => (
              <line
                key={`${i}-${j}`}
                x1={n[0]}
                y1={n[1]}
                x2={m[0]}
                y2={m[1]}
                stroke="var(--aqua)"
                strokeWidth="0.5"
                opacity={d}
              />
            )),
          )}
        </svg>
        <span className="diagram-emoji" style={{ left: '8%', top: '50%' }}>🧑</span>
        <span className="diagram-emoji" style={{ left: '92%', top: '50%' }}>👩</span>
        <span className="diagram-emoji" style={{ left: '50%', top: '50%', opacity: 1 - d }}>🏦</span>
        {nodes.map((n, i) => (
          <span key={i} className="diagram-emoji" style={{ left: `${n[0]}%`, top: `${n[1]}%`, opacity: d, fontSize: 28 }}>
            💻
          </span>
        ))}
      </div>
      <div className="scene-controls" onClick={stop}>
        <input type="range" min={0} max={100} value={decent} onChange={(e) => setDecent(Number(e.target.value))} />
        <span className="muted">{decent >= 99 ? 'Decentralized ✓' : 'Drag to decentralize'}</span>
      </div>
    </>
  );
}

// --- §3 Blocks and chains -----------------------------------------------
function SectionBlocks({
  blocks,
  setBlocks,
  stop,
}: {
  blocks: number;
  setBlocks: (n: number) => void;
  stop: (e: MouseEvent) => void;
}) {
  return (
    <>
      <h3 className="scene-heading">Blocks and chains</h3>
      <p className="scene-paragraph">
        Payments are bundled into blocks 🧱, and each block links to the one before it 🔗 — forming a
        chain. Drag to add blocks and grow the chain.
      </p>
      <div className="diagram">
        <div className="blocks-row">
          {Array.from({ length: blocks }, (_, i) => (
            <span key={i} className="block-item fade-in">
              {i > 0 && <span className="block-link">🔗</span>}
              <span className="block-brick">🧱</span>
            </span>
          ))}
        </div>
      </div>
      <div className="scene-controls" onClick={stop}>
        <input type="range" min={1} max={6} value={blocks} onChange={(e) => setBlocks(Number(e.target.value))} />
        <span className="muted">{blocks} block{blocks > 1 ? 's' : ''} chained</span>
      </div>
    </>
  );
}

// --- §4 The ledger -------------------------------------------------------
function SectionLedger({
  rows,
  addRow,
  stop,
}: {
  rows: number;
  addRow: () => void;
  stop: (e: MouseEvent) => void;
}) {
  return (
    <>
      <h3 className="scene-heading">The ledger</h3>
      <p className="scene-paragraph">
        Every computer 💻 keeps the same copy of the ledger 📒. Add a transaction and watch all
        copies update identically — so no one can secretly cheat.
      </p>
      <div className="diagram diagram--ledgers">
        {[0, 1, 2].map((n) => (
          <div className="ledger" key={n}>
            <div className="ledger-head">💻 📒 Node {n + 1}</div>
            {Array.from({ length: rows }, (_, i) => (
              <div className="ledger-row fade-in" key={i}>
                🧑 → 👩 💵
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="scene-controls" onClick={stop}>
        <button className="btn btn--primary btn--sm" onClick={addRow}>
          ➕ Add transaction
        </button>
        <span className="muted">{rows} identical entr{rows > 1 ? 'ies' : 'y'} on every node</span>
      </div>
    </>
  );
}

// --- §5 Putting it all together -----------------------------------------
function SectionCombo({
  combo,
  setCombo,
  stop,
}: {
  combo: number;
  setCombo: (n: number) => void;
  stop: (e: MouseEvent) => void;
}) {
  const c = combo / 100;
  const blockCount = 1 + Math.floor(c * 4); // 1..5 as you scrub
  const moneyX = 14 + c * 72; // 14% → 86%
  const nodes = [30, 50, 70];
  return (
    <>
      <h3 className="scene-heading">Putting it all together</h3>
      <p className="scene-paragraph">
        All together: people send value 💵 directly, transactions group into linked blocks 🧱🔗, and
        every node 💻 stores the same ledger 📒 — trust without a middleman. Drag to replay.
      </p>
      <div className="diagram">
        {/* chain growing on top */}
        <div className="blocks-row blocks-row--top">
          {Array.from({ length: blockCount }, (_, i) => (
            <span key={i} className="block-item">
              {i > 0 && <span className="block-link">🔗</span>}
              <span className="block-brick">🧱</span>
            </span>
          ))}
        </div>
        {/* network + money on the bottom */}
        <span className="diagram-emoji" style={{ left: '8%', top: '70%' }}>🧑</span>
        <span className="diagram-emoji" style={{ left: '92%', top: '70%' }}>👩</span>
        {nodes.map((n) => (
          <span key={n} className="diagram-emoji" style={{ left: `${n}%`, top: '70%', fontSize: 26 }}>
            💻📒
          </span>
        ))}
        <span className="diagram-emoji" style={{ left: `${moneyX}%`, top: '52%', fontSize: 30 }}>
          💵
        </span>
      </div>
      <div className="scene-controls" onClick={stop}>
        <input type="range" min={0} max={100} value={combo} onChange={(e) => setCombo(Number(e.target.value))} />
        <span className="muted">Replay the full flow</span>
      </div>
    </>
  );
}
