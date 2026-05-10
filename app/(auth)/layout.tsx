import Link from "next/link";
import { BookOpen, GraduationCap } from "lucide-react";
import { GradientHero } from "@/components/game/GradientHero";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <section className="flex w-full flex-col px-6 py-10 lg:px-12 lg:py-12">
        <Link
          href="/"
          className="flex items-center gap-2 self-start text-foreground"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-card bg-foreground text-background">
            <BookOpen className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold tracking-tight">TuFolio</span>
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        <p className="self-start text-xs text-muted-foreground">
          © {new Date().getFullYear()} TuFolio · Preparación de oposiciones
        </p>
      </section>

      <aside className="hidden lg:block">
        <GradientHero
          variant="brand"
          decorative={false}
          className="flex h-full w-full flex-col justify-between p-14"
        >
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-white/10 ring-1 ring-white/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-medium tracking-tight">TuFolio</span>
          </div>

          <h2 className="font-reader text-4xl font-medium leading-[1.15] tracking-tight text-white md:text-5xl">
            Preparación rigurosa
            <br />
            para tus oposiciones.
          </h2>

          <p className="text-xs uppercase tracking-[0.18em] text-white/55">
            Para opositores en España
          </p>
        </GradientHero>
      </aside>
    </div>
  );
}
