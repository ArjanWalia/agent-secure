import { useState } from 'react';
import type { VisualProps } from './registry';

// ---------------------------------------------------------------------------
// Lesson 1 · "How transactions used to happen"
//
// Three pieces of information, navigated with Next / Previous:
//   0) An interactive slider: drag it to send money from A → Bank → B. Once the
//      slider reaches the end, the explanation fades in above the diagram.
//   1) "Relied on a single entity" — diagram removed, text + 🏦 + 1 fade in.
//      Clicking anywhere advances.
//   2) "Vulnerable to attacks" — text + 🦹 💰 💥 fade in. Next → the question.
// ---------------------------------------------------------------------------

// Quadratic bézier point.
function quad(p0: number[], p1: number[], p2: number[], u: number): number[] {
  const v = 1 - u;
  return [
    v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0],
    v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1],
  ];
}

// Position of the money symbol along the A→Bank→B path for t in [0,1].
function moneyPos(t: number) {
  const A = [19, 30];
  const C1 = [34, 54];
  const BANK = [50, 40];
  const C2 = [66, 54];
  const B = [81, 30];
  const [x, y] = t <= 0.5 ? quad(A, C1, BANK, t / 0.5) : quad(BANK, C2, B, (t - 0.5) / 0.5);
  // Fade out as it enters the bank, fade back in as it leaves.
  let opacity = 1;
  if (t > 0.43 && t <= 0.5) opacity = (0.5 - t) / 0.07;
  else if (t > 0.5 && t < 0.57) opacity = (t - 0.5) / 0.07;
  return { x, y, opacity: Math.max(0, Math.min(1, opacity)) };
}

const STEPS = [
  {
    text:
      'Before blockchain, online money transactions had to be confirmed through an ' +
      'intermediary — for example, a bank.',
    emojis: [] as string[],
  },
  {
    text: 'Transactions relied on a single entity to keep track.',
    emojis: ['🏦', '1️⃣'],
  },
  {
    text: 'This system was extremely vulnerable to attacks — there was only one node in control.',
    emojis: ['🦹', '💰', '💥'],
  },
];

export function TxBeforeBlockchain({ onAdvance }: VisualProps) {
  const [step, setStep] = useState(0);
  const [slider, setSlider] = useState(0); // 0..100
  const t = slider / 100;
  const sliderDone = slider >= 99;

  // On step 0 the text only appears once the slider is finished.
  const textVisible = step !== 0 || sliderDone;
  const onLast = step === STEPS.length - 1;
  // Next is blocked on step 0 until the user finishes the slider.
  const canNext = step !== 0 || sliderDone;

  function next() {
    if (onLast) onAdvance();
    else if (canNext) setStep((s) => s + 1);
  }
  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  const money = moneyPos(t);

  return (
    // Clicking anywhere advances from the "single entity" piece (step 1).
    <div
      className="scene"
      onClick={() => {
        if (step === 1) setStep(2);
      }}
    >
      {/* Explanation text (fades in above the diagram) */}
      <div className="scene-text">
        {textVisible && (
          <p key={step} className="fade-in scene-paragraph">
            {STEPS[step].text}
          </p>
        )}
        {textVisible && STEPS[step].emojis.length > 0 && (
          <div key={`e${step}`} className="fade-in scene-emojis">
            {STEPS[step].emojis.map((e, i) => (
              <span key={i} style={{ animationDelay: `${0.15 + i * 0.15}s` }} className="fade-in">
                {e}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Interactive diagram — only on the slider step */}
      {step === 0 && (
        <>
          <svg className="scene-svg" viewBox="0 0 100 60" role="img" aria-label="A sends money to B through a bank">
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="var(--muted)" />
              </marker>
            </defs>

            {/* paths money travels along */}
            <path
              d="M 21 30 Q 34 54 48 40"
              fill="none"
              stroke="var(--border)"
              strokeWidth="0.8"
              markerEnd="url(#arrow)"
            />
            <path
              d="M 52 40 Q 66 54 79 30"
              fill="none"
              stroke="var(--border)"
              strokeWidth="0.8"
              markerEnd="url(#arrow)"
            />

            {/* Bank */}
            <rect x="39" y="38" width="22" height="15" rx="2" fill="var(--bg-soft)" stroke="var(--purple)" strokeWidth="0.8" />
            <text x="50" y="47.5" textAnchor="middle" fontSize="5" fill="var(--ink)" fontWeight="700">
              Bank
            </text>

            {/* Person A */}
            <circle cx="13" cy="30" r="8" fill="#fff" stroke="var(--aqua)" strokeWidth="1" />
            <text x="13" y="32" textAnchor="middle" fontSize="6" fill="var(--ink)" fontWeight="700">
              A
            </text>

            {/* Person B */}
            <circle cx="87" cy="30" r="8" fill="#fff" stroke="var(--aqua)" strokeWidth="1" />
            <text x="87" y="32" textAnchor="middle" fontSize="6" fill="var(--ink)" fontWeight="700">
              B
            </text>

            {/* Moving money symbol */}
            <text
              x={money.x}
              y={money.y}
              textAnchor="middle"
              fontSize="7"
              fontWeight="800"
              fill="var(--purple)"
              opacity={money.opacity}
            >
              $
            </text>
          </svg>

          <div className="scene-slider">
            <input
              type="range"
              min={0}
              max={100}
              value={slider}
              onChange={(e) => setSlider(Number(e.target.value))}
              aria-label="Send the payment"
            />
            <p className="scene-hint muted">
              {sliderDone ? 'Payment delivered ✓' : 'Drag the slider to send the payment →'}
            </p>
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="scene-nav">
        <button className="btn btn--ghost" onClick={prev} disabled={step === 0}>
          ← Previous
        </button>
        <button className="btn btn--primary" onClick={next} disabled={!canNext}>
          {onLast ? 'Continue to question →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
