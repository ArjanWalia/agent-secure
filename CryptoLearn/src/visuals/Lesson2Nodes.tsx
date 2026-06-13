import { useState, type MouseEvent } from 'react';
import type { VisualProps } from './registry';
import { useStepper } from './useStepper';

// ===========================================================================
// Lesson 2 · "Decentralization & consensus" — one big page, three sections.
//   §1  Nodes — an animated neuron-like network with light flowing along the
//       connections. Explains what nodes (computers 💻) do on a blockchain.
//   §2  Validators & proof of stake — a "strengthened" network: stake more and
//       more nodes light up as validators ✅. Explains how validators arise.
//   §3  Recap.
// Click anywhere to advance; "Previous" fades the section out and steps back.
// ===========================================================================

const STEP_COUNT = 3;

// Neural-network node layout: three layers, fully connected between layers.
const LAYERS = [
  [25, 50, 75], // layer 1 (y%)
  [18, 39, 61, 82], // layer 2
  [33, 67], // layer 3
];
const LAYER_X = [20, 50, 80]; // x% per layer

interface Node {
  x: number;
  y: number;
  id: number;
}
const NODES: Node[] = LAYERS.flatMap((ys, li) =>
  ys.map((y, i) => ({ x: LAYER_X[li], y, id: li * 10 + i })),
);

// Connections between consecutive layers (every pair).
const CONNECTIONS: { x1: number; y1: number; x2: number; y2: number }[] = [];
for (let li = 0; li < LAYERS.length - 1; li++) {
  for (const y1 of LAYERS[li]) {
    for (const y2 of LAYERS[li + 1]) {
      CONNECTIONS.push({ x1: LAYER_X[li], y1, x2: LAYER_X[li + 1], y2 });
    }
  }
}

// The animated neuron network. `speed` 0..100 controls flow rate; when
// `validatorRatio` > 0, that fraction of nodes glow as validators and the
// connections brighten ("strengthened" network).
function NeuralNet({ speed, validatorRatio }: { speed: number; validatorRatio: number }) {
  const flowDuration = `${(1.8 - (speed / 100) * 1.3).toFixed(2)}s`;
  const validatorCount = Math.round(validatorRatio * NODES.length);
  const strengthened = validatorRatio > 0;

  return (
    <div className="diagram diagram--net">
      <svg className="diagram-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {CONNECTIONS.map((c, i) => (
          <line
            key={`b${i}`}
            x1={c.x1}
            y1={c.y1}
            x2={c.x2}
            y2={c.y2}
            stroke="var(--border)"
            strokeWidth={strengthened ? 0.7 : 0.4}
          />
        ))}
        {/* Flowing "light" overlay */}
        {CONNECTIONS.map((c, i) => (
          <line
            key={`f${i}`}
            x1={c.x1}
            y1={c.y1}
            x2={c.x2}
            y2={c.y2}
            className="net-flow"
            stroke={strengthened ? 'var(--purple)' : 'var(--aqua)'}
            strokeWidth={strengthened ? 0.9 : 0.6}
            style={{ animationDuration: flowDuration, animationDelay: `${(i % 5) * 0.12}s` }}
          />
        ))}
      </svg>
      {NODES.map((n, i) => {
        const isValidator = i < validatorCount;
        return (
          <span
            key={n.id}
            className={isValidator ? 'net-node net-node--validator' : 'net-node'}
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            💻
            {isValidator && <span className="net-badge">✅</span>}
          </span>
        );
      })}
    </div>
  );
}

export function Lesson2Nodes({ onComplete, onBack }: VisualProps) {
  const { step, isLast, advance, prev, stepClass } = useStepper(STEP_COUNT);
  const [activity, setActivity] = useState(40); // §1 flow speed
  const [stake, setStake] = useState(0); // §2 stake → validator ratio
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div className="scene scene--full" onClick={advance}>
      <div className={stepClass} key={step}>
        {step === 0 && (
          <>
            <h3 className="scene-heading">Nodes</h3>
            <p className="scene-paragraph">
              A blockchain runs on thousands of computers 💻 called <strong>nodes</strong>. Each node
              stores a full copy of the chain and passes new information to its neighbors — like
              neurons firing across a network. Watch the signals travel.
            </p>
            <NeuralNet speed={activity} validatorRatio={0} />
            <div className="scene-controls" onClick={stop}>
              <input
                type="range"
                min={0}
                max={100}
                value={activity}
                onChange={(e) => setActivity(Number(e.target.value))}
              />
              <span className="muted">Network activity</span>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="scene-heading">Validators &amp; proof of stake</h3>
            <p className="scene-paragraph">
              Not every node can add the next block. In <strong>proof of stake</strong>, nodes lock up
              coins as a stake 🔒💰. The more they stake, the likelier they’re chosen as a{' '}
              <strong>validator</strong> ✅ — the node that proposes and confirms the next block.
              Misbehave and you lose your stake. Drag to raise the stake and strengthen the network.
            </p>
            <NeuralNet speed={70} validatorRatio={stake / 100} />
            <div className="scene-controls" onClick={stop}>
              <input
                type="range"
                min={0}
                max={100}
                value={stake}
                onChange={(e) => setStake(Number(e.target.value))}
              />
              <span className="muted">
                {Math.round((stake / 100) * NODES.length)} validators staked 🔒
              </span>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="scene-heading">Why it matters</h3>
            <p className="scene-paragraph">
              Many independent nodes 💻 + validators ✅ chosen by stake = no single point of control
              and no single point of failure. The network agrees on one shared truth, and attacking it
              would mean out-staking the entire honest majority.
            </p>
            <NeuralNet speed={90} validatorRatio={0.5} />
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
