import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as P from '../services/progress';
import type { ProgressSnapshot } from '../services/progress';

// React wrapper around the progress service. Holds the snapshot in state and
// re-renders the UI whenever progress changes.
export function useProgress() {
  const { user } = useAuth();
  const [snap, setSnap] = useState<ProgressSnapshot>({ completedQuestions: new Set() });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const s = await P.loadProgress(user.id);
    setSnap(s);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const uid = user?.id;

  return {
    loading,
    snap,
    refresh,

    // derived
    isLessonComplete: (s: string, l: string) => P.isLessonComplete(snap, s, l),
    isSectionComplete: (s: string) => P.isSectionComplete(snap, s),
    isCourseComplete: () => P.isCourseComplete(snap),
    isQuestionComplete: (s: string, l: string, n: number) =>
      snap.completedQuestions.has(P.qKey(s, l, n)),
    resumeTarget: () => P.resumeTarget(snap),

    // mutations (each persists and updates local state)
    completeQuestion: async (s: string, l: string, n: number) => {
      if (!uid) return;
      setSnap(await P.setQuestion(uid, snap, s, l, n, true));
    },
    resetQuestion: async (s: string, l: string, n: number) => {
      if (!uid) return;
      setSnap(await P.resetQuestion(uid, snap, s, l, n));
    },
    resetLesson: async (s: string, l: string) => {
      if (!uid) return;
      setSnap(await P.resetLesson(uid, snap, s, l));
    },
    resetSection: async (s: string) => {
      if (!uid) return;
      setSnap(await P.resetSection(uid, snap, s));
    },
    resetCourse: async () => {
      if (!uid) return;
      setSnap(await P.resetCourse(uid, snap));
    },
  };
}
