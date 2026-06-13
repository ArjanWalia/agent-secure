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

const USE_CASES = [
  { emoji: '💱', label: 'Exchanges', text: 'Swap one token for another automatically — no broker.' },
  { emoji: '🖼️', label: 'NFTs', text: 'Prove ownership of digital art and collectibles on-chain.' },
  { emoji: '🏦', label: 'Lending', text: 'Borrow and lend crypto with rules enforced by code.' },
  { emoji: '🗳️', label: 'Voting', text: 'Run tamper-proof votes that anyone can verify.' },
  { emoji: '🎮', label: 'Games', text: 'Own in-game items as real, tradable assets.' },
];

export function Lesson4Contracts({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [paid, setPaid] = useState(false); // §1 condition met?
  const [deployed, setDeployed] = useState(false); // §2 deployed on-chain?
  const [pickedCase, setPickedCase] = useState(0); // §3 selected use-case
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
              Smart contracts let strangers transact without trusting each other or a middleman. That
              one idea powers a whole world of apps. Tap a use-case.
            </p>
            <div className="diagram diagram--usecases">
              <div className="usecase-chips">
                {USE_CASES.map((u, i) => (
                  <button
                    key={u.label}
                    className={i === pickedCase ? 'chip chip--active' : 'chip'}
                    onClick={(e) => {
                      stop(e);
                      setPickedCase(i);
                    }}
                  >
                    {u.emoji} {u.label}
                  </button>
                ))}
              </div>
              <p key={pickedCase} className="usecase-text fade-in">
                {USE_CASES[pickedCase].text}
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
