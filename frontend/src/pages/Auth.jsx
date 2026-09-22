import React from 'react';

export default function Auth() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fbfbf9]">
      <div className="max-w-md w-full bg-white rounded-xl border border-stone-200 shadow-sm p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
          <span className="text-amber-700 font-semibold text-lg">N</span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Connect Gmail</h1>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Connect your Google Mail account to access your inbox with AI co-pilot capabilities.
        </p>
        <button 
          type="button"
          className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
