'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Clock, BookOpen, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

type Resource = {
  id: number;
  title: string;
  type: string;
  url: string;
};

type Props = {
  lessonId: number;
  title: string;
  type: string;
  /** Whether this article has body content (drives the content vs. resource view). */
  hasContent: boolean;
  /** Server-rendered MDX node for the lesson body. */
  content: ReactNode;
  estimatedDurationMinutes: number | null;
  xpReward: number;
  resources: Resource[];
  alreadyCompleted: boolean;
};

export function LessonReader({
  lessonId,
  title,
  type,
  hasContent,
  content,
  estimatedDurationMinutes,
  xpReward,
  resources,
  alreadyCompleted,
}: Props) {
  const [completed, setCompleted] = useState(alreadyCompleted);
  const [marking, setMarking] = useState(false);

  const handleMarkComplete = async () => {
    if (completed) return;
    setMarking(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSpentSeconds: 0 }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setCompleted(true);
      toast({
        title: `+${xpReward} XP`,
        description: 'Lección completada',
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setMarking(false);
    }
  };

  return (
    <article className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="capitalize">
            <BookOpen className="h-3 w-3 mr-1" />
            {type === 'article' ? 'Artículo' : 'Recurso'}
          </Badge>
          {estimatedDurationMinutes && (
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              {estimatedDurationMinutes} min
            </Badge>
          )}
          {completed && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completada
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>

      {/* Content */}
      {type === 'article' && hasContent ? (
        <div
          className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed border rounded-lg p-6 bg-muted/20"
          data-testid="lesson-content"
        >
          {content}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Esta lección contiene un recurso descargable.</p>
        </div>
      )}

      {/* Downloadable resources */}
      {resources.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recursos</h2>
          <div className="grid gap-2">
            {resources.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors"
                data-testid={`resource-${r.id}`}
              >
                <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">{r.title}</span>
                <Badge variant="outline" className="ml-auto shrink-0 text-xs uppercase">
                  {r.type}
                </Badge>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Mark as complete CTA */}
      <div className="border-t pt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {completed
            ? 'Ya has completado esta lección.'
            : `Completa esta lección para ganar ${xpReward} XP.`}
        </p>
        <Button
          onClick={handleMarkComplete}
          disabled={completed || marking}
          variant={completed ? 'outline' : 'default'}
          data-testid="mark-complete-btn"
        >
          {marking && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {completed ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Completada
            </>
          ) : (
            'Marcar como completada'
          )}
        </Button>
      </div>
    </article>
  );
}
