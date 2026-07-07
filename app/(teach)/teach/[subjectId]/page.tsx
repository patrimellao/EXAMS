import { notFound } from "next/navigation";
import { count, inArray } from "drizzle-orm";
import { questions } from "@/drizzle/schema";
import { db } from "@/utils/drizzle/db";
import { getSubject } from "@/controllers/subjects";
import { getUnits } from "@/controllers/unit";
import { getLessonsForUnit } from "@/controllers/lessons";
import { SyllabusBoard } from "@/components/teach/live/SyllabusBoard";

export default async function SyllabusPage({
  params,
}: {
  params: { subjectId: string };
}) {
  const subjectId = Number(params.subjectId);

  // getSubject() already returns a flat subject row with an embedded
  // `units` array (it left-joins units and unwraps the single result), so
  // it is safe to use directly as the `subject` prop — just drop the
  // embedded `units` field since getUnits() below is the source of truth
  // for the units list (per the task brief).
  const subjectResult = await getSubject(subjectId);
  if (!subjectResult) notFound();
  const { units: _embeddedUnits, ...subject } = subjectResult;

  const units = await getUnits(subjectId);

  const lessonsByUnit: Record<number, Awaited<ReturnType<typeof getLessonsForUnit>>> = {};
  for (const unit of units) {
    lessonsByUnit[unit.id] = await getLessonsForUnit(unit.id);
  }

  // Single grouped query for "Preguntas" count per lesson — avoids an N+1
  // (one count query per lesson). Lessons that predate the `lessonId`
  // column simply get 0 (no matching row in the grouped result).
  const allLessonIds = Object.values(lessonsByUnit).flatMap((lessons) =>
    lessons.map((lesson) => lesson.id)
  );
  const questionCountByLesson: Record<number, number> = {};
  if (allLessonIds.length > 0) {
    const rows = await db
      .select({ lessonId: questions.lessonId, count: count() })
      .from(questions)
      .where(inArray(questions.lessonId, allLessonIds))
      .groupBy(questions.lessonId);
    for (const row of rows) {
      if (row.lessonId != null) questionCountByLesson[row.lessonId] = row.count;
    }
  }

  return (
    <SyllabusBoard
      subject={subject}
      units={units}
      lessonsByUnit={lessonsByUnit}
      questionCountByLesson={questionCountByLesson}
    />
  );
}
