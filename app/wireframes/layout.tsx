import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function WireframesRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-background">
      <div className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/40 dark:text-amber-200">
            WIREFRAME
          </Badge>
          <span className="hidden sm:inline">
            Live mocks de Phase 2B (solo para review). No exponer en producción.
          </span>
        </div>
        <Link
          href="/wireframes"
          className="rounded-sm font-medium underline underline-offset-2 transition-colors duration-fast hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary dark:hover:text-amber-100"
        >
          Índice
        </Link>
      </div>
      {children}
    </div>
  );
}
