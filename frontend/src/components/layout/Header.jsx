import React from 'react';
import { Search, Sparkles, Menu, ShieldCheck, Mail, LogOut, RefreshCw, X } from 'lucide-react';
import SyncStatusBadge from './SyncStatusBadge';

export default function Header({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  connectedAccount = null,
  onDisconnect,
  onConnect,
  isAssistantOpen,
  onToggleAssistant,
  onToggleMobileSidebar,
  isSyncing = false,
  realtimeStatus = 'disconnected',
  lastSyncTime = null,
  onReconnect
}) {
  return (
    <header className="h-16 bg-white border-b border-stone-200 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left: Mobile Menu & Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-stone-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-xs">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="font-semibold text-slate-800 text-base tracking-tight">Nebula</span>
            <span className="text-amber-600 text-xs font-semibold ml-1.5 uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">AI Mail</span>
          </div>
        </div>
      </div>

      {/* Middle: Controlled Search Bar */}
      <div className="flex-1 max-w-xl mx-2">
        <form onSubmit={onSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search emails by sender, subject, keyword..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Right: Sync Status, Account & AI Toggle */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Real-time sync indicator */}
        <SyncStatusBadge
          status={realtimeStatus}
          lastSyncTime={lastSyncTime}
          onReconnect={onReconnect}
        />

        {/* Account Pill */}
        {connectedAccount ? (
          <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-stone-50 border border-stone-200 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 hidden sm:inline-block" />
            <span className="font-medium text-slate-700 max-w-[120px] sm:max-w-[160px] truncate" title={connectedAccount}>
              {connectedAccount}
            </span>
            <button
              type="button"
              onClick={onDisconnect}
              title="Disconnect account"
              className="p-1 rounded-full hover:bg-stone-200 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Connect Gmail</span>
            <span className="sm:hidden">Connect</span>
          </button>
        )}

        {/* AI Assistant Toggle Button */}
        <button
          type="button"
          onClick={onToggleAssistant}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isAssistantOpen 
              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
              : 'bg-stone-100 hover:bg-stone-200 text-slate-700'
          }`}
          aria-label="Toggle AI Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">AI Co-pilot</span>
        </button>
      </div>
    </header>
  );
}
