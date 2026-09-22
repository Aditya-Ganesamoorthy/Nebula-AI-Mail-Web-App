import React from 'react';

export function EmailListSkeleton({ count = 8 }) {
  return (
    <div className="divide-y divide-stone-100">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-stone-200 shrink-0" />
          <div className="w-36 h-4 bg-stone-200 rounded shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="w-1/3 h-4 bg-stone-200 rounded" />
            <div className="w-3/4 h-3 bg-stone-100 rounded" />
          </div>
          <div className="w-16 h-3 bg-stone-200 rounded shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function EmailDetailSkeleton() {
  return (
    <div className="p-6 max-w-4xl space-y-6 animate-pulse">
      <div className="w-24 h-4 bg-stone-200 rounded" />
      <div className="space-y-3">
        <div className="w-3/4 h-7 bg-stone-200 rounded" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stone-200" />
          <div className="space-y-1.5 flex-1">
            <div className="w-48 h-4 bg-stone-200 rounded" />
            <div className="w-32 h-3 bg-stone-100 rounded" />
          </div>
        </div>
      </div>
      <div className="pt-6 border-t border-stone-100 space-y-3">
        <div className="w-full h-4 bg-stone-100 rounded" />
        <div className="w-11/12 h-4 bg-stone-100 rounded" />
        <div className="w-4/5 h-4 bg-stone-100 rounded" />
        <div className="w-2/3 h-4 bg-stone-100 rounded" />
      </div>
    </div>
  );
}
