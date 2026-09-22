import React from 'react';
import { Sparkles, Send, CornerDownLeft } from 'lucide-react';

export default function AssistantPanel({
  messages = [],
  input = '',
  onInputChange,
  onSubmit,
  isProcessing = false,
  suggestedCommands = [
    "Show me emails from the last 10 days",
    "Find the email from Sarah about the project update",
    "Open the latest email from David",
    "Show only unread emails from this week",
    "Send an email to john@example.com"
  ],
  onSelectSuggestion
}) {
  return (
    <div className="flex flex-col h-full bg-stone-50/70">
      {/* Assistant Header */}
      <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800 tracking-tight">AI Co-pilot</h2>
            <p className="text-[11px] text-slate-500">Commands the mail interface</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          UI Controller
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-slate-500 mb-4">
              Ask me to search, filter, compose, or open emails:
            </p>
            <div className="space-y-2">
              {suggestedCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectSuggestion && onSelectSuggestion(cmd)}
                  className="w-full text-left p-2.5 rounded-lg text-xs bg-white hover:bg-amber-50/70 border border-stone-200 hover:border-amber-200 text-slate-700 transition-all shadow-2xs group flex items-start justify-between gap-2"
                >
                  <span>"{cmd}"</span>
                  <CornerDownLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-xl text-xs max-w-[85%] ${
                msg.sender === 'user'
                  ? 'ml-auto bg-amber-600 text-white shadow-2xs'
                  : 'mr-auto bg-white border border-stone-200 text-slate-800 shadow-2xs'
              }`}
            >
              {msg.text}
            </div>
          ))
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 p-3 bg-white border border-stone-200 rounded-xl text-xs text-slate-500 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            <span>AI is controlling the interface...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-stone-200 bg-white shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit && onSubmit();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange && onInputChange(e.target.value)}
            placeholder="Command the UI (e.g. 'Show unread emails')..."
            className="flex-1 py-2 px-3 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white text-slate-800 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="p-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 transition-colors shadow-2xs"
            aria-label="Send command"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
