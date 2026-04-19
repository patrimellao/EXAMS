import { getActiveSubjects } from '@/controllers/subjects';
import { Enroll } from '@/app/(main)/study/[id]/enroll';
import SubjectNavigation from './SubjectNavigation';
import { Subject } from '@/schemas/subjects';
import { getUser } from '@/lib/getUser';
import { redirect } from 'next/navigation';
import { UserStatsBar } from './UserStatsBar';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Button } from './ui/button';

export default async function StudentSidebar() {
  const user = await getUser();

  if (!user?.id) return redirect('/sign-in');

  const subjects: Subject[] = await getActiveSubjects(user.id);
  return (
    <div className="flex flex-col flex-1 md:border-r pt-2 h-full max-h-screen">
      <div className="py-2 flex-1">
        <div className="flex items-center pl-7 pr-3 justify-between mb-2">
          <h3 className="font-semibold text-lg tracking-tight">Subjects</h3>
          <Enroll user={user} />
        </div>
        <SubjectNavigation subjects={subjects} path="study" />
      </div>

      {/* Leaderboard link */}
      <div className="px-3 pb-1">
        <Link href="/leaderboard">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
            <Trophy className="mr-2 h-4 w-4" />
            Ranking
          </Button>
        </Link>
      </div>

      {/* XP bar + streak + points */}
      <UserStatsBar />
    </div>
  );
}
