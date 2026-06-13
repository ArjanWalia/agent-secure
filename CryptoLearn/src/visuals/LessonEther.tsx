import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 2.3 · "Ether (ETH)" — one interactive page, two sections.
//   §1  What Ether is — the fuel ⛽ that powers Ethereum; pay gas to run an action.
//   §2  How it became popular — a year slider growing an adoption bar chart.
// ===========================================================================

const STEP_COUNT = 2;

// Adoption index per year (illustrative, increasing) for the §2 bar chart.
const ADOPTION = [
  { year: 2015, v: 4 },
  { year: 2017, v: 22 },
  { year: 2019, v: 55 },
  { year: 2021, v: 150 },
  { year: 2023, v: 230 },
  { year: 2024, v: 300 },
];
const MAX_V = 300;

export function LessonEther({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [ran, setRan] = useState(false); // §1 paid gas & ran?
  const [yearIdx, setYearIdx] = useState(0); // §2 index into ADOPTION
  const stop = (e: MouseEvent) => e.stopPropagation();

  const current = ADOPTION[yearIdx];
  const crowd = Math.min(8, Math.round(current.v / 40) + 1);

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        {step === 0 && (
          <>
            <h3 className="scene-heading">What is Ether?</h3>
            <p className="scene-paragraph">
              <strong>Ether (ETH)</strong> 💎 is Ethereum’s native coin — and its fuel ⛽. Every
              transaction or smart-contract action costs a small amount of ETH called{' '}
              <strong>gas</strong>. No ETH, no action. Pay the gas to run one.
            </p>
            <div className="diagram diagram--fuel">
              <span className="fuel-emoji">💎</span>
              <span className="io-arrow">→</span>
              <span className="fuel-pump">⛽</span>
              <span className="io-arrow">→</span>
              <span className={ran ? 'fuel-action fuel-action--run' : 'fuel-action'}>
                {ran ? '⚙️✅' : '⚙️'}
              </span>
            </div>
            <div className="scene-controls" onClick={stop}>
              <button className="btn btn--primary btn--sm" onClick={() => setRan((r) => !r)}>
                {ran ? 'Reset' : 'Pay gas & run ⛽'}
              </button>
              <span className="muted">{ran ? 'Action executed — gas paid in ETH' : 'Costs a little ETH'}</span>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="scene-heading">How Ether became popular</h3>
            <p className="scene-paragraph">
              Thousands of apps — tokens, NFTs, exchanges, games — are built on Ethereum, and every
              one of them needs ETH for gas. More apps and users meant more demand for Ether. Drag
              through the years to watch adoption grow.
            </p>
            <div className="diagram diagram--chart">
              <div className="chart-bars">
                {ADOPTION.map((d, i) => (
                  <div className="chart-col" key={d.year}>
                    <div
                      className="chart-bar"
                      style={{ height: i <= yearIdx ? `${(d.v / MAX_V) * 100}%` : '0%' }}
                    />
                    <span className="chart-year">{d.year}</span>
                  </div>
                ))}
              </div>
              <div className="chart-crowd">
                {Array.from({ length: crowd }, (_, i) => (
                  <span key={i} className="fade-in">👤</span>
                ))}
                <span className="muted">growing community 📈</span>
              </div>
            </div>
            <div className="scene-controls" onClick={stop}>
              <input
                type="range"
                min={0}
                max={ADOPTION.length - 1}
                value={yearIdx}
                onChange={(e) => setYearIdx(Number(e.target.value))}
              />
              <span className="muted">{current.year} · adoption rising</span>
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
