import { type MouseEvent, type ReactNode } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';
import { NETWORKS, useWeb3 } from '../context/Web3Context';

// ===========================================================================
// Section 5 · "Try it out yourself!" — REAL MetaMask flow, one lesson per step.
//   L1 connect · L2 pick coin/chain · L3 enter recipient + amount · L4 transfer.
// State is shared through Web3Context so it persists across the four lessons.
// The app never touches a private key — MetaMask signs & confirms everything.
// ===========================================================================

const stop = (e: MouseEvent) => e.stopPropagation();
const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

// Shared shell: scene wrapper + bottom nav (these lessons are single-step).
function TryShell({
  onComplete,
  onBack,
  children,
}: {
  onComplete: () => void;
  onBack: () => void;
  children: ReactNode;
}) {
  const { stepClass } = useStepper(1);
  return (
    <div className="scene scene--full">
      <div className={stepClass}>{children}</div>
      <div className="scene-nav" onClick={stop}>
        <button className="btn btn--ghost" disabled>
          ← Previous
        </button>
        <div className="scene-nav__end">
          <button className="btn btn--ghost" onClick={onBack}>
            ← Back
          </button>
          <button className="btn btn--primary" onClick={onComplete}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

// L1 — connect MetaMask
export function TryConnect({ onComplete, onBack }: VisualProps) {
  const { hasMetaMask, account, connect, busy, error } = useWeb3();
  return (
    <TryShell onComplete={onComplete} onBack={onBack}>
      <h3 className="scene-heading">1 · Connect your wallet</h3>
      <p className="scene-paragraph">
        Time to do it for real. Connect your <strong>existing MetaMask</strong> wallet 🦊 — we use
        MetaMask Connect, so the app never sees your keys. Click connect and approve in the popup.
      </p>
      <div className="diagram diagram--try" onClick={stop}>
        {!hasMetaMask ? (
          <div className="try-warn">
            🦊 MetaMask not detected.{' '}
            <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">
              Install MetaMask
            </a>{' '}
            and reload.
          </div>
        ) : account ? (
          <div className="try-ok fade-in">✅ Connected: {shortAddr(account)}</div>
        ) : (
          <button className="btn btn--primary" onClick={() => void connect()} disabled={busy}>
            {busy ? 'Connecting…' : 'Connect MetaMask 🦊'}
          </button>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </TryShell>
  );
}

// L2 — pick coin & chain
export function TrySelect({ onComplete, onBack }: VisualProps) {
  const { account, selected, chainId, selectNetwork, error } = useWeb3();
  return (
    <TryShell onComplete={onComplete} onBack={onBack}>
      <h3 className="scene-heading">2 · Choose coin &amp; chain</h3>
      <p className="scene-paragraph">
        Pick the coin and network you want to use. Selecting one asks MetaMask to switch to that
        chain (the same networks available in your wallet).
      </p>
      <div className="diagram diagram--try" onClick={stop}>
        {!account && <p className="muted">Connect your wallet in step 1 first.</p>}
        <div className="try-networks">
          {NETWORKS.map((n) => (
            <button
              key={n.id}
              className={selected?.id === n.id ? 'cat-card cat-card--active' : 'cat-card'}
              onClick={() => void selectNetwork(n)}
            >
              <span className="cat-emoji">{n.emoji}</span>
              <span className="cat-name">{n.coin}</span>
              <span className="muted" style={{ fontSize: 11 }}>{n.label}</span>
            </button>
          ))}
        </div>
        {selected && (
          <p className="try-ok fade-in">
            Selected {selected.coin} on {selected.label}
            {chainId === selected.chainId ? ' ✅' : ' (switching…)'}
          </p>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </TryShell>
  );
}

// L3 — recipient + amount
export function TryRecipient({ onComplete, onBack }: VisualProps) {
  const { selected, recipient, amount, setRecipient, setAmount } = useWeb3();
  const validAddr = /^0x[a-fA-F0-9]{40}$/.test(recipient);
  return (
    <TryShell onComplete={onComplete} onBack={onBack}>
      <h3 className="scene-heading">3 · Recipient &amp; amount</h3>
      <p className="scene-paragraph">
        Enter the recipient’s <strong>address</strong> (the one derived from their public key) and how
        much {selected?.coin ?? 'crypto'} to send.
      </p>
      <div className="diagram diagram--try" onClick={stop}>
        <label className="try-field">
          Recipient address
          <input
            type="text"
            placeholder="0x…"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          {recipient && !validAddr && <span className="error">Address must be 0x + 40 hex chars.</span>}
        </label>
        <label className="try-field">
          Amount ({selected?.coin ?? 'coin'})
          <input
            type="number"
            min="0"
            step="0.0001"
            placeholder="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
      </div>
    </TryShell>
  );
}

// L4 — transfer
export function TryTransfer({ onComplete, onBack }: VisualProps) {
  const { selected, recipient, amount, account, send, busy, txHash, error } = useWeb3();
  const explorer = selected?.add?.blockExplorerUrls[0] ?? 'https://etherscan.io';
  const ready = !!account && /^0x[a-fA-F0-9]{40}$/.test(recipient) && Number(amount) > 0;
  return (
    <TryShell onComplete={onComplete} onBack={onBack}>
      <h3 className="scene-heading">4 · Transfer</h3>
      <p className="scene-paragraph">
        Review and send. When you hit transfer, <strong>MetaMask will pop up for you to confirm</strong>{' '}
        — nothing leaves your wallet until you approve it there.
      </p>
      <div className="diagram diagram--try" onClick={stop}>
        <div className="try-summary">
          <div>👛 From: {account ? shortAddr(account) : '— not connected'}</div>
          <div>🎯 To: {recipient ? shortAddr(recipient) : '—'}</div>
          <div>💰 Amount: {amount || '—'} {selected?.coin ?? ''}</div>
          <div>⛓️ Network: {selected?.label ?? '—'}</div>
        </div>
        <button className="btn btn--primary" onClick={() => void send()} disabled={!ready || busy}>
          {busy ? 'Sending…' : 'Transfer 🚀'}
        </button>
        {!ready && <p className="muted">Complete steps 1–3 to enable transfer.</p>}
        {txHash && (
          <p className="try-ok fade-in">
            ✅ Sent!{' '}
            <a href={`${explorer}/tx/${txHash}`} target="_blank" rel="noreferrer">
              View on explorer
            </a>
          </p>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </TryShell>
  );
}
