import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { COURSE, lessonQuestionNumbers } from '../data/course';
import { useProgress } from '../hooks/useProgress';
import { Checkmark } from '../components/Checkmark';
import { VISUALS } from '../visuals/registry';

// A lesson plays as an ordered list of screens:
//   teach(1) → question(1) → teach(2) → question(2) → … → quizIntro → quiz Qs
// Pair questions are numbered 1..P; quiz questions P+1..P+Q.
type Screen =
  | { type: 'teach'; pairIndex: number; qn: number }
  | { type: 'question'; qn: number; quiz: boolean }
  | { type: 'quizIntro' };

export function Lesson() {
  const { sectionId = '', lessonId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const p = useProgress();

  const section = COURSE.sections.find((s) => s.id === sectionId);
  const lesson = section?.lessons.find((l) => l.id === lessonId);

  // Build the ordered screen list for this lesson.
  const screens: Screen[] = useMemo(() => {
    if (!lesson) return [];
    const out: Screen[] = [];
    lesson.pairs.forEach((_, i) => {
      out.push({ type: 'teach', pairIndex: i, qn: i + 1 });
      out.push({ type: 'question', qn: i + 1, quiz: false });
    });
    if (lesson.quiz.length > 0) {
      out.push({ type: 'quizIntro' });
      lesson.quiz.forEach((_, j) => {
        out.push({ type: 'question', qn: lesson.pairs.length + j + 1, quiz: true });
      });
    }
    return out;
  }, [lesson]);

  // Where to start: ?q= overrides; else first incomplete question; else the top.
  // For a pair question we begin at its TEACH page (restart teaches first).
  const startCursor = useMemo(() => {
    if (!lesson || screens.length === 0) return 0;
    const pairCount = lesson.pairs.length;
    const numbers = lessonQuestionNumbers(lesson);
    const requested = Number(params.get('q'));
    const targetQn =
      requested && numbers.includes(requested)
        ? requested
        : (numbers.find((n) => !p.isQuestionComplete(sectionId, lessonId, n)) ?? 1);

    const idx =
      targetQn <= pairCount
        ? screens.findIndex((s) => s.type === 'teach' && s.qn === targetQn)
        : screens.findIndex((s) => s.type === 'question' && s.quiz && s.qn === targetQn);
    return idx === -1 ? 0 : idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, screens, p.loading]);

  const [cursor, setCursor] = useState(startCursor);

  if (!section || !lesson) {
    return (
      <div className="container">
        <p>Lesson not found.</p>
        <button className="btn" onClick={() => navigate('/course')}>
          Back to course
        </button>
      </div>
    );
  }
  if (p.loading) return <div className="centered">Loading…</div>;

  const pairCount = lesson.pairs.length;
  const numbers = lessonQuestionNumbers(lesson);
  const lessonDone = p.isLessonComplete(sectionId, lessonId);
  const current = screens[Math.min(cursor, screens.length - 1)];
  const atEnd = cursor >= screens.length - 1;

  function advance() {
    setCursor((c) => Math.min(c + 1, screens.length - 1));
  }

  // Correct answer → mark the question complete, then move on.
  async function onCorrect(qn: number) {
    await p.completeQuestion(sectionId, lessonId, qn);
    advance();
  }

  async function redoLesson() {
    await p.resetLesson(sectionId, lessonId);
    setCursor(0);
  }

  // Header subtitle for the current screen.
  function subtitle(): string {
    if (current.type === 'teach') return `Teaching ${current.pairIndex + 1} of ${pairCount}`;
    if (current.type === 'quizIntro') return 'End-of-lesson quiz';
    if (current.quiz) return `Quiz · Question ${current.qn - pairCount} of ${lesson!.quiz.length}`;
    return `Question ${current.qn} of ${pairCount}`;
  }

  const currentQn =
    current.type === 'teach' || current.type === 'question' ? current.qn : undefined;

  return (
    <div className="container">
      <button className="btn btn--ghost btn--sm back" onClick={() => navigate('/course')}>
        ← Back to course
      </button>

      <header className="lesson-head">
        <h1>
          <Checkmark complete={lessonDone} /> {lesson.title}
        </h1>
        <p className="muted">{subtitle()}</p>
      </header>

      {lessonDone && (
        <div className="banner banner--done">
          ✓ Lesson complete! You can redo it or head back to the course.
        </div>
      )}

      {/* TEACH PAGE — teaches a sub-topic; precedes its question. */}
      {current.type === 'teach' &&
        (() => {
          const teach = lesson.pairs[current.pairIndex].teach;
          const Visual = teach.visualId ? VISUALS[teach.visualId] : undefined;
          return (
            <div className="card lesson-panel">
              <span className="tag">Lesson</span>
              <h2 className="teach-title">{teach.title || `Topic ${current.pairIndex + 1}`}</h2>
              {Visual ? (
                // Interactive scene owns its own Next/Previous + "continue" flow.
                <Visual onAdvance={advance} />
              ) : (
                <>
                  <div className="placeholder placeholder--teach">
                    {/* Teaching material intentionally empty for now. */}
                    Teaching content — coming soon
                  </div>
                  <div className="panel-actions">
                    <button className="btn btn--primary" onClick={advance}>
                      Continue to question →
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })()}

      {/* QUIZ INTRO — shown once before the quiz questions begin. */}
      {current.type === 'quizIntro' && (
        <div className="card lesson-panel">
          <span className="tag">Quiz</span>
          <h2 className="teach-title">Check your understanding</h2>
          <div className="placeholder placeholder--teach">
            {lesson.quiz.length} questions covering this lesson.
          </div>
          <div className="panel-actions">
            <button className="btn btn--primary" onClick={advance}>
              Start quiz →
            </button>
          </div>
        </div>
      )}

      {/* QUESTION PAGE — pair question or quiz question. */}
      {current.type === 'question' && (
        <div className="card lesson-panel">
          <span className="tag">{current.quiz ? 'Quiz' : 'Try it yourself'}</span>
          <div className="placeholder placeholder--question">
            {/* Question material intentionally empty for now. */}
            {current.quiz
              ? `Quiz question ${current.qn - pairCount} — coming soon`
              : `Question ${current.qn} — coming soon`}
          </div>
          <div className="panel-actions">
            {/* Placeholder for real answer-checking. */}
            <button className="btn btn--primary" onClick={() => void onCorrect(current.qn)}>
              {atEnd ? 'Submit (correct) ✓' : 'Submit (correct) →'}
            </button>
            <button className="btn btn--ghost" onClick={() => setCursor((c) => Math.max(0, c - 1))}>
              Back
            </button>
          </div>
        </div>
      )}

      <footer className="lesson-foot">
        <span className="q-dots">
          {numbers.map((n) => (
            <span
              key={n}
              className={
                p.isQuestionComplete(sectionId, lessonId, n)
                  ? 'q-dot q-dot--done'
                  : n === currentQn
                    ? 'q-dot q-dot--current'
                    : 'q-dot'
              }
            />
          ))}
        </span>
        <button className="btn btn--ghost btn--sm" onClick={() => void redoLesson()}>
          Redo entire lesson
        </button>
      </footer>
    </div>
  );
}
