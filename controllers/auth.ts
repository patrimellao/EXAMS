'use server';
import { auth } from '@/lib/auth';
import { APIError } from 'better-auth/api';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export const signIn = async (formData: FormData) => {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  let role: string | undefined;
  try {
    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: headers(),
    });
    role = (result?.user as any)?.role;
  } catch (error) {
    if (error instanceof APIError) {
      const msg = (error as any).body?.message ?? 'Error de autenticación';
      return JSON.stringify({ error: { message: msg } });
    }
    console.error('[signIn] unexpected error:', error);
    return JSON.stringify({ error: { message: 'Error inesperado. Inténtalo de nuevo.' } });
  }

  redirect(role === 'teacher' ? '/teach' : '/study');
};

export const signUp = async (formData: FormData) => {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirm-password') as string;

  if (password !== confirmPassword) {
    return JSON.stringify({ error: { message: 'Las contraseñas no coinciden' } });
  }

  const email = formData.get('email') as string;
  const firstName = formData.get('first-name') as string;
  const lastName = formData.get('last-name') as string;
  const name = `${firstName} ${lastName}`;

  try {
    await auth.api.signUpEmail({
      body: { email, password, name },
      headers: headers(),
    });
    return JSON.stringify({ data: {} });
  } catch (error) {
    if (error instanceof APIError) {
      const msg = (error as any).body?.message ?? 'Error al crear la cuenta';
      return JSON.stringify({ error: { message: msg } });
    }
    console.error('[signUp] unexpected error:', error);
    return JSON.stringify({ error: { message: 'Error inesperado. Inténtalo de nuevo.' } });
  }
};
