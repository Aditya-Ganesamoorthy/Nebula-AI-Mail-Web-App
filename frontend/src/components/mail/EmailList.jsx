import React from 'react';
import EmailRow from './EmailRow';
import { EmailListSkeleton } from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function EmailList({
  messages = [],
  loading = false,
  error = null,
  folderType = 'inbox',
  onNextPage,
  onPrevPage,
  hasNextPage = false,
  hasPrevPage = false,
  onClearFilters,
  isFiltered = false
}) {
  if (loading) {
    return <EmailListSkeleton count={8} />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex p-3 rounded-xl bg-red-50 text-red-700 text-xs mb-3 font-medium">
          {error}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <EmptyState
        type={isFiltered ? 'filters' : folderType}
        actionText={isFiltered ? 'Clear active filters' : null}
        onAction={onClearFilters}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Email rows container */}
      <div className="flex-1 divide-y divide-stone-100 overflow-y-auto">
        {messages.map((message) => (
          <EmailRow key={message.id} message={message} />
        ))}
      </div>

      {/* Pagination Footer */}
      {(hasNextPage || hasPrevPage) && (
        <div className="p-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-slate-500">
          <span>Viewing {messages.length} messages</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevPage}
              disabled={!hasPrevPage}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onNextPage}
              disabled={!hasNextPage}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
