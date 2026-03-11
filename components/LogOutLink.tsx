'use client';
import * as React from 'react';
import { authClient } from '@/lib/auth-client';
import { DropdownMenuItem } from './ui/dropdown-menu';
import { useRouter } from 'next/navigation';

export const LogOutLink = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push('/sign-in'),
      },
    });
  };

  return (
    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
      Logout
    </DropdownMenuItem>
  );
};
