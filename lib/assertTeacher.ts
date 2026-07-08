import { getUser } from '@/lib/getUser';

/**
 * Server-side authorization guard for content-authoring mutations.
 *
 * The `/teach` route group is gated by path (middleware + (teach)/layout.tsx),
 * but "use server" actions and API routes that call authoring controllers
 * directly are NOT protected by path-based checks — an authenticated student
 * could replay a server-action POST or hit the REST endpoint directly.
 *
 * Call this as the FIRST statement in any authoring mutation (create/update/
 * delete of subjects, units, questions, answers, lessons). Allow-list only:
 * teacher/admin pass, everyone else (including no session) is rejected.
 */
export async function assertTeacher() {
  const user = await getUser();
  const role = (user as any)?.role;
  if (!user || (role !== 'teacher' && role !== 'admin')) {
    throw new Error('Forbidden: teacher role required');
  }
  return user;
}
