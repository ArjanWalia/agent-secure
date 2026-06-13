import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 4.6 · "The full journey" — one interactive slider diagram tying every
//   transaction component together (no keys/addresses):
//   Wallet A → Mempool → Validator/Block → Wallet B. Drag to follow the money.
// ===========================================================================

const STEP_COUNT = 1;

// Waypoints (x%, y%) the money travels through.
const STOPS = [
  { x: 8, y: 45, emoji: '👛', label: 'Wallet A' },
  { x: 30, y: 45, emoji: '🕓', label: 'Mempool' },
  { x: 50, y: 45, emoji: '👷🧱', label: 'Validator → block' },
  { x: 71, y: 45, emoji: '📄', label: 'Smart contract' },
  { x: 92, y: 45, emoji: '👛', label: 'Wallet B' },
];

function pos(t: number) {
  const segs = STOPS.length - 1; // 3
  const scaled = Math.min(t * segs, segs - 1e-6);
  const i = Math.floor(scaled);
  const u = scaled - i;
  return {
    x: STOPS[i].x + (STOPS[i + 1].x - STOPS[i].x) * u,
    y: STOPS[i].y + (STOPS[i + 1].y - STOPS[i].y) * u,
    seg: i,
  };
}

const CAPTIONS = [
  'Wallet A broadcasts the transaction — it heads to the mempool.',
  'The transaction waits in the mempool with everyone else’s.',
  'A validator picks it and packs it into a block.',
  'As the block runs, the smart contract 📄 executes the transfer.',
  'The funds arrive in Wallet B. ✅',
];

export function LessonTxJourney({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [s, setS] = useState(0);
  const stop = (e: MouseEvent) => e.stopPropagation();

  const t = s / 100;
  const m = pos(t);
  // Which stop is "active" — used for highlighting and the caption.
  const active = t >= 0.97 ? STOPS.length - 1 : m.seg;

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        <h3 className="scene-heading">The full journey of a transaction</h3>
        <p className="scene-paragraph">
          Here’s every piece working together: a payment leaves Wallet A, waits in the mempool, gets
          packed into a block by a validator, and lands in Wallet B. Drag to follow the money.
        </p>

        <div className="diagram diagram--journey">
          <svg className="diagram-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            {STOPS.slice(0, -1).map((p, i) => (
              <line key={i} x1={p.x} y1={p.y} x2={STOPS[i + 1].x} y2={STOPS[i + 1].y} stroke="var(--border)" strokeWidth="0.7" />
            ))}
          </svg>
          {STOPS.map((p, i) => (
            <div
              key={i}
              className={i === active ? 'journey-stop journey-stop--hot' : 'journey-stop'}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <span className="journey-emoji">{p.emoji}</span>
              <span className="journey-label">{p.label}</span>
            </div>
          ))}
          <span className="journey-money" style={{ left: `${m.x}%`, top: `${m.y - 14}%`, opacity: t > 0 ? 1 : 0.3 }}>
            💵
          </span>
        </div>

        <p key={active} className="arch-caption fade-in">
          {CAPTIONS[active]}
        </p>

        <div className="scene-controls" onClick={stop}>
          <input type="range" min={0} max={100} value={s} onChange={(e) => setS(Number(e.target.value))} />
          <span className="muted">{t >= 0.97 ? 'Delivered ✓' : 'Follow the transaction'}</span>
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
