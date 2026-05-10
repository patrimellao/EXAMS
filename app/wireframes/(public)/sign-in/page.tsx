import Link from "next/link";
import { BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradientHero } from "@/components/game/GradientHero";

export default function SignInWireframe() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Form column */}
      <section className="flex w-full flex-col px-6 py-10 lg:px-12 lg:py-12">
        <Link
          href="/wireframes"
          className="flex items-center gap-2 self-start text-foreground"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-card bg-foreground text-background">
            <BookOpen className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold tracking-tight">TuFolio</span>
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm space-y-8">
            <header className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Inicia sesión
              </h1>
              <p className="text-sm text-muted-foreground">
                Bienvenido de nuevo. Continúa tu preparación donde la dejaste.
              </p>
            </header>

            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@correo.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="#"
                    className="text-xs text-muted-foreground transition-colors duration-fast hover:text-foreground"
                  >
                    ¿Olvidada?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" size="lg" className="w-full">
                Inicia sesión
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link
                href="/wireframes/sign-up"
                className="font-medium text-foreground underline underline-offset-4 transition-colors duration-fast hover:text-brand-primary"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>

        <p className="self-start text-xs text-muted-foreground">
          © {new Date().getFullYear()} TuFolio · Preparación de oposiciones
        </p>
      </section>

      {/* Hero column */}
      <aside className="hidden lg:block">
        <GradientHero
          variant="trust"
          decorative={false}
          className="flex h-full w-full flex-col justify-between p-14"
        >
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-white/15 ring-1 ring-white/25">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-medium tracking-tight">TuFolio</span>
          </div>

          <h2 className="text-balance font-reader text-4xl font-medium leading-[1.2] tracking-tight text-white md:text-5xl">
            Preparación rigurosa
            <br />
            para tus oposiciones.
          </h2>

          <p className="text-xs uppercase tracking-[0.18em] text-white/70">
            Para opositores en España
          </p>
        </GradientHero>
      </aside>
    </div>
  );
}
