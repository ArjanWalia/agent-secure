import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 3.5 · "How wallets connect" — one interactive page, four sections.
//   §1  Init & connect — keys → address → connect to a node.
//   §2  RPC — the wallet talks to a node through an RPC endpoint.
//   §3  Reading — query state/contracts; free, no private key.
//   §4  Signing — change state; needs the private key + gas.
// ===========================================================================

const STEP_COUNT = 4;

export function LessonWalletConnect({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [connected, setConnected] = useState(false); // §1
  const [rpc, setRpc] = useState(false); // §2
  const [read, setRead] = useState(false); // §3
  const [signed, setSigned] = useState(false); // §4
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        {step === 0 && (
          <>
            <h3 className="scene-heading">Connecting to the blockchain</h3>
            <p className="scene-paragraph">
              When you open a wallet it loads your private key 🗝️, derives your public key 🔑 and
              address 🏷️, then connects to a <strong>node</strong> — a computer running the blockchain
              — so it can read data and send transactions. Connect it.
            </p>
            <div className="diagram diagram--conn">
              <div className="conn-wallet">
                👛
                <div className="conn-keys">🗝️ 🔑 🏷️</div>
              </div>
              <span className={connected ? 'conn-link conn-link--on' : 'conn-link'}>
                {connected ? '🔌━━✅' : '┄┄┄'}
              </span>
              <div className="conn-node">
                💻⛓️
                <div className="muted">Node</div>
              </div>
            </div>
            <div className="scene-controls" onClick={stop}>
              <button className="btn btn--primary btn--sm" onClick={() => setConnected((c) => !c)}>
                {connected ? 'Disconnect' : 'Initialize & connect 🔌'}
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="scene-heading">What is RPC?</h3>
            <p className="scene-paragraph">
              Wallets don’t store the whole blockchain. They talk to a node through an{' '}
              <strong>RPC</strong> (Remote Procedure Call) endpoint — like an API. The wallet sends a
              request and the node replies. Send one.
            </p>
            <div className="diagram diagram--rpc">
              <span className="rpc-emoji">👛</span>
              <div className="rpc-pipe">
                <span className="rpc-label">RPC 📡</span>
                {rpc && <span className="rpc-msg fade-in">request → ↩️ response</span>}
              </div>
              <span className="rpc-emoji">💻⛓️</span>
            </div>
            <div className="scene-controls" onClick={stop}>
              <button className="btn btn--primary btn--sm" onClick={() => setRpc((r) => !r)}>
                {rpc ? 'Reset' : 'Send RPC request 📡'}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="scene-heading">Reading</h3>
            <p className="scene-paragraph">
              <strong>Reading</strong> just asks the blockchain for information — a balance, or data
              from a smart contract 📄. It’s free, instant, and needs <strong>no private key</strong>,
              because you’re not changing anything. Try a read.
            </p>
            <div className="diagram diagram--read">
              <span className="rpc-emoji">👛</span>
              <span className="io-arrow">balanceOf? →</span>
              <span className="rpc-emoji">📄</span>
              {read && <span className="read-result fade-in">↩️ 5 ETH</span>}
            </div>
            <div className="read-reqs">
              <span className="pill pill--ok">✅ no private key</span>
              <span className="pill pill--ok">✅ free — no gas</span>
            </div>
            <div className="scene-controls" onClick={stop}>
              <button className="btn btn--primary btn--sm" onClick={() => setRead((r) => !r)}>
                {read ? 'Reset' : 'Read balance 🔍'}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 className="scene-heading">Signing</h3>
            <p className="scene-paragraph">
              <strong>Signing</strong> is how you <em>change</em> the blockchain — sending funds or
              calling a contract. The wallet uses your private key 🗝️ to sign the transaction,
              proving you authorize it. Unlike reading, this needs your key and costs gas. Send funds.
            </p>
            <div className="diagram diagram--sign2">
              <span className="rpc-emoji">👛🗝️</span>
              <span className="io-arrow">{signed ? 'signed 💵 →' : 'sign →'}</span>
              <span className="rpc-emoji">⛓️</span>
              {signed && <span className="read-result fade-in">✅ funds sent — state changed</span>}
            </div>
            <div className="read-reqs">
              <span className="pill pill--warn">🗝️ needs private key</span>
              <span className="pill pill--warn">⛽ costs gas</span>
            </div>
            <div className="scene-controls" onClick={stop}>
              <button className="btn btn--primary btn--sm" onClick={() => setSigned((s) => !s)}>
                {signed ? 'Reset' : 'Sign & send 🗝️'}
              </button>
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
