"use client"
import Link from "next/link"
import { LoaderCircle } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormEvent, useTransition } from "react";
import { signIn } from "@/controllers/auth";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { PasswordInput } from "@/components/password-input";

export default function Login() {
  let [isPending, startTransition] = useTransition();
  const { toast } = useToast()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    startTransition(async () => {
      const result = await signIn(data);
      if (!result) return;
      let error: { message?: string } | undefined;
      try {
        ({ error } = JSON.parse(result));
      } catch {
        error = { message: "Error inesperado" };
      }
      if (error?.message) {
        toast({
          variant: "destructive",
          title: error.message,
          description: "Inténtalo de nuevo"
        });
      }
    });
  }

  return (
    <div className="animate-in space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Inicia sesión</h1>
        <p className="text-sm text-muted-foreground">
          Bienvenido de nuevo. Continúa tu preparación donde la dejaste.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {!isPending ? "Inicia sesión" : <LoaderCircle className={cn("animate-spin")} />}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-foreground underline underline-offset-4 hover:text-brand-primary"
        >
          Regístrate
        </Link>
      </p>
    </div>
  );
}
