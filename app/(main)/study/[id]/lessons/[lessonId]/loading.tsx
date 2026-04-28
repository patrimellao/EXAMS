import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <article className="max-w-3xl mx-auto space-y-8 p-6 animate-in">
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-9 w-3/4" />
      </div>

      <div className="space-y-3 border rounded-lg p-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[95%]" />
        <Skeleton className="h-4 w-[88%]" />
        <Skeleton className="h-4 w-[92%]" />
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton className="h-4 w-[70%]" />
      </div>

      <div className="border-t pt-6 flex items-center justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-44" />
      </div>
    </article>
  );
}
