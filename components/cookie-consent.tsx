'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const COOKIE_KEY = 'cookie-consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const acceptAll = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem(COOKIE_KEY, 'necessary');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm shadow-lg"
    >
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          Utilizamos cookies propias estrictamente necesarias para el funcionamiento de la plataforma. Con su consentimiento, también usamos cookies de preferencias (tema claro/oscuro).{' '}
          <Link href="/cookies" className="underline hover:text-foreground">
            Más información
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={acceptNecessary}>
            Solo necesarias
          </Button>
          <Button size="sm" onClick={acceptAll}>
            Aceptar todas
          </Button>
        </div>
      </div>
    </div>
  );
}
