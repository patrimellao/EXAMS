"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronsUpDown,
  GraduationCap,
  Images,
  Layers,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/ModeToggle";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Layers;
  soon?: boolean;
};

const navItems: NavItem[] = [
  { href: "/wireframes/teach", label: "Asignaturas", icon: Layers },
  { href: "/wireframes/teach/media", label: "Media", icon: Images },
  { href: "#students", label: "Estudiantes", icon: Users, soon: true },
  { href: "#analytics", label: "Analítica", icon: BarChart3, soon: true },
];

function isActive(pathname: string, href: string, allHrefs: string[]) {
  if (href.startsWith("#")) return false;
  if (pathname === href) return true;
  if (!pathname.startsWith(href + "/")) return false;
  // Don't activate a parent route if a more-specific sibling also matches.
  return !allHrefs.some(
    (other) =>
      other !== href &&
      !other.startsWith("#") &&
      other.startsWith(href + "/") &&
      (pathname === other || pathname.startsWith(other + "/")),
  );
}

/**
 * Inner content of the teacher backoffice sidebar — brand, primary nav, and a
 * footer that owns the global controls (theme + identity menu) that used to live
 * in the now-removed top app-bar.
 *
 * Rendered in two places: the desktop fixed rail (in the layout) and the mobile
 * slide-in drawer (inside PageHeader). `onNavigate` lets the drawer close itself
 * when a link is tapped.
 */
export function TeachSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const allHrefs = navItems.map((i) => i.href);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-card bg-grad-brand text-white shadow-card">
          <GraduationCap className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black leading-tight tracking-tight">
            TuFolio
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Profesor
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href, allHrefs);
          if (item.soon) {
            return (
              <div
                key={item.href}
                aria-disabled
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/50"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                <Badge
                  variant="secondary"
                  className="ml-auto text-[10px] font-medium"
                >
                  Próximamente
                </Badge>
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: theme toggle + identity menu (absorbed from the old top bar) */}
      <div className="space-y-2 border-t p-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-xs font-medium text-muted-foreground">Tema</span>
          <ModeToggle />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-card border bg-card p-3 text-left shadow-card transition-colors duration-fast hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-grad-brand font-semibold text-white">
                  G
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold leading-tight">
                  García
                </p>
                <p className="text-xs text-muted-foreground">Profesor</p>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel>García · Profesor</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Mi perfil</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/wireframes/home">Modo estudiante</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
