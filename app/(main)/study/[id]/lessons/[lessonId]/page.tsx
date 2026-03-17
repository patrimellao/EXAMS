import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/lib/getUser';
import { getLessonWithProgress } from '@/controllers/lessons';
import { getActiveUnits } from '@/controllers/unit';
import { UUID } from 'crypto';
import { LessonReader } from './LessonReader';
import BackLink from '@/components/BackLink';

type Props = {
  params: { id: string; lessonId: string };
};

export default async function LessonPage({ params }: Props) {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const data = await getLessonWithProgress(Number(params.lessonId), user.id);
  if (!data) notFound();

  const { lesson, progress, resources } = data;

  return (
    <div className="flex gap-6 p-6 max-w-5xl mx-auto">
      {/* Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <BackLink href={`/study/${params.id}`} label="Volver a la unidad" />
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="mb-4 lg:hidden">
          <BackLink href={`/study/${params.id}`} label="Volver" />
        </div>
        <LessonReader
          lessonId={lesson.id}
          title={lesson.title}
          type={lesson.type}
          contentText={lesson.contentText ?? null}
          estimatedDurationMinutes={lesson.estimatedDurationMinutes ?? null}
          xpReward={lesson.xpReward}
          resources={resources}
          alreadyCompleted={progress?.status === 'completed'}
        />
      </main>
    </div>
  );
}
