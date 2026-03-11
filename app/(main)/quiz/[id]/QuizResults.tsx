'use client';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Star, Zap, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import JSConfetti from 'js-confetti';

type Props = {
  getScore:    () => number;
  xpEarned:   number;
  streak:     number;
  isNewRecord: boolean;
};

export function QuizResults({ getScore, xpEarned, streak, isNewRecord }: Props) {
  const router = useRouter();
  const score  = getScore();
  const passed = score >= 70;

  const jsConfetti = new JSConfetti();
  let emojis: string[];
  if      (score < 50)  emojis = ['😢', '😭', '😞'];
  else if (score < 70)  emojis = ['⭐', '🙀', '🎈'];
  else if (score > 98)  emojis = ['💥', '😎', '✨', '🎉', '🎊'];
  else                  emojis = ['✨', '🎉', '🎊'];

  confetti(emojis);

  return (
    <div className="flex flex-col h-full flex-1 justify-center items-center gap-6 p-6">
      <Button
        variant="default"
        className="h-[70px] w-[70px] border-b-8 rounded-full"
        onClick={() => confetti(emojis)}
      >
        <Star className={cn('h-10 w-10', 'fill-white text-white')} />
      </Button>

      <Progress className="w-1/2" value={score} />
      <h2 className="text-4xl font-bold animate-in">
        {score.toFixed(0)}%
      </h2>

      {passed && (
        <p className="animate-wiggle font-semibold text-foreground text-2xl">
          Quiz passed!
        </p>
      )}

      {/* XP + streak summary — only shown on new record */}
      {isNewRecord && (xpEarned > 0 || streak > 0) && (
        <div className="flex gap-6 animate-in fade-in">
          {xpEarned > 0 && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-yellow-500 font-bold text-xl">
                <Zap className="h-5 w-5 fill-yellow-500" />
                +{xpEarned} XP
              </div>
              <span className="text-xs text-muted-foreground">earned</span>
            </div>
          )}
          {streak > 0 && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-orange-500 font-bold text-xl">
                <Flame className="h-5 w-5 fill-orange-500" />
                {streak}
              </div>
              <span className="text-xs text-muted-foreground">day streak</span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <Button
          onClick={() => window.location.reload()}
          variant="secondary"
          className={cn('py-2 px-4', passed ? 'hidden' : 'animate-wiggle')}
        >
          Try again
        </Button>
        <Button
          onClick={() => { router.back(); router.refresh(); }}
          variant="secondary"
          className="py-2 px-4"
        >
          Finish
        </Button>
      </div>
    </div>
  );

  function confetti(emojis: string[] = ['🎉', '🎊']) {
    void jsConfetti.addConfetti({ emojis });
  }
}
