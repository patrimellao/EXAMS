/**
 * Drizzle schema barrel.
 * Re-exports every table from schemas/ and defines all ORM relations used by
 * db.query.xxx.findFirst/findMany({ with: { ... } }).
 *
 * Import order matters: relations import the table constants directly from
 * schemas/ to avoid circular-export issues.
 */

// ── Tables ──────────────────────────────────────────────────────────────────
export * from '@/schemas/achievements';
export * from '@/schemas/answers';
export * from '@/schemas/daily_activity';
export * from '@/schemas/languages';
export * from '@/schemas/lesson_progress';
export * from '@/schemas/lesson_resources';
export * from '@/schemas/lessons';
export * from '@/schemas/questions';
export * from '@/schemas/quiz_details';
export * from '@/schemas/quizzes';
export * from '@/schemas/students';
export * from '@/schemas/subjects';
export * from '@/schemas/subscriptions';
export * from '@/schemas/teachers';
export * from '@/schemas/unit_progress';
export * from '@/schemas/units';
export * from '@/schemas/userSubjects';
export * from '@/schemas/user_achievements';
export * from '@/schemas/user_stats';
export * from '@/schemas/users';
export * from '@/schemas/xp_transactions';

// ── Relations ────────────────────────────────────────────────────────────────
import { relations } from 'drizzle-orm';
import { quizzes }        from '@/schemas/quizzes';
import { quizDetails }    from '@/schemas/quiz_details';
import { questions }      from '@/schemas/questions';
import { answers }        from '@/schemas/answers';
import { units }          from '@/schemas/units';
import { subjects }       from '@/schemas/subjects';
import { users }          from '@/schemas/users';
import { achievements }   from '@/schemas/achievements';
import { userAchievement } from '@/schemas/user_achievements';
import { xpTransactions } from '@/schemas/xp_transactions';
import { lessons }        from '@/schemas/lessons';
import { lessonProgress } from '@/schemas/lesson_progress';
import { userSubjects }   from '@/schemas/userSubjects';

export const usersRelations = relations(users, ({ many }) => ({
  quizzes:         many(quizzes),
  userAchievements: many(userAchievement),
  xpTransactions:  many(xpTransactions),
  enrolledSubjects: many(userSubjects),
  lessonProgress:  many(lessonProgress),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  unit:        one(units,  { fields: [quizzes.unitId],  references: [units.id] }),
  user:        one(users,  { fields: [quizzes.userId],  references: [users.id] }),
  quizDetails: many(quizDetails),
}));

export const quizDetailsRelations = relations(quizDetails, ({ one }) => ({
  quiz:     one(quizzes,   { fields: [quizDetails.quizId],     references: [quizzes.id] }),
  question: one(questions, { fields: [quizDetails.questionId], references: [questions.id] }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  unit:        one(units,       { fields: [questions.unitId], references: [units.id] }),
  answers:     many(answers),
  quizDetails: many(quizDetails),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, { fields: [answers.questionId], references: [questions.id] }),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  subject:   one(subjects, { fields: [units.subjectId], references: [subjects.id] }),
  quizzes:   many(quizzes),
  questions: many(questions),
  lessons:   many(lessons),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  units:           many(units),
  enrolledStudents: many(userSubjects),
}));

export const userSubjectsRelations = relations(userSubjects, ({ one }) => ({
  user:    one(users,    { fields: [userSubjects.userId],    references: [users.id] }),
  subject: one(subjects, { fields: [userSubjects.subjectId], references: [subjects.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievement),
}));

export const userAchievementRelations = relations(userAchievement, ({ one }) => ({
  user:        one(users,        { fields: [userAchievement.userId],        references: [users.id] }),
  achievement: one(achievements, { fields: [userAchievement.achievementId], references: [achievements.id] }),
}));

export const xpTransactionsRelations = relations(xpTransactions, ({ one }) => ({
  user: one(users, { fields: [xpTransactions.userId], references: [users.id] }),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  unit:     one(units, { fields: [lessons.unitId], references: [units.id] }),
  progress: many(lessonProgress),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  lesson: one(lessons, { fields: [lessonProgress.lessonId], references: [lessons.id] }),
  user:   one(users,   { fields: [lessonProgress.userId],   references: [users.id] }),
}));
