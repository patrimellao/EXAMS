'use client';
import * as React from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useEffect, useState, useTransition } from 'react';
import { Subject } from '@/schemas/subjects';
import {
  allActiveSubjects,
  enrollSubjects,
  getEnrolledSubjects,
} from '@/controllers/subjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { UUID } from 'crypto';

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export default function SubjectSelectionCard({ user }: { user: AuthUser }) {
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    startTransition(() => {
      getEnrolledSubjects(user.id as UUID).then(enrolledSubjects => {
        allActiveSubjects().then(activeSubjects => {
          const selectedSubjects = activeSubjects.filter(subject =>
            enrolledSubjects.some(
              enrolledSubject => enrolledSubject.id === subject.id,
            ),
          );
          setSubjects(activeSubjects);
          setSelectedSubjects(selectedSubjects);
        });
      });
    });
  }, []);

  return (
    <div className=" flex flex-col flex-1 justify-start items-center h-[calc(100vh-60px)] p-6 ">
      <Card className="h-full w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Select subject</CardTitle>
          <CardDescription>Select a subject to enroll and start learning. Already enrolled subjects will have a check mark.</CardDescription>
        </CardHeader>
        <CardContent className="h-5/6 pb-0">
          <Command>
            <CommandInput placeholder="Search subject..." />
            <CommandList className="max-h-full">
              <CommandEmpty>
                {isPending ? (
                  <div className="flex justify-center">
                    <LoaderCircle className={cn(' animate-spin')} />
                  </div>
                ) : (
                  'No subjects found.'
                )}
              </CommandEmpty>
              <CommandGroup className="p-2 space-y-1">
                {subjects.map(subject => {
                  const isEnrolled = selectedSubjects.includes(subject);
                  return (
                    <CommandItem
                      key={subject.name}
                      className="flex items-center gap-3 px-3 py-3 border border-transparent data-[selected=true]:border-border"
                      onSelect={() => {
                        if (!isEnrolled) {
                          enrollSubjects(user.id! as UUID, [subject.id]);
                        }
                        router.push(`/study/${subject.id}`);
                      }}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium leading-tight truncate">
                          {subject.name}
                        </p>
                        <p className="text-sm text-muted-foreground leading-tight line-clamp-1">
                          {subject.description}
                        </p>
                      </div>
                      {/* Always render Check; toggle visibility instead of mounting/unmounting so the row geometry stays stable on hover. */}
                      <Check
                        className={cn(
                          'shrink-0 h-5 w-5 text-primary',
                          isEnrolled ? 'opacity-100' : 'opacity-0',
                        )}
                        aria-hidden={!isEnrolled}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </CardContent>
      </Card>
    </div>
  );
}
