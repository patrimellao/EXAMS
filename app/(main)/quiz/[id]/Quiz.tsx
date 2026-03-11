'use client';
import { useEffect, useState } from 'react';
import Test from './Test';
import { QuizResults } from './QuizResults';
import { submitQuiz } from '@/controllers/quizzes';
import { toast as sonnerToast } from 'sonner';

export type quizAnswers = {
  userId: string;
  results: {
    questionId: number;
    correct: boolean;
  }[];
};

const getEmoji = (type: number) => {
  switch (type) {
    case 1:  return '✍️';
    case 2:  return '🏅';
    case 3:  return '💯';
    default: return '🏆';
  }
};

type QuizOutcome = {
  xpEarned: number;
  streak:   number;
};

export function Quiz({
  questions,
  user,
  previousScore,
  quizId,
}: {
  questions:     any[];
  user:          any;
  previousScore: any;
  quizId:        number;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers,         setAnswers]         = useState<any[]>([]);
  const [outcome,         setOutcome]         = useState<QuizOutcome | null>(null);

  function getScore() {
    const correct = answers.reduce(
      (acc: number, a: any) => (a.correct ? acc + 1 : acc),
      0,
    );
    return Math.round((correct * 100) / questions.length);
  }

  useEffect(() => {
    if (currentQuestion < questions.length) return;

    const score: quizAnswers = { userId: user!.id, results: answers };
    const pct = getScore();

    submitQuiz(score, pct, previousScore, quizId).then(result => {
      if (result) {
        setOutcome({ xpEarned: result.xpEarned, streak: result.streak });
        result.achievements.forEach((a: any) => {
          sonnerToast(
            `${getEmoji(a.type as number)} ${a.name as string}`,
            { description: a.description as string },
          );
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  return (
    <>
      {currentQuestion < questions.length ? (
        <Test
          question={questions[currentQuestion].question.question}
          setCurrentQuestion={setCurrentQuestion}
          setAnswers={setAnswers}
          progress={(currentQuestion * 100) / questions.length}
          answers={questions[currentQuestion].question.answers}
        />
      ) : (
        <QuizResults
          getScore={getScore}
          xpEarned={outcome?.xpEarned ?? 0}
          streak={outcome?.streak ?? 0}
          isNewRecord={previousScore == null || getScore() > previousScore}
        />
      )}
    </>
  );
}
