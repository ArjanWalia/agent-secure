import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { COURSE } from '../data/course';
import { useProgress } from '../hooks/useProgress';
import { Checkmark } from '../components/Checkmark';

type Phase = 'visual' | 'question';

export function Lesson() {
  const { sectionId = '', lessonId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const p = useProgress();

  const section = COURSE.sections.find((s) => s.id === sectionId);
  const lesson = section?.lessons.find((l) => l.id === lessonId);

  // Starting question index: from ?q=, else first incomplete, else 0.
  const startIndex = useMemo(() => {
    if (!lesson) return 0;
    const q = Number(params.get('q'));
    if (q && q >= 1 && q <= lesson.questions.length) return q - 1;
    const firstIncomplete = lesson.questions.findIndex(
      (qq) => !p.isQuestionComplete(sectionId, lessonId, qq.number),
    );
    return firstIncomplete === -1 ? 0 : firstIncomplete;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, p.loading]);

  const [index, setIndex] = useState(startIndex);
  const [phase, setPhase] = useState<Phase>('visual');

  if (!section || !lesson) {
    return (
      <div className="container">
        <p>Lesson not found.</p>
        <button className="btn" onClick={() => navigate('/')}>
          Back to course
        </button>
      </div>
    );
  }

  if (p.loading) return <div className="centered">Loading…</div>;

  const total = lesson.questions.length;
  const question = lesson.questions[index];
  const lessonDone = p.isLessonComplete(sectionId, lessonId);

  // User answered correctly → mark complete, advance to next question's visual.
  async function onCorrect() {
    await p.completeQuestion(sectionId, lessonId, question.number);
    if (index + 1 < total) {
      setIndex(index + 1);
      setPhase('visual');
    } else {
      setPhase('question'); // stay; the "lesson complete" banner will show
    }
  }

  // Retry → in future this regenerates a new question. For now, replay this one.
  function onRetry() {
    setPhase('visual');
  }

  async function redoLesson() {
    await p.resetLesson(sectionId, lessonId);
    setIndex(0);
    setPhase('visual');
  }

  return (
    <div className="container">
      <button className="btn btn--ghost btn--sm back" onClick={() => navigate('/')}>
        ← Back to course
      </button>

      <header className="lesson-head">
        <h1>
          <Checkmark complete={lessonDone} /> {lesson.title}
        </h1>
        <p className="muted">
          Question {index + 1} of {total} · {phase === 'visual' ? 'Visual' : 'Try it yourself'}
        </p>
      </header>

      {lessonDone && index + 1 >= total && (
        <div className="banner banner--done">
          ✓ Lesson complete! You can redo it or head back to the course.
        </div>
      )}

      {/* Page 1 of the pair: the visual representation (precedes the question). */}
      {phase === 'visual' && (
        <div className="card lesson-panel">
          <span className="tag">Visual representation</span>
          <div className="placeholder placeholder--visual">
            {/* Material intentionally empty for now. */}
            Visual for question {question.number} — coming soon
          </div>
          <div className="panel-actions">
            <button className="btn btn--primary" onClick={() => setPhase('question')}>
              Continue to question →
            </button>
          </div>
        </div>
      )}

      {/* Page 2 of the pair: the try-it-yourself question. */}
      {phase === 'question' && (
        <div className="card lesson-panel">
          <span className="tag">Try it yourself</span>
          <div className="placeholder placeholder--question">
            {/* Material intentionally empty for now. */}
            Question {question.number} — coming soon
          </div>
          <div className="panel-actions">
            {/* Placeholder for real answer-checking. */}
            <button className="btn btn--primary" onClick={() => void onCorrect()}>
              Submit (correct) →
            </button>
            <button className="btn btn--ghost" onClick={onRetry}>
              Retry with a new question
            </button>
          </div>
        </div>
      )}

      <footer className="lesson-foot">
        <span className="q-dots">
          {lesson.questions.map((q, i) => (
            <span
              key={q.number}
              className={
                p.isQuestionComplete(sectionId, lessonId, q.number)
                  ? 'q-dot q-dot--done'
                  : i === index
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
