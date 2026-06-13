import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 4 · "Smart contracts" — one big interactive page, three sections.
//   §1  What a smart contract is — an if/then "vending machine" you can trigger.
//   §2  How they're deployed onto Ethereum — write → deploy → lives on nodes.
//   §3  Why they matter — clickable use-cases around a central contract.
// ===========================================================================

const STEP_COUNT = 3;

// §3 "world" diagram: wallets at the endpoints, computers in the middle, links
// between them, and contracts executing along some of the links.
const WALLETS = [
  { x: 8, y: 24 },
  { x: 8, y: 76 },
  { x: 92, y: 24 },
  { x: 92, y: 76 },
];
const COMPUTERS = [
  { x: 34, y: 40 },
  { x: 50, y: 66 },
  { x: 66, y: 40 },
  { x: 50, y: 26 },
];
// Links as [from, to] point pairs (wallet↔computer and computer↔computer).
const LINKS: { a: { x: number; y: number }; b: { x: number; y: number } }[] = [
  { a: WALLETS[0], b: COMPUTERS[0] },
  { a: WALLETS[1], b: COMPUTERS[1] },
  { a: WALLETS[2], b: COMPUTERS[2] },
  { a: WALLETS[3], b: COMPUTERS[1] },
  { a: COMPUTERS[0], b: COMPUTERS[3] },
  { a: COMPUTERS[2], b: COMPUTERS[3] },
  { a: COMPUTERS[0], b: COMPUTERS[1] },
  { a: COMPUTERS[2], b: COMPUTERS[1] },
];
// Put a contract on a subset of links (at their midpoints).
const CONTRACT_LINKS = [0, 2, 4, 5, 6];

export function Lesson4Contracts({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [paid, setPaid] = useState(false); // §1 condition met?
  const [deployed, setDeployed] = useState(false); // §2 deployed on-chain?
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        {step === 0 && (
          <>
            <h3 className="scene-heading">What is a smart contract?</h3>
            <p className="scene-paragraph">
              A <strong>smart contract</strong> is a program stored on Ethereum that runs exactly as
              written — automatically, with no middleman. Think of a digital vending machine 🤖: meet
              the condition, get the result. Try it.
            </p>
            <div className="diagram diagram--contract">
              <div className="contract-io">
                <span className="io-emoji">{paid ? '🪙' : '🙂'}</span>
                <span className="io-label">{paid ? 'Paid 1 ETH' : 'No payment'}</span>
              </div>
              <span className="io-arrow">→</span>
              <div className="contract-box">
                📄
                <code>
                  if (paid ≥ 1 ETH)
                  <br />
                  &nbsp;&nbsp;release 🎟️
                </code>
              </div>
              <span className="io-arrow">→</span>
              <div className="contract-io">
                <span className="io-emoji">{paid ? '🎟️' : '🔒'}</span>
                <span className="io-label">{paid ? 'Ticket released' : 'Locked'}</span>
              </div>
            </div>
            <div className="scene-controls" onClick={stop}>
              <button className="btn btn--primary btn--sm" onClick={() => setPaid((p) => !p)}>
                {paid ? 'Reset' : 'Pay 1 ETH 🪙'}
              </button>
              <span className="muted">The contract runs itself when the condition is met</span>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="scene-heading">How they live on Ethereum</h3>
            <p className="scene-paragraph">
              You write the contract’s code 📝, then <strong>deploy</strong> it. It gets its own
              address on the blockchain and a copy lives on every node 💻 — permanent and
              unchangeable. Deploy it to see.
            </p>
            <div className="diagram diagram--deploy">
              {!deployed ? (
                <div className="deploy-code fade-in">📝 contract code</div>
              ) : (
                <div className="deploy-result fade-in">
                  <div className="deploy-addr">📄 deployed at 0xA1b2…C3d4</div>
                  <div className="deploy-nodes">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className="fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                        💻📄
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="scene-controls" onClick={stop}>
              <button className="btn btn--primary btn--sm" onClick={() => setDeployed((d) => !d)}>
                {deployed ? 'Reset' : 'Deploy contract ⬇️'}
              </button>
              <span className="muted">
                {deployed ? 'Copied to every node — immutable' : 'Send the code on-chain'}
              </span>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="scene-heading">Why they matter</h3>
            <p className="scene-paragraph">
              Smart contracts let strangers transact without trusting each other or a middleman.
              Across the world, wallets 👛 connect through computers 💻, and contracts 📄 run their
              code right on the connections — value and logic flowing everywhere, automatically.
            </p>
            <div className="diagram diagram--world">
              <span className="globe globe--bg">🌍</span>
              <svg className="diagram-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                {LINKS.map((l, i) => (
                  <line
                    key={`b${i}`}
                    x1={l.a.x}
                    y1={l.a.y}
                    x2={l.b.x}
                    y2={l.b.y}
                    stroke="var(--border)"
                    strokeWidth="0.5"
                  />
                ))}
                {LINKS.map((l, i) => (
                  <line
                    key={`f${i}`}
                    x1={l.a.x}
                    y1={l.a.y}
                    x2={l.b.x}
                    y2={l.b.y}
                    className="net-flow"
                    stroke="var(--aqua)"
                    strokeWidth="0.8"
                    style={{ animationDuration: '0.8s', animationDelay: `${(i % 4) * 0.15}s` }}
                  />
                ))}
              </svg>
              {WALLETS.map((w, i) => (
                <span key={`w${i}`} className="world-emoji world-wallet" style={{ left: `${w.x}%`, top: `${w.y}%` }}>
                  👛
                </span>
              ))}
              {COMPUTERS.map((c, i) => (
                <span key={`c${i}`} className="world-emoji world-node" style={{ left: `${c.x}%`, top: `${c.y}%` }}>
                  💻
                </span>
              ))}
              {CONTRACT_LINKS.map((li) => {
                const l = LINKS[li];
                const mx = (l.a.x + l.b.x) / 2;
                const my = (l.a.y + l.b.y) / 2;
                return (
                  <span
                    key={`k${li}`}
                    className="world-contract"
                    style={{ left: `${mx}%`, top: `${my}%`, animationDelay: `${(li % 3) * 0.3}s` }}
                  >
                    📄
                  </span>
                );
              })}
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
