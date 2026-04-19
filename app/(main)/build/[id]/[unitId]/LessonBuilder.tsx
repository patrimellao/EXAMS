'use client';

import { useState } from 'react';
import { Lesson } from '@/schemas/lessons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Trash2, Plus, Paperclip, Loader2 } from 'lucide-react';

type Props = {
  unitId: number;
  initialLessons: Lesson[];
};

type LessonForm = {
  title: string;
  type: 'article' | 'file';
  order: number;
  contentText: string;
  estimatedDurationMinutes: number;
  xpReward: number;
};

const emptyForm = (): LessonForm => ({
  title: '',
  type: 'article',
  order: 1,
  contentText: '',
  estimatedDurationMinutes: 5,
  xpReward: 10,
});

export function LessonBuilder({ unitId, initialLessons }: Props) {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [form, setForm] = useState<LessonForm>(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingResource, setPendingResource] = useState<{
    fileUrl: string;
    title: string;
  } | null>(null);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setPendingResource(null);
  };

  const startEdit = (lesson: Lesson) => {
    setEditingId(lesson.id);
    setForm({
      title: lesson.title,
      type: lesson.type as 'article' | 'file',
      order: lesson.order,
      contentText: lesson.contentText ?? '',
      estimatedDurationMinutes: lesson.estimatedDurationMinutes ?? 5,
      xpReward: lesson.xpReward,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      // 1. Get presigned URL from R2
      const presignRes = await fetch('/api/storage/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json();
        throw new Error(err.error ?? 'Failed to get upload URL');
      }

      const { presignedUrl, fileUrl } = await presignRes.json();

      // 2. Upload directly to R2
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Upload to storage failed');

      setPendingResource({ fileUrl, title: file.name });
      toast({ title: 'Archivo subido', description: file.name });
    } catch (err: any) {
      toast({ title: 'Error al subir archivo', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'El título es obligatorio', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let savedLesson: Lesson;

      if (editingId) {
        // Update
        const res = await fetch(`/api/lessons/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).message);
        savedLesson = await res.json();
        setLessons((prev) => prev.map((l) => (l.id === editingId ? savedLesson : l)));
      } else {
        // Create
        const res = await fetch('/api/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, unitId }),
        });
        if (!res.ok) throw new Error((await res.json()).message);
        savedLesson = await res.json();
        setLessons((prev) => [...prev, savedLesson]);
      }

      // If there's a pending file resource, attach it to the lesson
      if (pendingResource) {
        await fetch(`/api/lessons/${savedLesson.id}/resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: pendingResource.title,
            type: 'file',
            url: pendingResource.fileUrl,
            order: 1,
          }),
        });
      }

      toast({ title: editingId ? 'Lección actualizada' : 'Lección creada' });
      resetForm();
    } catch (err: any) {
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lessonId: number) => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).message);
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
      if (editingId === lessonId) resetForm();
      toast({ title: 'Lección eliminada' });
    } catch (err: any) {
      toast({ title: 'Error al eliminar', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 p-4">
      {/* Sidebar: list of lessons */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Lecciones ({lessons.length})
          </h3>
          <Button size="sm" variant="outline" onClick={resetForm}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {lessons.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Sin lecciones. Crea la primera.
          </p>
        )}

        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
              editingId === lesson.id ? 'border-primary bg-accent' : ''
            }`}
            onClick={() => startEdit(lesson)}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{lesson.title}</p>
              <p className="text-xs text-muted-foreground capitalize">{lesson.type}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); handleDelete(lesson.id); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Editor form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {editingId ? 'Editar lección' : 'Nueva lección'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="lesson-title">Título *</Label>
              <Input
                id="lesson-title"
                placeholder="Ej. Introducción al tema"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lesson-type">Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as 'article' | 'file' })}
              >
                <SelectTrigger id="lesson-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Artículo (texto)</SelectItem>
                  <SelectItem value="file">Archivo (recurso)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="lesson-order">Orden</Label>
              <Input
                id="lesson-order"
                type="number"
                min={1}
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lesson-duration">Duración estimada (min)</Label>
              <Input
                id="lesson-duration"
                type="number"
                min={1}
                value={form.estimatedDurationMinutes}
                onChange={(e) =>
                  setForm({ ...form, estimatedDurationMinutes: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lesson-xp">XP al completar</Label>
              <Input
                id="lesson-xp"
                type="number"
                min={0}
                value={form.xpReward}
                onChange={(e) => setForm({ ...form, xpReward: Number(e.target.value) })}
              />
            </div>
          </div>

          {form.type === 'article' && (
            <div className="space-y-1">
              <Label htmlFor="lesson-content">Contenido (Markdown)</Label>
              <Textarea
                id="lesson-content"
                placeholder="## Título&#10;&#10;Escribe el contenido en Markdown..."
                className="min-h-[200px] font-mono text-sm"
                value={form.contentText}
                onChange={(e) => setForm({ ...form, contentText: e.target.value })}
              />
            </div>
          )}

          {/* File resource upload */}
          <div className="space-y-2">
            <Label>Adjunto (opcional)</Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingFile}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  {uploadingFile ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Paperclip className="h-4 w-4 mr-1" />
                  )}
                  {uploadingFile ? 'Subiendo...' : 'Subir archivo'}
                </Button>
                <input
                  id="file-upload-input"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm"
                />
              </label>
              {pendingResource && (
                <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {pendingResource.title}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingId ? 'Guardar cambios' : 'Crear lección'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
