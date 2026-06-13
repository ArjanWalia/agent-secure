import { Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Signup } from './pages/Signup';
import { Courses } from './pages/Courses';
import { Dashboard } from './pages/Dashboard';
import { Lesson } from './pages/Lesson';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          {/* Public: landing page with login */}
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected: after login → courses → open the course → lessons */}
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lesson/:sectionId/:lessonId"
            element={
              <ProtectedRoute>
                <Lesson />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
