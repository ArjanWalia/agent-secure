import { useNavigate } from 'react-router-dom';
import { COURSE } from '../data/course';
import { useProgress } from '../hooks/useProgress';

// The page a user lands on after logging in. Lists the available course(s) as
// clickable cards. Clicking a course opens it.
export function Courses() {
  const navigate = useNavigate();
  const p = useProgress();

  const totalLessons = COURSE.sections.reduce((n, s) => n + s.lessons.length, 0);
  const done = !p.loading && p.isCourseComplete();

  return (
    <div className="container">
      <header className="course-header">
        <h1>Your courses</h1>
        <p className="muted">Pick a course to get started.</p>
      </header>

      <button className="card course-tile" onClick={() => navigate('/course')}>
        <div className="course-tile__body">
          <span className="tag">Course</span>
          <h2>{COURSE.title}</h2>
          <p className="muted">
            {COURSE.sections.length} sections · {totalLessons} lessons
          </p>
        </div>
        <div className="course-tile__cta">
          {done ? <span className="badge badge--done">✓ Complete</span> : null}
          <span className="course-tile__arrow">Open →</span>
        </div>
      </button>
    </div>
  );
}
