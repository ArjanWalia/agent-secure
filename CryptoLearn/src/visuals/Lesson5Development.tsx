import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 5 · "Ethereum development" — one big interactive page, two sections.
//   §1  Token creation — a smart contract mints a token you can grow.
//   §2  The complete flow of value: contract → token → A → contract → B, around
//       the world, with flashing connections (money moving globally, fast).
// ===========================================================================

const STEP_COUNT = 2;

// §2 waypoints (percent coords) around a globe: contract → A → contract → B.
const FLOW = [
  { x: 14, y: 32, emoji: '📄', label: 'Contract' },
  { x: 40, y: 76, emoji: '🧑', label: 'Person A' },
  { x: 64, y: 24, emoji: '📄', label: 'Contract' },
  { x: 88, y: 72, emoji: '👩', label: 'Person B' },
];

function flowPos(t: number) {
  const segs = FLOW.length - 1; // 3
  const scaled = Math.min(t * segs, segs - 1e-6);
  const i = Math.floor(scaled);
  const u = scaled - i;
  const a = FLOW[i];
  const b = FLOW[i + 1];
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
}

export function Lesson5Development({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [minted, setMinted] = useState(0); // §1 tokens minted (0..8)
  const [flow, setFlow] = useState(0); // §2 slider 0..100
  const stop = (e: MouseEvent) => e.stopPropagation();
  const token = flowPos(flow / 100);

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        {step === 0 && (
          <>
            <h3 className="scene-heading">Creating a token</h3>
            <p className="scene-paragraph">
              On Ethereum you can create your own currency by deploying a smart contract 📄 (an
              <strong> ERC-20</strong> contract). It defines the token’s name, supply, and rules —
              then mints 🪙 and tracks who owns what. Mint some tokens.
            </p>
            <div className="diagram diagram--mint">
              <div className="mint-contract">
                📄
                <code>MyToken (MTK)</code>
              </div>
              <span className="io-arrow">→</span>
              <div className="mint-tokens">
                {minted === 0 ? (
                  <span className="muted">no tokens yet</span>
                ) : (
                  Array.from({ length: minted }, (_, i) => (
                    <span key={i} className="fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                      🪙
                    </span>
                  ))
                )}
              </div>
            </div>
            <div className="scene-controls" onClick={stop}>
              <button
                className="btn btn--primary btn--sm"
                onClick={() => setMinted((m) => Math.min(m + 1, 8))}
                disabled={minted >= 8}
              >
                Mint 🪙
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => setMinted(0)}>
                Reset
              </button>
              <span className="muted">Supply: {minted} MTK</span>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="scene-heading">The complete flow of value</h3>
            <p className="scene-paragraph">
              Here’s the full journey: a smart contract 📄 issues a token, person A 🧑 receives it,
              sends it through another contract 📄, and it arrives at person B 👩 — anywhere on Earth,
              in seconds. The flashing links are value moving across the global network. Drag to
              follow the money.
            </p>
            <div className="diagram diagram--flow">
              <span className="globe globe--bg">🌍</span>
              <svg className="diagram-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                {FLOW.slice(0, -1).map((p, i) => (
                  <line
                    key={`b${i}`}
                    x1={p.x}
                    y1={p.y}
                    x2={FLOW[i + 1].x}
                    y2={FLOW[i + 1].y}
                    stroke="var(--border)"
                    strokeWidth="0.6"
                  />
                ))}
                {FLOW.slice(0, -1).map((p, i) => (
                  <line
                    key={`f${i}`}
                    x1={p.x}
                    y1={p.y}
                    x2={FLOW[i + 1].x}
                    y2={FLOW[i + 1].y}
                    className="net-flow"
                    stroke="var(--purple)"
                    strokeWidth="1"
                    style={{ animationDuration: '0.7s', animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </svg>
              {FLOW.map((p, i) => (
                <span key={i} className="flow-stop" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                  <span className="flow-emoji">{p.emoji}</span>
                  <span className="flow-label">{p.label}</span>
                </span>
              ))}
              <span className="flow-token" style={{ left: `${token.x}%`, top: `${token.y}%` }}>
                🪙
              </span>
            </div>
            <div className="scene-controls" onClick={stop}>
              <input
                type="range"
                min={0}
                max={100}
                value={flow}
                onChange={(e) => setFlow(Number(e.target.value))}
              />
              <span className="muted">{flow >= 99 ? 'Delivered to B ✓' : 'Drag to follow the money'}</span>
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
