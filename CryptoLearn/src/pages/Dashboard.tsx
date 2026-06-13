import { useNavigate } from 'react-router-dom';
import { COURSE, lessonQuestionNumbers } from '../data/course';
import { useProgress } from '../hooks/useProgress';
import { useWeb3 } from '../context/Web3Context';
import { Checkmark } from '../components/Checkmark';

export function Dashboard() {
  const navigate = useNavigate();
  const p = useProgress();
  const w3 = useWeb3();

  if (p.loading) return <div className="centered">Loading progress…</div>;

  const resume = p.resumeTarget();
  const courseDone = p.isCourseComplete();
  const started = p.hasStarted();

  function goToResume() {
    if (!resume) return;
    navigate(`/lesson/${resume.sectionId}/${resume.lessonId}?q=${resume.questionNumber}`);
  }

  return (
    <div className="container">
      <header className="course-header">
        <h1>{COURSE.title}</h1>
        <div className="course-header__actions">
          {courseDone ? (
            <span className="badge badge--done">✓ Course complete</span>
          ) : (
            <button className="btn btn--primary btn--resume" onClick={goToResume}>
              {started ? '▶ Resume' : '▶ Start'}
            </button>
          )}
          <button
            className="btn btn--ghost"
            onClick={() => {
              void p.resetCourse();
              void w3.disconnect();
            }}
          >
            Reset entire course
          </button>
        </div>
      </header>

      {COURSE.sections.map((section, si) => (
        <section key={section.id} className="card section-card">
          <div className="row row--head">
            <h2>
              <Checkmark complete={p.isSectionComplete(section.id)} />
              <span className="section-index">Section {si + 1}</span> {section.title}
            </h2>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => {
                void p.resetSection(section.id);
                void w3.disconnect();
              }}
            >
              Reset section
            </button>
          </div>
          <p className="muted section-desc">{section.description}</p>

          <ul className="lesson-list">
            {section.lessons.map((lesson, li) => {
              const done = p.isLessonComplete(section.id, lesson.id);
              return (
                <li key={lesson.id} className="lesson-row">
                  <button
                    className="lesson-link"
                    onClick={() => navigate(`/lesson/${section.id}/${lesson.id}`)}
                  >
                    <Checkmark complete={done} />
                    <span className="lesson-index">Lesson {li + 1}</span>
                    <span className="lesson-title">{lesson.title}</span>
                  </button>
                  <span className="q-dots">
                    {lessonQuestionNumbers(lesson).map((n) => (
                      <span
                        key={n}
                        title={`Question ${n}`}
                        className={
                          p.isQuestionComplete(section.id, lesson.id, n)
                            ? 'q-dot q-dot--done'
                            : 'q-dot'
                        }
                      />
                    ))}
                  </span>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      void p.resetLesson(section.id, lesson.id);
                      void w3.disconnect();
                    }}
                  >
                    Reset
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
