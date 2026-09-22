import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { EmailDetailSkeleton } from '../components/common/Skeleton';
import ComposeModal from '../components/compose/ComposeModal';
import { useMail } from '../hooks/useMail';
import { useAuth } from '../hooks/useAuth';
import { sanitizeHtml } from '../utils/sanitize';
import { formatFullDateTime } from '../utils/dates';
import { ArrowLeft, Reply, Paperclip, AlertCircle, FileText } from 'lucide-react';

export default function EmailDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, disconnectGmail, connectGmail } = useAuth();
  const {
    fetchMessageDetail,
    selectedEmail,
    loadingDetail,
    error,
    composeState,
    openCompose,
    closeCompose,
    refresh
  } = useMail();

  useEffect(() => {
    if (id) {
      fetchMessageDetail(id);
    }
  }, [id, fetchMessageDetail]);

  const handleReply = () => {
    if (!selectedEmail) return;
    const recipient = selectedEmail.from?.email || selectedEmail.from?.raw;
    const origSubj = selectedEmail.subject || '';
    const replySubject = origSubj.toLowerCase().startsWith('re:') ? origSubj : `Re: ${origSubj}`;

    openCompose(
      {
        to: recipient,
        subject: replySubject,
        body: `\n\n--- On ${selectedEmail.date}, ${selectedEmail.from?.name || recipient} wrote: ---\n${selectedEmail.body_plain}`
      },
      false,
      {
        message_id: selectedEmail.headers?.message_id,
        thread_id: selectedEmail.thread_id,
        subject: selectedEmail.subject
      }
    );
  };

  const senderName = selectedEmail?.from?.name || selectedEmail?.from?.email || 'Unknown';
  const senderEmail = selectedEmail?.from?.email || '';

  return (
    <AppLayout
      connectedAccount={user?.email}
      onDisconnect={disconnectGmail}
      onConnect={connectGmail}
      onOpenCompose={() => openCompose()}
      onRefresh={refresh}
    >
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Navigation Bar */}
        <div className="px-6 py-3.5 border-b border-stone-200 bg-white flex items-center justify-between sticky top-0 z-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleReply}
            disabled={loadingDetail || !selectedEmail}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>
        </div>

        {/* Loading state */}
        {loadingDetail ? (
          <EmailDetailSkeleton />
        ) : error ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs font-medium rounded-xl mb-4">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <div>
              <Link
                to="/inbox"
                className="text-xs font-semibold text-amber-700 hover:underline"
              >
                Return to Inbox
              </Link>
            </div>
          </div>
        ) : selectedEmail ? (
          <article className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
            {/* Subject */}
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              {selectedEmail.subject || '(No Subject)'}
            </h1>

            {/* Sender / Recipient Metadata Card */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-stone-50/80 border border-stone-200 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-sm shrink-0">
                  {senderName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">
                    {senderName}
                    {senderEmail && (
                      <span className="font-normal text-slate-500 text-xs ml-1.5">&lt;{senderEmail}&gt;</span>
                    )}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    to {selectedEmail.to?.raw || selectedEmail.to?.email || 'me'}
                    {selectedEmail.cc && <span>, cc: {selectedEmail.cc}</span>}
                  </div>
                </div>
              </div>

              <div className="text-right text-slate-400 text-[11px] shrink-0">
                {formatFullDateTime(selectedEmail.date)}
              </div>
            </div>

            {/* Email Body */}
            <div className="pt-2 text-slate-800 text-sm leading-relaxed">
              {selectedEmail.has_html ? (
                <div
                  className="prose prose-sm max-w-none text-slate-800 overflow-x-auto"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(selectedEmail.body_html)
                  }}
                />
              ) : (
                <div className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed text-sm">
                  {selectedEmail.body_plain || selectedEmail.snippet}
                </div>
              )}
            </div>

            {/* Attachments Section */}
            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
              <div className="pt-6 border-t border-stone-200">
                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attachments ({selectedEmail.attachments.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedEmail.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-stone-200 bg-stone-50 flex items-center gap-2.5 text-xs text-slate-700"
                    >
                      <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-medium truncate flex-1">{att.filename}</span>
                      <span className="text-[10px] text-slate-400">
                        {Math.round(att.size / 1024)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        ) : null}
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
