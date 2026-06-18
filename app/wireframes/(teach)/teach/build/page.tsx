import { redirect } from "next/navigation";

// The builder is split into two full-page editors. Default to the lessons one.
export default function BuilderIndexPage() {
  redirect("/wireframes/teach/build/lessons");
}
