import React from "react";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b h-14 flex items-center px-6">
        <a href="/" className="font-semibold text-lg">
          TuFolio
        </a>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">{children}</main>
      <footer className="border-t mt-16 py-8 text-center text-sm text-muted-foreground">
        <div className="flex flex-wrap justify-center gap-4 mb-2">
          <a href="/aviso-legal" className="hover:underline">Aviso Legal</a>
          <a href="/privacidad" className="hover:underline">Política de Privacidad</a>
          <a href="/cookies" className="hover:underline">Política de Cookies</a>
          <a href="/terminos" className="hover:underline">Términos de Servicio</a>
        </div>
        <p>© {new Date().getFullYear()} TuFolio. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
