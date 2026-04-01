export enum Subject {
  BIOLOGY = "Biology",
  CHEMISTRY = "Chemistry",
  PHYSICS = "Physics",
  ENGLISH = "English",
  LOGICAL_REASONING = "Logical Reasoning"
}

export type Difficulty = "Easy" | "Medium" | "Hard" | "Very Hard";
export type AppMode = "Topic Practice" | "Full Exam";

export interface MCQ {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: "A" | "B" | "C" | "D";
  explanation: string;
  pastPaperReference: string;
  isRepeatedConcept: boolean;
  topic?: string;
}

export interface ExamPaper {
  id: string;
  userId: string;
  subject: Subject;
  topic: string;
  mcqs: MCQ[];
  createdAt: string;
  isPublic?: boolean;
}

export interface GenerationRequest {
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
}

export interface UserAnswer {
  mcqId: string;
  userAnswer: "A" | "B" | "C" | "D" | null;
  correctAnswer: "A" | "B" | "C" | "D";
  subject: Subject;
  topic: string;
  timeSpent: number; // in seconds
}

export interface ExamAnalysis {
  accuracy: Record<string, number>;
  weak_topics: string[];
  time_per_question: Record<string, number>;
  suggestions: string[];
}

export type FeedbackType = "issue" | "suggestion" | "other";

export interface Feedback {
  id: string;
  userId?: string;
  userEmail?: string;
  type: FeedbackType;
  mcqId?: string;
  content: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  streakDays: number;
  lastLoginDate: string;
  totalPoints: number;
  lastQuizCompletedDate?: string;
  totalAttempted: number;
  totalCorrect: number;
  masteredTopics: string[];
  level: number;
  xp: number;
  earnedBadges: string[];
}

export interface GamificationUpdate {
  level: number;
  XP: number;
  earned_badges: string[];
  next_badge: string;
  message: string;
}

export interface StreakUpdate {
  current_streak_days: number;
  reward_points_earned: number;
  streak_broken: boolean;
  message: string;
}

export interface RevisionQuestion {
  question_id: string;
  topic: string;
  explanation: string;
  review_day: string;
}

export interface RevisionPlan {
  revision_plan: RevisionQuestion[];
}

export interface StudyNotification {
  notification_type: 'streak_reminder' | 'streak_motivation' | 'new_content' | 'topic_focus';
  title: string;
  message: string;
  scheduled_time: string;
}
