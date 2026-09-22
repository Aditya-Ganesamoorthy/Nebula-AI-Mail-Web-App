import React from 'react';
import { NavLink } from 'react-router-dom';
import { Inbox, Send, PenSquare, X, RefreshCw } from 'lucide-react';

export default function Sidebar({
  unreadCount = 0,
  onOpenCompose,
  onRefresh,
  isRefreshing = false,
  isMobileOpen = false,
  onCloseMobile
}) {
  const navItems = [
    { name: 'Inbox', path: '/inbox', icon: Inbox, badge: unreadCount },
    { name: 'Sent', path: '/sent', icon: Send },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 bg-stone-50 border-r border-stone-200">
      <div>
        {/* Mobile Header with close button */}
        <div className="flex items-center justify-between md:hidden pb-3 mb-3 border-b border-stone-200">
          <span className="font-semibold text-slate-800 text-sm">Navigation</span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compose Button */}
        <button
          type="button"
          onClick={onOpenCompose}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all hover:shadow mb-6"
        >
          <PenSquare className="w-4 h-4" />
          <span>Compose</span>
        </button>

        {/* Nav Links */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-100/60 text-amber-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-200/80 text-amber-900">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer / Refresh */}
      <div className="pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
          <span>{isRefreshing ? 'Checking mail...' : 'Check for new mail'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / Laptop Sidebar */}
      <aside className="hidden md:block w-56 lg:w-64 h-[calc(100vh-4rem)] sticky top-16 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
