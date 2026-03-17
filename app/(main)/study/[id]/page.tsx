import { redirect } from 'next/navigation';

import { Quests } from '@/components/quests';
import { FeedWrapper } from '@/components/feed-wrapper';
import { StickyWrapper } from '@/components/sticky-wrapper';

import { Unit } from './unit';
import { getActiveUnits, getUnitProgressForUser } from '@/controllers/unit';
import { getLessonsForUnit } from '@/controllers/lessons';

import { getUser } from "@/lib/getUser";
import { UUID } from 'crypto';

const LearnPage = async ({ params }: { params: { id: string } }) => {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const subjectId = Number(params.id);
  const [units, unitProgressList] = await Promise.all([
    getActiveUnits(subjectId, user.id as UUID),
    getUnitProgressForUser(user.id, subjectId),
  ]);

  // Build a map unitId → progress for quick lookup
  const progressMap = Object.fromEntries(
    unitProgressList.map((p) => [p.unitId, p])
  );

  // Load lessons per unit in parallel
  const lessonsPerUnit = await Promise.all(
    units.map((unit) => getLessonsForUnit(unit.id))
  );
  const lessonsMap = Object.fromEntries(
    units.map((unit, i) => [unit.id, lessonsPerUnit[i]])
  );

  return (
    <div className="flex flex-row-reverse gap-[24px] p-6">
      <StickyWrapper>
        <Quests />
      </StickyWrapper>
      <FeedWrapper>
        {units.map((unit) => (
          <Unit
            key={unit.id}
            id={unit.id}
            subjectId={subjectId}
            order={unit.order}
            description={unit.description}
            title={unit.name}
            quizzes={unit.quizzes}
            lessons={lessonsMap[unit.id] ?? []}
            numberOfQuizzes={unit.numOfQuizzes}
            unitProgress={progressMap[unit.id] ?? null}
            unlockPreviousRequired={unit.unlockPreviousRequired}
          />
        ))}
      </FeedWrapper>
    </div>
  );
};

export default LearnPage;
