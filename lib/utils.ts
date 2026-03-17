import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { authClient } from "@/lib/auth-client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  const { error } = await authClient.changePassword({ currentPassword, newPassword });
  if (error) throw new Error(error.message);
}

export const getEmoji = (type: string | number) => {
  const t = Number(type);
  switch (t) {
    case 1:  return '✍️';
    case 2:  return '🏅';
    case 3:  return '💯';
    default: return '🏆';
  }
};
