import React, { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import EmailList from '../components/mail/EmailList';
import FilterBar from '../components/filters/FilterBar';
import ComposeModal from '../components/compose/ComposeModal';
import { useMail } from '../hooks/useMail';
import { useAuth } from '../hooks/useAuth';

export default function Inbox() {
  const { isConnected, user, disconnectGmail, connectGmail } = useAuth();
  const {
    inboxMessages,
    loading,
    error,
    refresh,
    filters,
    setFilters,
    clearFilters,
    isFiltered,
    composeState,
    openCompose,
    closeCompose,
    nextPageToken,
    fetchInbox
  } = useMail();

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchInbox(searchQuery);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // Build query from new filters and fetch
    const parts = [];
    if (newFilters.unreadOnly) parts.push('is:unread');
    if (newFilters.sender) parts.push(`from:${newFilters.sender}`);
    if (newFilters.keyword) parts.push(newFilters.keyword);
    if (newFilters.datePreset) {
      // Handled via backend date calculation or search endpoint
      parts.push(`date_preset:${newFilters.datePreset}`);
    }
    fetchInbox();
  };

  const unreadCount = inboxMessages.filter((m) => m.is_unread).length;

  return (
    <AppLayout
      unreadCount={unreadCount}
      connectedAccount={user?.email}
      onDisconnect={disconnectGmail}
      onConnect={connectGmail}
      onOpenCompose={() => openCompose()}
      onRefresh={refresh}
      isRefreshing={loading}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSearchSubmit={handleSearchSubmit}
    >
      <div className="flex flex-col h-full">
        {/* Inbox Subheader */}
        <div className="px-6 py-3.5 border-b border-stone-200 bg-white flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight">Inbox</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread messages` : 'All caught up'}
            </p>
          </div>
        </div>

        {/* Filter Bar Controls */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          isFiltered={isFiltered}
        />

        {/* Email List */}
        <div className="flex-1 overflow-hidden">
          <EmailList
            messages={inboxMessages}
            loading={loading}
            error={error}
            folderType="inbox"
            isFiltered={isFiltered}
            onClearFilters={clearFilters}
            hasNextPage={Boolean(nextPageToken)}
            onNextPage={() => fetchInbox(undefined, nextPageToken)}
          />
        </div>
      </div>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={composeState.isOpen}
        onClose={closeCompose}
        initialData={composeState.data}
        isAiControlled={composeState.isAi}
        replyContext={composeState.replyContext}
        onEmailSent={refresh}
      />
    </AppLayout>
  );
}
