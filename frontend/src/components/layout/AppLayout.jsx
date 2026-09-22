import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout({
  children,
  assistantComponent,
  unreadCount = 0,
  connectedAccount = null,
  onDisconnect,
  onConnect,
  onOpenCompose,
  onRefresh,
  isRefreshing = false,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  isSyncing = false
}) {
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-slate-800 flex flex-col font-sans">
      {/* Global Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
        connectedAccount={connectedAccount}
        onDisconnect={onDisconnect}
        onConnect={onConnect}
        isAssistantOpen={isAssistantOpen}
        onToggleAssistant={() => setIsAssistantOpen(!isAssistantOpen)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        isSyncing={isSyncing}
      />

      {/* Main Workspace Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          unreadCount={unreadCount}
          onOpenCompose={onOpenCompose}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Center Main Content Panel */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-white border-r border-stone-200">
          {children}
        </main>

        {/* Right AI Assistant Panel */}
        {isAssistantOpen && (
          <aside className="w-80 lg:w-96 xl:w-[400px] shrink-0 border-l border-stone-200 bg-stone-50/70 hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16">
            {assistantComponent || (
              <div className="p-4 text-center text-sm text-slate-400">
                AI Assistant
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Mobile Assistant Drawer Overlay */}
      {isAssistantOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-t-2xl max-h-[85vh] h-[520px] flex flex-col shadow-2xl overflow-hidden border-t border-stone-200">
            <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-stone-200">
              <span className="font-semibold text-xs uppercase tracking-wider text-amber-700">AI Co-pilot</span>
              <button
                type="button"
                onClick={() => setIsAssistantOpen(false)}
                className="text-xs text-slate-500 font-medium px-2 py-1 rounded hover:bg-stone-200"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {assistantComponent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
