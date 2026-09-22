import React, { useState, useEffect, useRef } from 'react';
import { X, Send, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { mailService } from '../../services/mail';

export default function ComposeModal({
  isOpen = false,
  onClose,
  initialData = {},
  onEmailSent,
  isAiControlled = false,
  replyContext = null
}) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Track autofill highlighting
  const [highlightField, setHighlightField] = useState('');

  // Populate initial or AI-filled data
  useEffect(() => {
    if (initialData.to !== undefined) {
      setTo(initialData.to);
      setHighlightField('to');
    }
    if (initialData.subject !== undefined) {
      setSubject(initialData.subject);
      setHighlightField('subject');
    }
    if (initialData.body !== undefined) {
      setBody(initialData.body);
      setHighlightField('body');
    }

    const timer = setTimeout(() => setHighlightField(''), 1500);
    return () => clearTimeout(timer);
  }, [initialData]);

  if (!isOpen) return null;

  const validateForm = () => {
    setValidationError('');
    setApiError('');

    if (!to.trim()) {
      setValidationError('Recipient (To) address is required.');
      return false;
    }

    const addresses = to.split(',').map((a) => a.trim());
    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

    for (const addr of addresses) {
      let clean = addr;
      const match = addr.match(/^.*?<([^>]+)>$/);
      if (match) clean = match[1].trim();

      if (!emailRegex.test(clean)) {
        setValidationError(`"${addr}" is not a valid email address.`);
        return false;
      }
    }

    if (!body.trim()) {
      setValidationError('Email body cannot be empty.');
      return false;
    }

    return true;
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (isSending) return; // Prevent double clicks

    if (!validateForm()) return;

    try {
      setIsSending(true);
      setApiError('');

      const payload = {
        to,
        subject: subject.trim() || '(No Subject)',
        body,
        thread_id: replyContext?.thread_id,
        in_reply_to: replyContext?.message_id
      };

      const res = await mailService.sendEmail(payload);

      if (res.success) {
        setSuccessMessage('Email sent successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          setTo('');
          setSubject('');
          setBody('');
          onClose();
          if (onEmailSent) onEmailSent();
        }, 1000);
      } else {
        setApiError(res.error?.message || 'Failed to send email. Your draft is preserved.');
      }
    } catch (err) {
      console.error('Send email error:', err);
      setApiError('Network error while dispatching email. Your draft is preserved.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              {replyContext ? `Reply: ${replyContext.subject}` : 'New Message'}
            </h2>
            {isAiControlled && (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                <Sparkles className="w-2.5 h-2.5 text-amber-700" />
                AI Autofilled
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSend} className="flex-1 flex flex-col overflow-y-auto">
          {/* Validation / API Error Banner */}
          {(validationError || apiError) && (
            <div className="px-5 py-2.5 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError || apiError}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* To Field */}
          <div className="px-5 py-2.5 border-b border-stone-100 flex items-center gap-3">
            <label htmlFor="compose-to" className="w-16 text-xs font-semibold text-slate-500">To:</label>
            <input
              id="compose-to"
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className={`flex-1 text-xs text-slate-800 focus:outline-none transition-colors ${
                highlightField === 'to' ? 'field-autofill-highlight font-semibold' : ''
              }`}
            />
          </div>

          {/* Subject Field */}
          <div className="px-5 py-2.5 border-b border-stone-100 flex items-center gap-3">
            <label htmlFor="compose-subject" className="w-16 text-xs font-semibold text-slate-500">Subject:</label>
            <input
              id="compose-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line"
              className={`flex-1 text-xs text-slate-800 focus:outline-none transition-colors ${
                highlightField === 'subject' ? 'field-autofill-highlight font-semibold' : ''
              }`}
            />
          </div>

          {/* Body Field */}
          <div className="flex-1 p-5 min-h-[220px]">
            <textarea
              id="compose-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email here..."
              rows={10}
              className={`w-full h-full text-xs text-slate-800 focus:outline-none resize-none leading-relaxed transition-colors ${
                highlightField === 'body' ? 'field-autofill-highlight' : ''
              }`}
            />
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-stone-200 rounded-lg transition-colors"
            >
              Discard Draft
            </button>

            <button
              type="submit"
              disabled={isSending}
              className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
