export interface Profile {
  id: string;
  username: string;
  role: "owner" | "student";
  created_at: string;
}

export interface Question {
  text: string;
  options: string[]; // ["A. ...", "B. ...", "C. ...", "D. ..."]
  correctIndex: number;
  short: boolean; // true = render 2-column grid
}

export interface Exam {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  questions: Question[];
  upload_date: string;
  exp_date: string;
  created_at: string;
}

export interface AnswerState {
  chosen: number;
  correct: boolean;
  attempts: number;
}

export interface Result {
  id: string;
  exam_id: string;
  user_id: string;
  answers: Record<number, AnswerState>;
  correct_count: number;
  total_count: number;
  score: number;
  elapsed_seconds: number;
  finished_at: string;
}
