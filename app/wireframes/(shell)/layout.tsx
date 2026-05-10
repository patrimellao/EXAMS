"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Home,
  MoreHorizontal,
  Newspaper,
  Search,
  Settings,
  Trophy,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/ModeToggle";
import { StreakBadge } from "@/components/game/StreakBadge";
import { XPBar } from "@/components/game/XPBar";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { href: "/wireframes/home", label: "Inicio", icon: Home },
  { href: "/wireframes/courses", label: "Mis cursos", icon: BookOpen },
  { href: "/wireframes/leaderboard", label: "Ranking", icon: Trophy },
  { href: "/wireframes/news", label: "Noticias", icon: Newspaper },
  { href: "/wireframes/settings", label: "Ajustes", icon: Settings },
];

const bottomNavItems = [
  { href: "/wireframes/home", label: "Inicio", icon: Home },
  { href: "/wireframes/courses", label: "Cursos", icon: BookOpen },
  { href: "/wireframes/leaderboard", label: "Ranking", icon: Trophy },
  { href: "#more", label: "Más", icon: MoreHorizontal },
];

function isActive(pathname: string, href: string) {
  if (href === "/wireframes/home") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-2.5rem)] w-full bg-muted/30">
      {/* Sidebar (md+) */}
      <aside className="sticky top-10 hidden h-[calc(100vh-2.5rem)] w-60 flex-col border-r bg-background md:flex">
        {/* Brand */}
        <div className="flex h-14 items-center gap-2 border-b px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-card bg-grad-brand text-white shadow-card">
            <BookOpen className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <span className="text-lg font-black tracking-tight">TuFolio</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
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

        {/* User card */}
        <div className="border-t p-3">
          <div className="rounded-card border bg-card p-3 shadow-card">
            <div className="mb-3 flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-brand-primary/20">
                  <AvatarFallback className="bg-grad-trust font-semibold text-white">
                    M
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-pill bg-grad-warm text-[10px] font-black text-white ring-2 ring-card">
                  12
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold leading-tight">Manu</p>
                <p className="text-xs text-muted-foreground">Nivel 12</p>
              </div>
              <StreakBadge count={12} size="sm" />
            </div>
            <XPBar value={1240} max={1600} showLabel size="sm" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex w-full min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-10 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          {/* Mobile brand */}
          <Link href="/wireframes/home" className="flex items-center gap-2 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-grad-brand text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-base font-black tracking-tight">TuFolio</span>
          </Link>

          {/* Search */}
          <div className="ml-auto flex w-full max-w-md items-center md:ml-0">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar asignaturas, lecciones, tests…"
                className="pl-9"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" aria-label="Notificaciones">
              <Bell className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-grad-trust text-xs text-white">
                    M
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Manu Pérez</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Mi perfil</DropdownMenuItem>
                <DropdownMenuItem>Modo profesor</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-6">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-4 border-t bg-background md:hidden">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary",
                active ? "text-primary" : "text-muted-foreground",
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
