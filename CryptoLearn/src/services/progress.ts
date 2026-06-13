import { supabase } from '../lib/supabase';
import { COURSE, flattenQuestions } from '../data/course';
import type { Course } from '../types';

// ============================================================================
// Progress data flow.
//
// Source of truth = question_progress. A lesson is "complete" when all its
// questions are complete; a section is complete when all its lessons are; the
// course is complete when all sections are. Every time question state changes
// we recompute and PERSIST the lesson/section/course rollups so the four
// Supabase tables always agree with each other and the UI.
// ============================================================================

const courseId = COURSE.id;

export function qKey(sectionId: string, lessonId: string, n: number) {
  return `${sectionId}/${lessonId}/${n}`;
}
export function lKey(sectionId: string, lessonId: string) {
  return `${sectionId}/${lessonId}`;
}

// A snapshot of which questions the user has completed.
export interface ProgressSnapshot {
  completedQuestions: Set<string>; // qKey()
}

// ---- Derived completion helpers (pure, given a snapshot) ----
export function isLessonComplete(
  snap: ProgressSnapshot,
  sectionId: string,
  lessonId: string,
  course: Course = COURSE,
): boolean {
  const section = course.sections.find((s) => s.id === sectionId);
  const lesson = section?.lessons.find((l) => l.id === lessonId);
  if (!lesson || lesson.questions.length === 0) return false;
  return lesson.questions.every((q) =>
    snap.completedQuestions.has(qKey(sectionId, lessonId, q.number)),
  );
}

export function isSectionComplete(
  snap: ProgressSnapshot,
  sectionId: string,
  course: Course = COURSE,
): boolean {
  const section = course.sections.find((s) => s.id === sectionId);
  if (!section || section.lessons.length === 0) return false;
  return section.lessons.every((l) => isLessonComplete(snap, sectionId, l.id, course));
}

export function isCourseComplete(snap: ProgressSnapshot, course: Course = COURSE): boolean {
  return course.sections.every((s) => isSectionComplete(snap, s.id, course));
}

// ---- Load ----
export async function loadProgress(userId: string): Promise<ProgressSnapshot> {
  const { data, error } = await supabase
    .from('question_progress')
    .select('section_id, lesson_id, question_number, completed')
    .eq('user_id', userId)
    .eq('course_id', courseId);
  if (error) throw error;

  const completed = new Set<string>();
  for (const row of data ?? []) {
    if (row.completed) {
      completed.add(qKey(row.section_id, row.lesson_id, row.question_number));
    }
  }
  return { completedQuestions: completed };
}

// ---- Persist rollups so all four tables stay consistent ----
async function persistRollups(userId: string, snap: ProgressSnapshot) {
  const sectionRows = COURSE.sections.map((s) => ({
    user_id: userId,
    course_id: courseId,
    section_id: s.id,
    completed: isSectionComplete(snap, s.id),
    updated_at: new Date().toISOString(),
  }));
  const lessonRows = COURSE.sections.flatMap((s) =>
    s.lessons.map((l) => ({
      user_id: userId,
      course_id: courseId,
      section_id: s.id,
      lesson_id: l.id,
      completed: isLessonComplete(snap, s.id, l.id),
      updated_at: new Date().toISOString(),
    })),
  );

  await supabase
    .from('lesson_progress')
    .upsert(lessonRows, { onConflict: 'user_id,section_id,lesson_id' });
  await supabase
    .from('section_progress')
    .upsert(sectionRows, { onConflict: 'user_id,section_id' });
  await supabase.from('course_progress').upsert(
    {
      user_id: userId,
      course_id: courseId,
      completed: isCourseComplete(snap),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,course_id' },
  );
}

// ---- Mutations ----
// Set a single question complete/incomplete, then recompute & persist rollups.
export async function setQuestion(
  userId: string,
  snap: ProgressSnapshot,
  sectionId: string,
  lessonId: string,
  questionNumber: number,
  completed: boolean,
): Promise<ProgressSnapshot> {
  const key = qKey(sectionId, lessonId, questionNumber);
  const next: ProgressSnapshot = { completedQuestions: new Set(snap.completedQuestions) };
  if (completed) next.completedQuestions.add(key);
  else next.completedQuestions.delete(key);

  await supabase.from('question_progress').upsert(
    {
      user_id: userId,
      course_id: courseId,
      section_id: sectionId,
      lesson_id: lessonId,
      question_number: questionNumber,
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,section_id,lesson_id,question_number' },
  );
  await persistRollups(userId, next);
  return next;
}

// Reset a set of questions to incomplete (false), then recompute & persist.
async function resetQuestions(
  userId: string,
  snap: ProgressSnapshot,
  targets: { sectionId: string; lessonId: string; questionNumber: number }[],
): Promise<ProgressSnapshot> {
  const next: ProgressSnapshot = { completedQuestions: new Set(snap.completedQuestions) };
  for (const t of targets) {
    next.completedQuestions.delete(qKey(t.sectionId, t.lessonId, t.questionNumber));
  }
  const rows = targets.map((t) => ({
    user_id: userId,
    course_id: courseId,
    section_id: t.sectionId,
    lesson_id: t.lessonId,
    question_number: t.questionNumber,
    completed: false,
    updated_at: new Date().toISOString(),
  }));
  await supabase
    .from('question_progress')
    .upsert(rows, { onConflict: 'user_id,section_id,lesson_id,question_number' });
  await persistRollups(userId, next);
  return next;
}

export function resetQuestion(
  userId: string,
  snap: ProgressSnapshot,
  sectionId: string,
  lessonId: string,
  questionNumber: number,
) {
  return resetQuestions(userId, snap, [{ sectionId, lessonId, questionNumber }]);
}

export function resetLesson(
  userId: string,
  snap: ProgressSnapshot,
  sectionId: string,
  lessonId: string,
) {
  const lesson = COURSE.sections
    .find((s) => s.id === sectionId)
    ?.lessons.find((l) => l.id === lessonId);
  const targets = (lesson?.questions ?? []).map((q) => ({
    sectionId,
    lessonId,
    questionNumber: q.number,
  }));
  return resetQuestions(userId, snap, targets);
}

export function resetSection(userId: string, snap: ProgressSnapshot, sectionId: string) {
  const section = COURSE.sections.find((s) => s.id === sectionId);
  const targets =
    section?.lessons.flatMap((l) =>
      l.questions.map((q) => ({ sectionId, lessonId: l.id, questionNumber: q.number })),
    ) ?? [];
  return resetQuestions(userId, snap, targets);
}

export function resetCourse(userId: string, snap: ProgressSnapshot) {
  return resetQuestions(userId, snap, flattenQuestions());
}

// ---- Resume ----
// First question (in course order) that is NOT complete. null => all done.
export function resumeTarget(snap: ProgressSnapshot) {
  for (const fq of flattenQuestions()) {
    if (!snap.completedQuestions.has(qKey(fq.sectionId, fq.lessonId, fq.questionNumber))) {
      return fq;
    }
  }
  return null;
}
