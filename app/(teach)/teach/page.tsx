import { count } from "drizzle-orm";
import { units } from "@/drizzle/schema";
import { db } from "@/utils/drizzle/db";
import { allSubjects } from "@/controllers/subjects";
import { SubjectsBoard, type SubjectWithUnitCount } from "@/components/teach/live/SubjectsBoard";

export default async function TeachSubjectsPage() {
  const subjects = await allSubjects();

  // Single grouped query for the "N unidades" count per subject — avoids an
  // N+1 (one getSubject() call per subject). allSubjects() itself returns
  // plain rows with no unit count.
  const unitCounts = await db
    .select({ subjectId: units.subjectId, count: count() })
    .from(units)
    .groupBy(units.subjectId);
  const unitCountBySubjectId = new Map(unitCounts.map((row) => [row.subjectId, row.count]));

  const subjectsWithUnitCount: SubjectWithUnitCount[] = subjects.map((subject) => ({
    ...subject,
    unitsCount: unitCountBySubjectId.get(subject.id) ?? 0,
  }));

  return <SubjectsBoard subjects={subjectsWithUnitCount} />;
}
