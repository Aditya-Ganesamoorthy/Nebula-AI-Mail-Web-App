import React from 'react';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

export default function ActionChip({ label, status = 'executing' }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs my-1">
      {status === 'executing' ? (
        <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
      ) : (
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
      )}
      <span>{label}</span>
    </div>
  );
}
