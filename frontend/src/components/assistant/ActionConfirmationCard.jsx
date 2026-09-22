import React from 'react';
import { Send, X, ShieldAlert } from 'lucide-react';

export default function ActionConfirmationCard({
  title = "Ready to send this email?",
  details,
  onConfirm,
  onCancel,
  isSending = false
}) {
  return (
    <div className="my-2.5 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 shadow-2xs text-left">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
        <span className="text-xs font-semibold text-slate-800">{title}</span>
      </div>

      {details && (
        <div className="text-[11px] text-slate-600 space-y-1 mb-3 bg-white p-2.5 rounded-lg border border-amber-200/60 font-mono">
          <div><strong className="text-slate-700">To:</strong> {details.to}</div>
          <div><strong className="text-slate-700">Subject:</strong> {details.subject}</div>
          <div className="truncate"><strong className="text-slate-700">Body:</strong> {details.body}</div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSending}
          className="flex-1 py-1.5 px-3 bg-white hover:bg-stone-100 text-slate-700 text-xs font-semibold rounded-lg border border-stone-200 transition-colors"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isSending}
          className="flex-1 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Send className="w-3 h-3" />
          <span>{isSending ? 'Sending...' : 'Send Email'}</span>
        </button>
      </div>
    </div>
  );
}
