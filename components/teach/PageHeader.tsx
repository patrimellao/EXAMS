"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TeachSidebar } from "./TeachSidebar";

/**
 * Shared header for every teacher backoffice section. Replaces the per-page
 * inline `<header>` and the removed global top app-bar.
 *
 * On mobile it also hosts the only persistent chrome: a hamburger that opens a
 * slide-in drawer with the full sidebar. Trigger and content share one `Sheet`
 * subtree, so no layout↔page coordination is needed.
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="space-y-4">
      {breadcrumb}
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          {/* Mobile nav drawer trigger — the desktop sidebar isn't rendered below md */}
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 md:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <TeachSidebar onNavigate={() => setNavOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <h1 className="text-display font-sans">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground font-sans">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
      </header>
    </div>
  );
}
