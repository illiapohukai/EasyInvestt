/**
 * Typed structure for all learning content.
 *
 * Text fields support a minimal inline markup: **Begriff** renders as bold text.
 * Content is plain data (no JSX) so it can be validated in tests.
 */

export const LESSON_IDS = [
  "grundlagen",
  "zinseszins",
  "anlageklassen",
  "kleine-betraege",
  "altersvorsorge",
  "staat",
] as const;

export type LessonId = (typeof LESSON_IDS)[number];

/** Key of the interactive element rendered for a lesson. */
export type InteractiveKind =
  | "inflation"
  | "interest-steps"
  | "asset-classes"
  | "budget"
  | "retirement-timeline"
  | "state-programs";

export type LessonIconName =
  "lightbulb" | "trending-up" | "layers" | "piggy-bank" | "hourglass" | "landmark";

export interface Term {
  term: string;
  definition: string;
}

export interface LessonSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  terms?: Term[];
}

export interface QuizOption {
  id: string;
  text: string;
  /** Explains why this option is right or wrong. Shown after selecting it. */
  feedback: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
}

export interface Lesson {
  id: LessonId;
  title: string;
  /** Short label for compact lists. */
  shortTitle: string;
  icon: LessonIconName;
  /** One sentence for overview cards. */
  teaser: string;
  intro: string;
  /** Estimated reading and practice time in minutes. */
  minutes: number;
  sections: LessonSection[];
  example: {
    title: string;
    paragraphs: string[];
  };
  interactive: {
    kind: InteractiveKind;
    title: string;
    description: string;
  };
  /** "Merke" summary. */
  takeaways: string[];
  quiz: QuizQuestion[];
}
