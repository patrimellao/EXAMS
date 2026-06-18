"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  GraduationCap,
  Images,
  Layers,
  MoreHorizontal,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const sidebarItems: NavItem[] = [
  { href: "/wireframes/teach", label: "Asignaturas", icon: Layers },
  { href: "/wireframes/teach/media", label: "Media", icon: Images },
  { href: "#students", label: "Estudiantes", icon: Users, soon: true },
  { href: "#analytics", label: "Analítica", icon: BarChart3, soon: true },
];

const bottomNavItems: NavItem[] = [
  { href: "/wireframes/teach", label: "Asignaturas", icon: Layers },
  { href: "/wireframes/teach/media", label: "Media", icon: Images },
  { href: "#students", label: "Estudiantes", icon: Users, soon: true },
  { href: "#more", label: "Más", icon: MoreHorizontal },
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

export default function TeachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const allHrefs = [...sidebarItems, ...bottomNavItems].map((i) => i.href);

  return (
    <div className="flex h-[calc(100vh-2.5rem)] w-full overflow-hidden bg-muted/30">
      {/* Sidebar (md+) */}
      <aside className="fixed left-0 top-10 hidden h-[calc(100vh-2.5rem)] w-60 flex-col border-r bg-background md:flex">
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
        <nav className="flex-1 space-y-1 p-3">
          {sidebarItems.map((item) => {
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

        {/* Teacher identity (no gamification) */}
        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-card border bg-card p-3 shadow-card">
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
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex w-full min-w-0 flex-1 flex-col md:ml-60">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          {/* Mobile brand */}
          <Link
            href="/wireframes/teach"
            className="flex items-center gap-2 md:hidden"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-grad-brand text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-base font-black tracking-tight">
              TuFolio
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden sm:inline-flex"
            >
              <Link href="/wireframes/home">← Modo estudiante</Link>
            </Button>
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-grad-brand text-xs text-white">
                    G
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>García · Profesor</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Mi perfil</DropdownMenuItem>
                <DropdownMenuItem>Modo estudiante</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 pb-24 md:px-8 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-4 border-t bg-background md:hidden">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href, allHrefs);
          const disabled = item.soon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-disabled={disabled}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary",
                disabled
                  ? "pointer-events-none text-muted-foreground/40"
                  : active
                    ? "text-primary"
                    : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
