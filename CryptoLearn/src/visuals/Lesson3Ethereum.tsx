import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 3 · "Ethereum" — one big interactive page, three sections.
//   §1  The EVM as one global computer — a 🌍 globe with 💻 nodes orbiting it.
//   §2  How to connect — a numbered list + a small wallet→dApp connect diagram.
//   §3  The world state — a live account/balance table you can update.
// Click anywhere to advance; "Previous" fades out and steps back.
// ===========================================================================

const STEP_COUNT = 3;

// §1 — globe with orbiting computer nodes.
function EvmGlobe({ count }: { count: number }) {
  const dur = '16s';
  return (
    <div className="diagram diagram--globe">
      <span className="globe">🌍</span>
      <div className="orbit" style={{ animationDuration: dur }}>
        {Array.from({ length: count }, (_, i) => {
          const a = (2 * Math.PI * i) / count;
          const left = 50 + 40 * Math.cos(a);
          const top = 50 + 40 * Math.sin(a);
          return (
            <span key={i} className="orbit-node" style={{ left: `${left}%`, top: `${top}%` }}>
              <span style={{ animationDuration: dur }}>💻</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

const CONNECT_STEPS = [
  'Get a crypto wallet 👛 (such as MetaMask).',
  'Create or import your account 🔑.',
  'Open an app (a “dApp”) and click “Connect Wallet” 🔗.',
  'Approve the connection in your wallet ✅.',
];

interface Account {
  who: string;
  emoji: string;
  balance: number;
}

export function Lesson3Ethereum({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [reach, setReach] = useState(6); // §1 number of orbiting nodes
  const [connected, setConnected] = useState(false); // §2 wallet connected
  const [accounts, setAccounts] = useState<Account[]>([
    { who: 'Alice', emoji: '🧑', balance: 5 },
    { who: 'Bob', emoji: '👩', balance: 3 },
    { who: 'Contract', emoji: '📄', balance: 0 },
  ]);
  const [lastChanged, setLastChanged] = useState<number[]>([]);
  const stop = (e: MouseEvent) => e.stopPropagation();

  // §3 — apply a transaction that mutates the shared world state.
  function sendOneEth() {
    setAccounts((prev2) => {
      if (prev2[0].balance < 1) return prev2;
      const copy = prev2.map((a) => ({ ...a }));
      copy[0].balance -= 1;
      copy[1].balance += 1;
      return copy;
    });
    setLastChanged([0, 1]);
  }

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        {step === 0 && (
          <>
            <h3 className="scene-heading">Ethereum: one global computer</h3>
            <p className="scene-paragraph">
              Ethereum behaves like a single giant computer — the{' '}
              <strong>Ethereum Virtual Machine (EVM)</strong> 🌍 — running on thousands of computers
              💻 all around the world. Anyone, anywhere can use the very same shared machine. Drag to
              add nodes across the globe.
            </p>
            <EvmGlobe count={reach} />
            <div className="scene-controls" onClick={stop}>
              <input
                type="range"
                min={3}
                max={14}
                value={reach}
                onChange={(e) => setReach(Number(e.target.value))}
              />
              <span className="muted">{reach} nodes worldwide</span>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="scene-heading">How to connect</h3>
            <p className="scene-paragraph">
              To use Ethereum you connect a <strong>wallet</strong> to an app. It takes four steps:
            </p>
            <ol className="connect-steps">
              {CONNECT_STEPS.map((s, i) => (
                <li key={i} className="fade-in" style={{ animationDelay: `${i * 0.12}s` }}>
                  {s}
                </li>
              ))}
            </ol>
            <div className={connected ? 'diagram diagram--connect connected' : 'diagram diagram--connect'}>
              <span className="connect-emoji">👛</span>
              <span className="connect-line" />
              <span className="connect-emoji">🌐</span>
              {connected && <span className="connect-ok fade-in">✅ Connected</span>}
            </div>
            <div className="scene-controls" onClick={stop}>
              <button className="btn btn--primary btn--sm" onClick={() => setConnected((c) => !c)}>
                {connected ? 'Disconnect' : 'Connect wallet 🔗'}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="scene-heading">The world state</h3>
            <p className="scene-paragraph">
              The <strong>world state</strong> is Ethereum’s master record of every account’s balance
              and every contract’s data. Each transaction updates this shared state — and every node
              agrees on the result. Send 1 ETH and watch the state change.
            </p>
            <div className="diagram diagram--state">
              {accounts.map((a, i) => (
                <div
                  key={a.who}
                  className={lastChanged.includes(i) ? 'state-row state-row--changed' : 'state-row'}
                >
                  <span className="state-who">
                    {a.emoji} {a.who}
                  </span>
                  <span className="state-bal">{a.balance} ETH</span>
                </div>
              ))}
            </div>
            <div className="scene-controls" onClick={stop}>
              <button className="btn btn--primary btn--sm" onClick={sendOneEth} disabled={accounts[0].balance < 1}>
                Send 1 ETH: 🧑 → 👩
              </button>
              <span className="muted">Updates the shared state on every node</span>
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
