import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import EmailList from '../components/mail/EmailList';
import ComposeModal from '../components/compose/ComposeModal';
import { useMail } from '../hooks/useMail';
import { useAuth } from '../hooks/useAuth';

export default function Sent() {
  const { user, disconnectGmail, connectGmail } = useAuth();
  const {
    sentMessages,
    loading,
    error,
    fetchSent,
    refresh,
    setActiveFolder,
    composeState,
    openCompose,
    closeCompose,
    nextPageToken
  } = useMail();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setActiveFolder('sent');
    fetchSent();
  }, [setActiveFolder, fetchSent]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchSent(searchQuery);
  };

  return (
    <AppLayout
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
        {/* Subheader */}
        <div className="px-6 py-4 border-b border-stone-200 bg-white flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight">Sent Messages</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review sent communications
            </p>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-hidden">
          <EmailList
            messages={sentMessages}
            loading={loading}
            error={error}
            folderType="sent"
            hasNextPage={Boolean(nextPageToken)}
            onNextPage={() => fetchSent(undefined, nextPageToken)}
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
