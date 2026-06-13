import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 2.2 · "Bitcoin" — one interactive page, two sections.
//   §1  The unknown creator (Satoshi) + why Bitcoin was created.
//   §2  How Bitcoin gained value — a time slider + the Bitcoin blockchain,
//       scarcity (21M cap) and rising price.
// ===========================================================================

const STEP_COUNT = 2;

// Rough historical price milestones (USD) for the interactive timeline.
const YEARS = [2009, 2011, 2013, 2015, 2017, 2019, 2021, 2023, 2024];
const PRICES = [0, 5, 130, 250, 13000, 7000, 47000, 30000, 65000];

function priceAt(year: number): number {
  if (year <= YEARS[0]) return PRICES[0];
  if (year >= YEARS[YEARS.length - 1]) return PRICES[PRICES.length - 1];
  for (let i = 0; i < YEARS.length - 1; i++) {
    if (year >= YEARS[i] && year <= YEARS[i + 1]) {
      const u = (year - YEARS[i]) / (YEARS[i + 1] - YEARS[i]);
      return Math.round(PRICES[i] + (PRICES[i + 1] - PRICES[i]) * u);
    }
  }
  return 0;
}

export function LessonBitcoin({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [revealed, setRevealed] = useState(false); // §1 "reveal" identity
  const [year, setYear] = useState(2009); // §2 timeline
  const stop = (e: MouseEvent) => e.stopPropagation();

  const price = priceAt(year);
  const mined = Math.min(21, (year - 2008) * 1.25); // ≈ millions in circulation
  const blocks = Math.max(1, Math.round((year - 2008) / 2.2)); // chain grows

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        {step === 0 && (
          <>
            <h3 className="scene-heading">The mysterious creator</h3>
            <p className="scene-paragraph">
              In 2008, an anonymous person (or group) called <strong>Satoshi Nakamoto</strong> 🕵️
              published the Bitcoin whitepaper. After the 2008 financial crisis shook trust in banks
              🏦, the goal was simple: money no bank or government controls — peer-to-peer, run by
              everyone. To this day, nobody knows who Satoshi really is.
            </p>
            <div className="diagram diagram--satoshi">
              <span className={revealed ? 'satoshi satoshi--shake' : 'satoshi'}>🕵️</span>
              <div className="satoshi-name">{revealed ? '🤷 Identity: still unknown' : 'Satoshi Nakamoto'}</div>
            </div>
            <div className="scene-controls" onClick={stop}>
              <button className="btn btn--primary btn--sm" onClick={() => setRevealed((r) => !r)}>
                {revealed ? 'Hide' : 'Reveal identity 🔍'}
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="scene-heading">How Bitcoin gained value</h3>
            <p className="scene-paragraph">
              Bitcoin is <strong>scarce</strong> — only 21 million ₿ will ever exist. As more people
              trusted and adopted it, demand for that fixed supply pushed the price up. Many now call
              it “digital gold” 🥇. Drag through the years.
            </p>
            <div className="diagram diagram--btc">
              <div className="btc-year">📅 {year}</div>
              <div className="btc-price">
                ₿ ≈ ${price.toLocaleString()} <span className="btc-trend">📈</span>
              </div>
              <div className="btc-supply">
                <div className="btc-supply-bar">
                  <div className="btc-supply-fill" style={{ width: `${(mined / 21) * 100}%` }} />
                </div>
                <span className="muted">≈ {mined.toFixed(1)} / 21M ₿ mined</span>
              </div>
              <div className="chain-row-sm btc-chain">
                {Array.from({ length: Math.min(blocks, 8) }, () => '🧱🔗').join('').slice(0, -1) || '🧱'}
              </div>
            </div>
            <div className="scene-controls" onClick={stop}>
              <input
                type="range"
                min={2009}
                max={2024}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
              <span className="muted">Bitcoin blockchain since 2009</span>
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
