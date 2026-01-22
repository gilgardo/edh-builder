'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function DeckEditSkeleton() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:flex-row">
      {/* Mobile skeleton */}
      <div className="space-y-4 p-4 md:hidden">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-488/680" />
          ))}
        </div>
      </div>
      {/* Desktop skeleton */}
      <div className="hidden md:flex md:flex-1">
        <div className="w-64 border-r p-4 lg:w-72">
          <Skeleton className="aspect-488/680 rounded-lg" />
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="mb-4 h-10" />
          <div className="columns-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mb-4 break-inside-avoid">
                <Skeleton className="mb-2 h-5 w-20" />
                <Skeleton className="h-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
