import { getLeaderboard, LeaderboardEntry } from "@/controllers/leaderboard";
import { getUser } from "@/lib/getUser";
import { getEnrolledSubjects } from "@/controllers/subjects";
import { UUID } from "crypto";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import LeaderboardTabs from "./LeaderboardTabs";

type PageProps = {
  searchParams: { subjectId?: string };
};

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal  className="h-5 w-5 text-slate-400"  />;
  if (rank === 3) return <Award  className="h-5 w-5 text-amber-700"  />;
  return <span className="text-muted-foreground text-sm font-mono w-5 text-center">{rank}</span>;
};

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const user       = await getUser();
  const subjectId  = searchParams.subjectId ? Number(searchParams.subjectId) : undefined;
  const [entries, subjects] = await Promise.all([
    getLeaderboard(subjectId),
    user ? getEnrolledSubjects(user.id as UUID) : [],
  ]);

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-3xl mx-auto w-full">
      <div className="w-full flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">Ranking</h1>
        {user && (
          <Badge variant="outline">
            #{entries.find(e => e.userId === user.id)?.rank ?? "–"} your position
          </Badge>
        )}
      </div>

      {/* Subject filter tabs */}
      <LeaderboardTabs subjects={subjects} activeSubjectId={subjectId} />

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">
            {subjectId
              ? subjects.find(s => s.id === subjectId)?.name ?? "Subject"
              : "Global"}{" "}
            · top {entries.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14 text-center">#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No data yet. Complete a quiz to appear here!
                  </TableCell>
                </TableRow>
              )}
              {entries.map((entry: LeaderboardEntry) => {
                const isMe = user?.id === entry.userId;
                return (
                  <TableRow
                    key={entry.userId}
                    className={cn(isMe && "bg-primary/5 font-semibold")}
                  >
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <RankIcon rank={entry.rank} />
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.name}
                      {isMe && (
                        <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.totalPoints.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
