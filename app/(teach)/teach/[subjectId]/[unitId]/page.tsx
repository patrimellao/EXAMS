/**
 * UC-23 / UC-24 · Teacher Backoffice — wired Content Builder (§3.12)
 * Teacher Backoffice Phase 1 — Task 7
 *
 * Server Component: loads the unit's questions + lessons and renders the WIRED
 * builder (<BuilderWorkspaceLive>). `mode` comes from ?tab= ('lessons' | else
 * 'questions'). DB rows are mapped here into the builder's view-model shapes.
 */
import { getQuestionsFromUnit } from "@/controllers/questions";
import { getLessonsForUnit, getLessonResources } from "@/controllers/lessons";
import { DEFAULT_HERO } from "@/lib/teach/hero";
import { deriveLessonRefStatus, type LessonRef } from "@/lib/teach/lesson-ref";
import {
  BuilderWorkspaceLive,
  type BuilderQuestion,
  type BuilderLesson,
  type BuilderDifficulty,
  type BuilderHero,
  type BuilderLessonRef,
} from "@/components/teach/live/BuilderWorkspaceLive";

// DB difficulty literal → accented UI label used by the builder toggle.
const DB_TO_DIFFICULTY: Record<string, BuilderDifficulty> = {
  facil: "fácil",
  normal: "normal",
  dificil: "difícil",
};

// The builder reads hero.gradient / hero.color / hero.image?.url directly, so we
// fill sensible defaults for any hero shape persisted as jsonb (or null).
function normalizeHero(raw: unknown): BuilderHero {
  const h = (raw ?? {}) as Partial<BuilderHero>;
  return {
    type: h.type ?? DEFAULT_HERO.type,
    gradient: h.gradient ?? DEFAULT_HERO.gradient ?? "brand",
    color: h.color ?? "brand-primary",
    image: h.image ?? { url: "", alt: "" },
  };
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export default async function BuilderPage({
  params,
  searchParams,
}: {
  params: { subjectId: string; unitId: string };
  searchParams: { tab?: string };
}) {
  const subjectId = Number(params.subjectId);
  const unitId = Number(params.unitId);

  const [rawQuestions, rawLessons] = await Promise.all([
    getQuestionsFromUnit(unitId),
    getLessonsForUnit(unitId),
  ]);

  // Lesson markdown keyed by id — used to derive each quote-anchored question's
  // sync status at load time (the anchor markers live inside contentText).
  const lessonMarkdownById = new Map<number, string>(
    rawLessons.map((l) => [l.id, l.contentText ?? ""]),
  );

  const initialQuestions: BuilderQuestion[] = rawQuestions.map((q) => {
    const lessonRef = (q.lessonRef as BuilderLessonRef) ?? null;
    // Derive synced|drift|orphan from the linked lesson's markdown so the
    // builder shows the quote's status immediately on load (not just after an
    // edit). Questions with no lessonRef carry a null status.
    const refStatus =
      lessonRef && q.lessonId != null
        ? deriveLessonRefStatus(
            lessonRef as LessonRef,
            lessonMarkdownById.get(q.lessonId) ?? "",
          )
        : null;
    return {
      id: q.id,
      label: q.label ?? "",
      dirty: false,
      text: q.question ?? "",
      difficulty: DB_TO_DIFFICULTY[q.difficulty ?? "normal"] ?? "normal",
      lessonId: q.lessonId ?? null,
      lessonRef,
      refStatus,
      explanation: q.explanation ?? "",
      answers: (q.answers ?? []).map((a) => ({
        id: a.id,
        text: a.name ?? "",
        correct: !!a.correct,
      })),
    };
  });

  // Lesson counts per unit are small, so loading resources per lesson is fine.
  const initialLessons: BuilderLesson[] = await Promise.all(
    rawLessons.map(async (l) => {
      const resources = await getLessonResources(l.id);
      return {
        id: l.id,
        title: l.title,
        subtitle: l.subtitle ?? "",
        hero: normalizeHero(l.hero),
        order: l.order,
        duration: l.estimatedDurationMinutes ?? 5,
        xp: l.xpReward,
        type: l.type,
        content: l.contentText ?? "",
        files: resources.map((r) => ({
          id: r.id,
          name: r.title,
          size: r.size ? formatBytes(r.size) : "",
          status: r.status ?? "ready",
        })),
      };
    }),
  );

  return (
    <BuilderWorkspaceLive
      subjectId={subjectId}
      unitId={unitId}
      initialQuestions={initialQuestions}
      initialLessons={initialLessons}
      mode={searchParams.tab === "lessons" ? "lessons" : "questions"}
    />
  );
}
