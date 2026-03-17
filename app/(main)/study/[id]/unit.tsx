import { UnitBanner } from './unit-banner';
import { LessonButton } from './lesson-button';
import { Quiz } from '@/schemas/quizzes';
import { Lesson } from '@/schemas/lessons';
import Link from 'next/link';
import { BookOpen, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type UnitProgressSnapshot = {
  lessonsCompleted: number;
  lessonsTotal: number;
  isUnlocked: boolean;
  completedAt: string | null;
} | null;

type Props = {
  id: number;
  subjectId: number;
  order: number;
  title: string;
  description: string;
  quizzes?: Quiz[];
  lessons: Lesson[];
  numberOfQuizzes: number;
  unitProgress: UnitProgressSnapshot;
  unlockPreviousRequired: boolean;
};

export const Unit = ({
  id,
  subjectId,
  order,
  title,
  description,
  quizzes,
  lessons,
  numberOfQuizzes,
  unitProgress,
  unlockPreviousRequired,
}: Props) => {
  // Unit is locked if it requires previous completion and hasn't been unlocked
  const isLocked = unlockPreviousRequired && !unitProgress?.isUnlocked && order > 1;

  return (
    <>
      <UnitBanner title={title} description={description} locked={isLocked} />

      {/* Lessons section */}
      {lessons.length > 0 && (
        <div className={cn("mb-4", isLocked && "pointer-events-none opacity-50")}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">
            Lecciones
          </p>
          <div className="grid gap-2">
            {lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={isLocked ? '#' : `/study/${subjectId}/lessons/${lesson.id}`}
                aria-disabled={isLocked}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors",
                  isLocked && "cursor-not-allowed"
                )}
                data-testid={`lesson-link-${lesson.id}`}
              >
                {isLocked ? (
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <BookOpen className="h-4 w-4 text-primary shrink-0" />
                )}
                <span className="text-sm font-medium truncate flex-1">{lesson.title}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {lesson.estimatedDurationMinutes && (
                    <span className="text-xs text-muted-foreground">
                      {lesson.estimatedDurationMinutes} min
                    </span>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    +{lesson.xpReward} XP
                  </Badge>
                </div>
              </Link>
            ))}
          </div>

          {/* Lesson progress bar */}
          {unitProgress && unitProgress.lessonsTotal > 0 && (
            <div className="mt-3 px-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progreso lecciones</span>
                <span>{unitProgress.lessonsCompleted}/{unitProgress.lessonsTotal}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (unitProgress.lessonsCompleted / unitProgress.lessonsTotal) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quiz buttons section */}
      <div className={cn("flex items-center flex-col relative", isLocked && "pointer-events-none opacity-50")}>
        {quizzes && quizzes.length > 0 ? (
          <>
            {quizzes.map((quiz: Quiz, index: number) => (
              <LessonButton
                key={quiz.id}
                id={quiz.id}
                index={index + 1}
                totalCount={numberOfQuizzes}
                current={quiz.score === null || quiz.score < 70}
                locked={isLocked}
                percentage={quiz.score ?? 0}
              />
            ))}
            {quizzes.length < numberOfQuizzes &&
              Array(numberOfQuizzes - quizzes.length)
                .fill(0)
                .map((_, index) => (
                  <LessonButton
                    key={`placeholder-${index}`}
                    id={2222}
                    index={quizzes.length + index + 1}
                    totalCount={numberOfQuizzes}
                    current={false}
                    locked={true}
                    percentage={0}
                  />
                ))}
          </>
        ) : (
          <div className="opacity-50">
            {Array(numberOfQuizzes)
              .fill(0)
              .map((_, index) => (
                <LessonButton
                  key={`empty-${index}`}
                  id={2222}
                  index={index + 1}
                  totalCount={numberOfQuizzes}
                  current={false}
                  locked={true}
                  percentage={0}
                />
              ))}
          </div>
        )}
      </div>
    </>
  );
};
