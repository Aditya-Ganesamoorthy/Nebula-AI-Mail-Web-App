import React, { useState, useEffect } from 'react';
import { mailService } from '../../services/mail';
import { sanitizeHtml } from '../../utils/sanitize';
import { formatFullDateTime, formatEmailDate } from '../../utils/dates';
import { ChevronDown, ChevronUp, Reply, Paperclip, FileText, CornerDownRight, MessageSquare } from 'lucide-react';

export default function ThreadView({ threadId, currentMessageId, onReply }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(new Set());

  useEffect(() => {
    let isMounted = true;
    const loadThread = async () => {
      if (!threadId) return;
      try {
        setLoading(true);
        const res = await mailService.getThread(threadId);
        if (isMounted && res.success && Array.isArray(res.data)) {
          setMessages(res.data);
          // Default: expand current message, or the last (most recent) message in the thread
          const targetId = currentMessageId || res.data[res.data.length - 1]?.id;
          if (targetId) {
            setExpandedIds(new Set([targetId]));
          }
        }
      } catch (err) {
        console.error('Failed to load thread messages:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadThread();
    return () => {
      isMounted = false;
    };
  }, [threadId, currentMessageId]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(messages.map((m) => m.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  if (loading) {
    return (
      <div className="py-4 space-y-3">
        <div className="h-10 bg-stone-100 rounded-lg animate-pulse" />
        <div className="h-28 bg-stone-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!messages || messages.length <= 1) {
    // If single message or no thread, nothing extra needed
    return null;
  }

  return (
    <div className="mt-8 pt-6 border-t border-stone-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Entire Thread ({messages.length} Messages)
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={expandAll}
            className="text-slate-500 hover:text-slate-800 transition-colors"
          >
            Expand all
          </button>
          <span className="text-stone-300">•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-slate-500 hover:text-slate-800 transition-colors"
          >
            Collapse all
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {messages.map((msg, index) => {
          const isExpanded = expandedIds.has(msg.id);
          const isCurrent = msg.id === currentMessageId;
          const senderName = msg.from?.name || msg.from?.email || 'Unknown';
          const senderEmail = msg.from?.email || '';
          const initials = (senderName || 'U').substring(0, 2).toUpperCase();

          return (
            <div
              key={msg.id || index}
              className={`rounded-xl border transition-all ${
                isCurrent
                  ? 'border-amber-300 bg-amber-50/20 shadow-xs'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              {/* Message Header (Always clickable to toggle) */}
              <div
                onClick={() => toggleExpand(msg.id)}
                className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-semibold text-slate-700 shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {senderName}
                      </span>
                      {senderEmail && (
                        <span className="text-[11px] text-slate-400 hidden sm:inline truncate">
                          &lt;{senderEmail}&gt;
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          Current
                        </span>
                      )}
                    </div>
                    {!isExpanded && (
                      <p className="text-xs text-slate-500 truncate max-w-md mt-0.5">
                        {msg.snippet || msg.body_plain?.slice(0, 100) || '(Empty)'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400">
                    {formatEmailDate(msg.date)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Body */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-stone-100">
                  <div className="text-xs text-slate-500 mb-3 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      <strong>To:</strong> {msg.to?.map((t) => t.email || t.raw).join(', ') || 'Me'}
                    </span>
                    <span>
                      <strong>Date:</strong> {formatFullDateTime(msg.date)}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="prose prose-sm max-w-none text-slate-800 text-sm leading-relaxed mb-4 overflow-x-auto">
                    {msg.body_html ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(msg.body_html),
                        }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">
                        {msg.body_plain || '(No text content)'}
                      </pre>
                    )}
                  </div>

                  {/* Attachments if any */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-4 pt-3 border-t border-stone-100">
                      <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                        <span>Attachments ({msg.attachments.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.attachments.map((att, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs text-slate-700"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                            <span className="font-medium truncate max-w-[180px]">
                              {att.filename}
                            </span>
                            <span className="text-slate-400">
                              ({Math.round((att.size || 0) / 1024)} KB)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reply Button for this specific message in thread */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => onReply && onReply(msg)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-medium transition-colors"
                    >
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reply to this message</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
