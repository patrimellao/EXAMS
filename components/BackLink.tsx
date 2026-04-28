'use client';
import * as React from 'react';
import Link from 'next/link';
import { Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import StudyLink from './StudyLink';

type Props = {
  href?: string;
  label?: string;
};

export default function BackLink({ href, label }: Props) {
  const path = usePathname();
  const router = useRouter();

  if (href && label) {
    return (
      <Link href={href} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <Undo2 className="h-4 w-4" />
        {label}
      </Link>
    );
  }

  if (path === '/study' || path.startsWith('/quiz')) {
    return null;
  }

  return (
    <div className="flex gap-4">
      <Button
        variant="outline"
        onClick={router.back}
        size="icon"
        className="shrink-0"
      >
        <Undo2 className="h-5 w-5" />
      </Button>
      <StudyLink />
    </div>
  );
}
