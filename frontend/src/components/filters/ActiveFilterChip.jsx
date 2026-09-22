import React from 'react';
import { X } from 'lucide-react';

export default function ActiveFilterChip({ label, value, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100/70 text-amber-900 border border-amber-300 shadow-2xs">
      <span className="text-amber-700 font-semibold">{label}:</span>
      <span>{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className="p-0.5 rounded-full hover:bg-amber-200/80 text-amber-800 transition-colors"
        aria-label={`Remove filter ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
