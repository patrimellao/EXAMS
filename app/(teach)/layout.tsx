import { redirect } from "next/navigation";
import { getUser } from "@/lib/getUser";
import { TeachSidebar } from "@/components/teach/TeachSidebar";

export default async function TeachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const role = (user as any)?.role;
  if (!user || role === "student") {
    redirect("/study");
  }

  return (
    <div className="flex h-[calc(100vh-2.5rem)] w-full overflow-hidden bg-muted/30">
      <aside className="fixed left-0 top-10 hidden h-[calc(100vh-2.5rem)] w-60 flex-col border-r md:flex">
        <TeachSidebar />
      </aside>

      <div className="flex w-full min-w-0 flex-1 flex-col md:ml-60">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
