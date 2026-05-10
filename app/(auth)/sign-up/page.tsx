"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp } from "@/controllers/auth";
import { FormEvent, useTransition } from "react";
import { useToast } from "@/components/ui/use-toast";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PasswordInput } from "@/components/password-input";

export default function SignUp() {
  let [isPending, startTransition] = useTransition();
  const { toast } = useToast()
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    startTransition(async () => {
      const result = await signUp(data);
      if (!result) {
        toast({ variant: "destructive", title: "Error inesperado. Inténtalo de nuevo." });
        return;
      }
      let parsed: { error?: { message?: string }; data?: unknown };
      try {
        parsed = JSON.parse(result);
      } catch {
        toast({ variant: "destructive", title: "Error inesperado. Inténtalo de nuevo." });
        return;
      }
      if (parsed.error?.message) {
        toast({
          variant: "destructive",
          title: parsed.error.message
        });
      } else {
        toast({
          variant: "primary",
          title: "Cuenta creada. Inicia sesión para continuar."
        });
        router.push('/sign-in');
      }
    });
  }

  return (
    <div className="animate-in space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Crea tu cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Empieza a prepararte hoy mismo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="first-name">Nombre</Label>
            <Input
              id="first-name"
              name="first-name"
              placeholder="Ana"
              required
              autoComplete="given-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-name">Apellidos</Label>
            <Input
              id="last-name"
              name="last-name"
              placeholder="García"
              required
              autoComplete="family-name"
            />
          </div>
        </div>
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
          <Label htmlFor="password">Contraseña</Label>
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirma la contraseña</Label>
          <PasswordInput
            id="confirm-password"
            name="confirm-password"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {!isPending ? "Crear cuenta" : <LoaderCircle className={cn("animate-spin")} />}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline underline-offset-4 hover:text-brand-primary"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
