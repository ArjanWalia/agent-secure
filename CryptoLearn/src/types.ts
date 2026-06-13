// Shared domain types for CryptoLearn.

// A teaching page — explains one sub-topic of a lesson. `content` is empty for
// now (material is authored later); `title` is the sub-topic name. `visualId`
// optionally binds an interactive visual scene (see src/visuals/registry).
export interface TeachPage {
  title: string;
  content: string;
  visualId?: string;
}

// A question (used both for the per-teach-page question and for quiz questions).
// `prompt`/`visual` are empty for now — only the structure exists.
export interface Question {
  prompt: string;
  visual: string;
}

// A lesson is a sequence of (teach page → question) PAIRS, followed by a quiz.
export interface LessonPair {
  teach: TeachPage;
  question: Question;
}

export interface Lesson {
  id: string;
  title: string;
  pairs: LessonPair[]; // teach→question pairs, in order
  quiz: Question[]; // end-of-lesson quiz (5–10 questions)
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
