import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 2.5 · "Token standards" — one interactive page, two sections.
//   §1  The rules & why — toggle "follows the standard" to see wallets, apps and
//       exchanges connect (or fail to understand the token).
//   §2  ERC-20 — the standard's required functions; tap each to see what it does.
// ===========================================================================

const STEP_COUNT = 2;

// Peripherals that need to understand a token.
const PERIPHERALS = [
  { emoji: '👛', label: 'Wallet', x: 16, y: 28 },
  { emoji: '💱', label: 'Exchange', x: 84, y: 28 },
  { emoji: '📱', label: 'App', x: 50, y: 86 },
];

const ERC20 = [
  { fn: 'totalSupply()', desc: 'How many tokens exist in total.' },
  { fn: 'balanceOf(addr)', desc: 'How many tokens an address owns.' },
  { fn: 'transfer(to, amt)', desc: 'Send tokens from you to someone else.' },
  { fn: 'approve(spender, amt)', desc: 'Allow another contract to spend your tokens.' },
  { fn: 'transferFrom(from, to, amt)', desc: 'Move approved tokens on someone’s behalf.' },
];

export function LessonTokenStandards({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [compliant, setCompliant] = useState(true); // §1 follows the standard?
  const [picked, setPicked] = useState(0); // §2 selected function
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        {step === 0 && (
          <>
            <h3 className="scene-heading">The rules — and why</h3>
            <p className="scene-paragraph">
              Tokens follow <strong>shared rules</strong> (a “standard”) so every wallet 👛, exchange
              💱, and app 📱 knows how to handle them. Without a common standard, each token would
              speak a different language. Toggle the rules and see what happens.
            </p>
            <div className={compliant ? 'diagram diagram--rules ok' : 'diagram diagram--rules bad'}>
              <svg className="diagram-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                {PERIPHERALS.map((p, i) => (
                  <line
                    key={i}
                    x1="50"
                    y1="50"
                    x2={p.x}
                    y2={p.y}
                    stroke={compliant ? 'var(--aqua)' : 'var(--danger)'}
                    strokeWidth="0.8"
                    strokeDasharray={compliant ? '0' : '3 3'}
                  />
                ))}
              </svg>
              <span className="rules-token">🪙</span>
              {PERIPHERALS.map((p, i) => (
                <span key={i} className="rules-peripheral" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                  <span className="rules-emoji">{p.emoji}</span>
                  <span className="rules-status">{compliant ? '✅' : '❌'}</span>
                </span>
              ))}
            </div>
            <div className="scene-controls" onClick={stop}>
              <button className="btn btn--primary btn--sm" onClick={() => setCompliant((c) => !c)}>
                {compliant ? 'Ignore the rules ❌' : 'Follow the standard ✅'}
              </button>
              <span className="muted">
                {compliant ? 'Everything understands the token' : 'Nothing knows how to read it'}
              </span>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="scene-heading">What is ERC-20?</h3>
            <p className="scene-paragraph">
              <strong>ERC-20</strong> is Ethereum’s most common token standard. A token just has to
              implement these functions — then it works in every wallet and exchange automatically.
              Tap a function.
            </p>
            <div className="diagram diagram--erc20">
              <div className="erc20-box">
                <div className="erc20-head">📄 ERC-20 token</div>
                {ERC20.map((e, i) => (
                  <button
                    key={e.fn}
                    className={i === picked ? 'erc20-fn erc20-fn--active' : 'erc20-fn'}
                    onClick={(ev) => {
                      stop(ev);
                      setPicked(i);
                    }}
                  >
                    <code>{e.fn}</code>
                  </button>
                ))}
              </div>
              <p key={picked} className="erc20-desc fade-in">
                {ERC20[picked].desc}
              </p>
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
