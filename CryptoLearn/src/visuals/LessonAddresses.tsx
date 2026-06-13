import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 3.2 · "Addresses & public keys" — one interactive page, two sections.
//   §1  What an address is & how wallets find each other — pick a recipient
//       address and send; the matching wallet receives it.
//   §2  How addresses are made — private key → public key → address (one-way);
//       generate a fresh set to see the derivation.
// ===========================================================================

const STEP_COUNT = 2;

const HEX = '0123456789abcdef';
function randHex(n: number) {
  let s = '';
  for (let i = 0; i < n; i++) s += HEX[Math.floor(Math.random() * 16)];
  return s;
}
function makeKeys() {
  const priv = randHex(8);
  const pub = randHex(12);
  const addr = randHex(6);
  return { priv, pub, addr };
}

const RECIPIENTS = [
  { emoji: '🧑', addr: '0x7Fa…3b1' },
  { emoji: '👩', addr: '0x9Cd…e22' },
  { emoji: '🧓', addr: '0x4Ee…a90' },
];

export function LessonAddresses({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [sentTo, setSentTo] = useState<number | null>(null); // §1
  const [keys, setKeys] = useState(makeKeys); // §2
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        {step === 0 && (
          <>
            <h3 className="scene-heading">Wallet addresses</h3>
            <p className="scene-paragraph">
              A wallet <strong>address</strong> is your public account number — like a mailbox 📭 for
              crypto. You share it so others can pay you. To send funds you just need the recipient’s
              address, and the network routes it to the matching wallet. Pick someone to pay.
            </p>
            <div className="diagram diagram--send">
              <div className="send-from">
                <span className="send-emoji">👛</span>
                <span className="muted">You · 0x1Ab…f09</span>
              </div>
              <span className="io-arrow">{sentTo === null ? '→' : '💵→'}</span>
              <div className="send-recipients">
                {RECIPIENTS.map((r, i) => (
                  <button
                    key={r.addr}
                    className={sentTo === i ? 'send-card send-card--got' : 'send-card'}
                    onClick={(e) => {
                      stop(e);
                      setSentTo(i);
                    }}
                  >
                    <span className="send-emoji">{r.emoji}</span>
                    <code>{r.addr}</code>
                    {sentTo === i && <span className="send-got fade-in">💵 received ✅</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="scene-controls" onClick={stop}>
              <span className="muted">
                {sentTo === null ? 'Tap an address to send 💵' : `Delivered to ${RECIPIENTS[sentTo].addr}`}
              </span>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="scene-heading">How an address is made</h3>
            <p className="scene-paragraph">
              Your address is built from your keys. The private key 🗝️ creates the public key 🔑
              through one-way math; the public key is then hashed and shortened into your address 🏷️.
              You can go forwards — but <strong>never backwards</strong>. Generate a fresh set.
            </p>
            <div className="diagram diagram--derive">
              <div className="derive-step">
                <span className="derive-emoji">🗝️</span>
                <div className="derive-label">Private key</div>
                <code>0x{keys.priv}…</code>
              </div>
              <span className="derive-arrow">→ math →</span>
              <div className="derive-step">
                <span className="derive-emoji">🔑</span>
                <div className="derive-label">Public key</div>
                <code>0x{keys.pub}…</code>
              </div>
              <span className="derive-arrow">→ hash →</span>
              <div className="derive-step">
                <span className="derive-emoji">🏷️</span>
                <div className="derive-label">Address</div>
                <code>0x{keys.addr}…</code>
              </div>
            </div>
            <div className="scene-controls" onClick={stop}>
              <button className="btn btn--primary btn--sm" onClick={() => setKeys(makeKeys())}>
                Generate 🎲
              </button>
              <span className="muted">one-way: you can’t reverse it</span>
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
