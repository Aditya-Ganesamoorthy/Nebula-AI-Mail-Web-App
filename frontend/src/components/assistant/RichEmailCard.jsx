import React from 'react';
import { Mail, ExternalLink } from 'lucide-react';

export default function RichEmailCard({ email, onOpen }) {
  if (!email) return null;

  return (
    <div className="my-2 p-3.5 rounded-xl bg-white border border-stone-200 shadow-xs hover:border-amber-300 transition-all text-left">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center shrink-0">
            <Mail className="w-3 h-3 text-amber-700" />
          </div>
          <span className="text-xs font-semibold text-slate-800 line-clamp-1">
            {email.subject || '(No Subject)'}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 shrink-0">{email.date}</span>
      </div>

      <div className="text-[11px] text-slate-500 mb-1.5">
        <span className="font-medium text-slate-700">From:</span> {email.sender}
      </div>

      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-3">
        "{email.snippet}"
      </p>

      <button
        type="button"
        onClick={() => onOpen(email.id)}
        className="w-full py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
      >
        <span>Open Email</span>
        <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
}
