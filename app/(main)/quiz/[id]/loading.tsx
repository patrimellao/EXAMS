import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-8 h-full max-h-full animate-in">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress bar */}
        <Skeleton className="h-2 w-full" />

        {/* Question card */}
        <div className="border rounded-md shadow p-6 space-y-2">
          <Skeleton className="h-5 w-3/4 mx-auto" />
          <Skeleton className="h-5 w-1/2 mx-auto" />
        </div>

        {/* Answer buttons */}
        <div className="grid grid-cols-1 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
