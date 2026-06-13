import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 2.4 · "Stablecoins" — one interactive page, two sections.
//   §1  What a stablecoin is — a coin anchored ⚓ to a real asset ($1). Push the
//       market and watch it stay pegged.
//   §2  Stable vs volatile — two line charts: a flat stablecoin vs a swinging
//       volatile coin, revealed over time.
// ===========================================================================

const STEP_COUNT = 2;

// §2 chart data in SVG coords (viewBox 0 0 100 50; lower y = higher price).
const STABLE = [25, 25, 25, 25, 24, 25, 25, 25, 25];
const VOLATILE = [42, 22, 34, 10, 44, 18, 30, 6, 26];

function LineChart({ values, revealed, color }: { values: number[]; revealed: number; color: string }) {
  const n = values.length;
  const pts = values
    .slice(0, Math.max(2, revealed))
    .map((y, i) => `${(i / (n - 1)) * 100},${y}`)
    .join(' ');
  return (
    <svg className="line-chart" viewBox="0 0 100 50" preserveAspectRatio="none">
      <line x1="0" y1="25" x2="100" y2="25" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 2" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

export function LessonStablecoins({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [pressure, setPressure] = useState(0); // §1 market pressure -100..100
  const [reveal, setReveal] = useState(2); // §2 points revealed
  const stop = (e: MouseEvent) => e.stopPropagation();

  // The peg barely budges no matter the pressure — that's the whole point.
  const price = (1 + (pressure / 100) * 0.02).toFixed(2);

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        {step === 0 && (
          <>
            <h3 className="scene-heading">What is a stablecoin?</h3>
            <p className="scene-paragraph">
              A <strong>stablecoin</strong> is a token designed to hold a steady value by being
              <strong> attached to a real-world asset</strong> — usually the US dollar. 1 USDC ≈ $1,
              always. Push the market and watch it stay pegged ⚓.
            </p>
            <div className="diagram diagram--peg">
              <div className="peg-coin">🪙</div>
              <div className="peg-rope">⚓</div>
              <div className="peg-asset">💵 $1</div>
              <div className="peg-price">1 USDC = ${price}</div>
            </div>
            <div className="scene-controls" onClick={stop}>
              <input
                type="range"
                min={-100}
                max={100}
                value={pressure}
                onChange={(e) => setPressure(Number(e.target.value))}
              />
              <span className="muted">Market pressure — the peg barely moves</span>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="scene-heading">Stable vs. volatile</h3>
            <p className="scene-paragraph">
              Stablecoins stay <strong>flat</strong> — great for spending and saving. Other coins are
              <strong> volatile</strong> — their price swings up and down, which means bigger gains
              but bigger risk. Drag to play the timeline.
            </p>
            <div className="diagram diagram--charts">
              <div className="chart-card">
                <div className="chart-title">💵 Stablecoin (USDC)</div>
                <LineChart values={STABLE} revealed={reveal} color="var(--aqua)" />
                <div className="muted">flat &amp; predictable</div>
              </div>
              <div className="chart-card">
                <div className="chart-title">💎 Volatile (ETH)</div>
                <LineChart values={VOLATILE} revealed={reveal} color="var(--purple)" />
                <div className="muted">swings up &amp; down</div>
              </div>
            </div>
            <div className="scene-controls" onClick={stop}>
              <input
                type="range"
                min={2}
                max={STABLE.length}
                value={reveal}
                onChange={(e) => setReveal(Number(e.target.value))}
              />
              <span className="muted">Timeline</span>
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
