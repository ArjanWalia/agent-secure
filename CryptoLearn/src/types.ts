// Shared domain types for CryptoLearn.

// A single practice question inside a lesson. Content is intentionally empty
// for now — only the structure exists. `prompt`, `visual`, etc. get filled in
// later when course material is written.
export interface Question {
  number: number; // 1-based within the lesson
  prompt: string; // empty for now
  visual: string; // description/placeholder for the visual representation
}

export interface Lesson {
  id: string;
  title: string;
  content: string; // lesson body — empty for now
  questions: Question[];
}

export interface Section {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  sections: Section[];
}

// ---- Progress rows (mirror the Supabase tables) ----
export interface CourseProgressRow {
  user_id: string;
  course_id: string;
  completed: boolean;
}
export interface SectionProgressRow {
  user_id: string;
  course_id: string;
  section_id: string;
  completed: boolean;
}
export interface LessonProgressRow {
  user_id: string;
  course_id: string;
  section_id: string;
  lesson_id: string;
  completed: boolean;
}
export interface QuestionProgressRow {
  user_id: string;
  course_id: string;
  section_id: string;
  lesson_id: string;
  question_number: number;
  completed: boolean;
}

// A flat pointer to "where the user should resume".
export interface ResumeTarget {
  sectionId: string;
  lessonId: string;
  questionNumber: number;
}
