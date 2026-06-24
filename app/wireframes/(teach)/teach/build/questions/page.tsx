import { Suspense } from "react";
import { BuilderWorkspace } from "@/components/teach/BuilderWorkspace";

export default function BuilderQuestionsPage() {
  return (
    <Suspense>
      <BuilderWorkspace mode="questions" />
    </Suspense>
  );
}
