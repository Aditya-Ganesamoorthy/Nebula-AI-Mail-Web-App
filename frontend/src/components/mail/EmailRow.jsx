import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Paperclip, Star } from 'lucide-react';
import { formatEmailDate } from '../../utils/dates';

export default function EmailRow({ message, onToggleStar, isStarred = false }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/email/${message.id}`);
  };

  const senderName = message.from?.name || message.from?.email || 'Unknown';
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const isUnread = message.is_unread;

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-stone-100 transition-colors select-none ${
        isUnread 
          ? 'bg-amber-50/30 hover:bg-amber-50/60 font-medium' 
          : 'bg-white hover:bg-stone-50 text-slate-700'
      }`}
    >
      {/* Unread Indicator Dot */}
      <div className="w-2 flex items-center justify-center shrink-0">
        {isUnread && (
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" title="Unread" />
        )}
      </div>

      {/* Sender Name */}
      <div className="w-36 sm:w-44 lg:w-48 shrink-0 truncate">
        <span className={`text-xs ${isUnread ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
          {senderName}
        </span>
      </div>

      {/* Subject and Snippet */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className={`text-xs truncate ${isUnread ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>
          {message.subject || '(No Subject)'}
        </span>
        <span className="text-slate-400 text-xs shrink-0 hidden sm:inline">-</span>
        <span className="text-slate-400 text-xs truncate hidden sm:inline font-normal">
          {message.snippet}
        </span>
      </div>

      {/* Attachment Icon */}
      {hasAttachments && (
        <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" title="Has attachments" />
      )}

      {/* Timestamp */}
      <div className="w-16 sm:w-20 text-right shrink-0">
        <span className={`text-[11px] whitespace-nowrap ${isUnread ? 'font-semibold text-amber-900' : 'text-slate-400'}`}>
          {formatEmailDate(message.date)}
        </span>
      </div>
    </div>
  );
}
