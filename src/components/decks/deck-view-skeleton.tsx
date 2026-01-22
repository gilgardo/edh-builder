'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function DeckViewSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero Skeleton */}
      <Skeleton className="h-64 rounded-xl" />

      {/* Stats Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}
