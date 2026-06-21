import { TeachSidebar } from "@/components/teach/TeachSidebar";

export default function TeachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-2.5rem)] w-full overflow-hidden bg-muted/30">
      {/* Desktop sidebar (md+). On mobile the same content lives in the
          PageHeader drawer, so there's no global top bar or bottom nav. */}
      <aside className="fixed left-0 top-10 hidden h-[calc(100vh-2.5rem)] w-60 flex-col border-r md:flex">
        <TeachSidebar />
      </aside>

      {/* Main */}
      <div className="flex w-full min-w-0 flex-1 flex-col md:ml-60">
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
