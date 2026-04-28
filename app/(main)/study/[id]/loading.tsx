import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="h-[calc(100vh-60px)] p-6 overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-6 animate-in">
        {/* Unit banner skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>

        {/* Lessons section */}
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <div className="grid gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 flex-1 max-w-[14rem]" />
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* Quiz button row skeleton */}
        <div className="flex flex-col items-center gap-6 pt-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[70px] w-[70px] rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
