import React from 'react';
import { Mail, Inbox, Send, Search, FilterX } from 'lucide-react';

export default function EmptyState({
  type = 'inbox',
  title,
  description,
  actionText,
  onAction
}) {
  const configs = {
    inbox: {
      icon: Inbox,
      defaultTitle: 'Your inbox is clear',
      defaultDescription: 'No received emails found at this time.'
    },
    sent: {
      icon: Send,
      defaultTitle: 'No sent messages',
      defaultDescription: 'Emails you send will appear here.'
    },
    search: {
      icon: Search,
      defaultTitle: 'No matching emails',
      defaultDescription: 'Try adjusting your search criteria or clearing filters.'
    },
    filters: {
      icon: FilterX,
      defaultTitle: 'No emails match your filters',
      defaultDescription: 'No emails found for the selected date range or sender.'
    }
  };

  const config = configs[type] || configs.inbox;
  const IconComponent = config.icon;

  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
        <IconComponent className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">
        {title || config.defaultTitle}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-5">
        {description || config.defaultDescription}
      </p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
