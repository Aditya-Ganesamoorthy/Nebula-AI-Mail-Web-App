import React, { useState } from 'react';
import { Sparkles, Send, CornerDownLeft } from 'lucide-react';
import ActionChip from './ActionChip';
import RichEmailCard from './RichEmailCard';
import ActionConfirmationCard from './ActionConfirmationCard';
import { useNavigate } from 'react-router-dom';

export default function AssistantPanel({
  messages = [],
  isProcessing = false,
  onSendCommand,
  onConfirmSend,
  onCancelSend,
  pendingConfirmation = null,
  suggestedCommands = [
    "Send an email to john@example.com with subject 'Meeting Tomorrow' and body 'Let\\'s meet at 3pm'",
    "Show me emails from the last 10 days",
    "Find the email from Sarah about the project update",
    "Open the latest email from David",
    "Show only unread emails from this week",
    "Reply to this"
  ]
}) {
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendCommand(input.trim());
    setInput('');
  };

  const handleSelectSuggestion = (cmd) => {
    onSendCommand(cmd);
  };

  return (
    <div className="flex flex-col h-full bg-stone-50/70 select-none">
      {/* Assistant Header */}
      <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800 tracking-tight">AI Co-pilot</h2>
            <p className="text-[11px] text-slate-500">Drives the user interface</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          UI Controller
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-xs font-bold text-slate-800">Ready to command</h3>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1 mb-4">
              I can compose emails, filter your inbox, search by sender or topic, and open specific emails.
            </p>

            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                Suggested Commands:
              </span>
              {suggestedCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(cmd)}
                  className="w-full text-left p-2.5 rounded-xl text-xs bg-white hover:bg-amber-50/70 border border-stone-200 hover:border-amber-200 text-slate-700 transition-all shadow-2xs group flex items-start justify-between gap-2"
                >
                  <span className="leading-snug">"{cmd}"</span>
                  <CornerDownLeft className="w-3 h-3 text-slate-400 group-hover:text-amber-600 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              {/* Message Bubble */}
              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[90%] shadow-2xs ${
                  msg.sender === 'user'
                    ? 'ml-auto bg-amber-600 text-white font-medium'
                    : 'mr-auto bg-white border border-stone-200 text-slate-800'
                }`}
              >
                {msg.text}
              </div>

              {/* Action Chip indicator */}
              {msg.action && msg.action !== 'message' && (
                <div className="mr-auto">
                  <ActionChip label={`Action: ${msg.action.replace('_', ' ')}`} status="done" />
                </div>
              )}

              {/* Rich Email Card */}
              {msg.rich_card && (
                <div className="mr-auto max-w-[95%]">
                  <RichEmailCard
                    email={msg.rich_card}
                    onOpen={(id) => navigate(`/email/${id}`)}
                  />
                </div>
              )}

              {/* In-chat Send Confirmation Card */}
              {msg.confirmation && (
                <div className="mr-auto max-w-[95%]">
                  <ActionConfirmationCard
                    details={msg.confirmation}
                    onConfirm={onConfirmSend}
                    onCancel={onCancelSend}
                  />
                </div>
              )}
            </div>
          ))
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 p-3 bg-white border border-stone-200 rounded-2xl text-xs text-slate-600 w-fit shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>AI is controlling the interface...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-stone-200 bg-white shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Command the UI (e.g. 'Show unread emails')..."
            className="flex-1 py-2 px-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white text-slate-800 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="p-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white disabled:opacity-40 transition-colors shadow-2xs shrink-0"
            aria-label="Send command"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
