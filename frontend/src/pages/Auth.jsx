import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Mail, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export default function Auth() {
  const { isConnected, user, connectGmail, disconnectGmail, error } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fbfbf9]">
      <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center">
        {/* Logo / Badge */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5 shadow-2xs">
          <Mail className="w-7 h-7 text-amber-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Nebula AI Mail</h1>
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mt-1">Enterprise AI-Driven Client</p>

        <p className="text-sm text-slate-600 mt-4 mb-6 leading-relaxed">
          Connect your Gmail account to access intelligent inbox management, natural-language form autofill, and real-time push synchronization.
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isConnected ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-left">
              <p className="font-semibold">Connected Mailbox:</p>
              <p className="text-sm font-medium mt-0.5">{user?.email}</p>
            </div>

            <div className="flex gap-2">
              <a
                href="/inbox"
                className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Go to Inbox</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={disconnectGmail}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={connectGmail}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:shadow flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Connect with Google</span>
            </button>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-left text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Account Selection Notice:</p>
              <p>Google OAuth will display the account selector (<code className="text-amber-800 font-mono">select_account</code>) allowing you to explicitly choose your separate testing Gmail account.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
