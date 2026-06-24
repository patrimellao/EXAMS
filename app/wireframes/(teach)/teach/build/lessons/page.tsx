import { Suspense } from "react";
import { BuilderWorkspace } from "@/components/teach/BuilderWorkspace";

export default function BuilderLessonsPage() {
  return (
    <Suspense>
      <BuilderWorkspace mode="lessons" />
    </Suspense>
  );
}
