import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { assistantService } from '../services/assistant';
import { mailService } from '../services/mail';
import { useMail } from './MailContext';
import { useAuth } from './AuthContext';

const AssistantContext = createContext(null);

export function AssistantProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    openCompose,
    closeCompose,
    setFilters,
    clearFilters,
    fetchInbox,
    selectedEmail,
    filters,
    refresh
  } = useMail();

  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  // Derive current view from pathname
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.startsWith('/email/')) return 'email_detail';
    if (path.startsWith('/sent')) return 'sent';
    if (path.startsWith('/compose')) return 'compose';
    return 'inbox';
  };

  // Get current open email ID if on detail view
  const getCurrentEmailId = () => {
    const path = location.pathname;
    if (path.startsWith('/email/')) {
      return path.replace('/email/', '');
    }
    return null;
  };

  // Visible typing / field populator animation
  const streamFormFill = async (params) => {
    // Step 1: Open compose modal with empty fields
    openCompose({ to: '', subject: '', body: '' }, true);

    // Step 2: Animate 'To' field
    await new Promise((r) => setTimeout(r, 200));
    openCompose({ to: params.to || '', subject: '', body: '' }, true);

    // Step 3: Animate 'Subject' field
    await new Promise((r) => setTimeout(r, 250));
    openCompose({ to: params.to || '', subject: params.subject || '', body: '' }, true);

    // Step 4: Animate 'Body' field
    await new Promise((r) => setTimeout(r, 300));
    openCompose({ to: params.to || '', subject: params.subject || '', body: params.body || '' }, true);
  };

  // Dispatch and execute structured AI actions
  const executeAction = async (actionResponse) => {
    const { action, params, explanation, rich_card, requires_confirmation } = actionResponse;

    if (action === 'compose_email') {
      // Visibly populate compose fields
      await streamFormFill(params);

      if (requires_confirmation) {
        setPendingConfirmation({
          type: 'send_email',
          data: params
        });
      }
    } else if (action === 'search_emails') {
      // Update unified filter state
      const newFilters = {
        ...filters,
        sender: params.sender || '',
        keyword: params.keyword || '',
        datePreset: params.date_preset || '',
        unreadOnly: params.unread || false
      };
      setFilters(newFilters);
      // Main UI updates visibly with search results
      navigate('/inbox');
      fetchInbox();
    } else if (action === 'open_email') {
      if (params.email_id) {
        navigate(`/email/${params.email_id}`);
      }
    } else if (action === 'reply_email') {
      if (params.email_id && selectedEmail) {
        const recipient = selectedEmail.from?.email || selectedEmail.from?.raw;
        const origSubj = selectedEmail.subject || '';
        const replySubject = origSubj.toLowerCase().startsWith('re:') ? origSubj : `Re: ${origSubj}`;

        openCompose(
          {
            to: recipient,
            subject: replySubject,
            body: params.body || `\n\n--- In reply to: ---\n${selectedEmail.snippet}`
          },
          true,
          {
            message_id: selectedEmail.headers?.message_id,
            thread_id: selectedEmail.thread_id,
            subject: selectedEmail.subject
          }
        );
      }
    } else if (action === 'filter_emails') {
      const updated = {
        ...filters,
        unreadOnly: params.unread !== undefined ? params.unread : filters.unreadOnly,
        datePreset: params.date_preset || filters.datePreset,
        sender: params.sender || filters.sender
      };
      setFilters(updated);
      navigate('/inbox');
      fetchInbox();
    } else if (action === 'clear_filters') {
      clearFilters();
      navigate('/inbox');
    } else if (action === 'navigate') {
      if (params.destination === 'compose') {
        openCompose();
      } else {
        navigate(`/${params.destination}`);
      }
    }

    // Add assistant response to message history
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'assistant',
        text: explanation,
        action,
        rich_card,
        confirmation: requires_confirmation ? params : null
      }
    ]);
  };

  // Main command handler
  const sendCommand = async (prompt) => {
    if (!prompt.trim() || isProcessing) return;

    const userMessage = { id: Date.now(), sender: 'user', text: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const context = {
        current_view: getCurrentView(),
        current_email_id: getCurrentEmailId(),
        current_thread_id: selectedEmail?.thread_id || null,
        current_folder: location.pathname.includes('/sent') ? 'sent' : 'inbox',
        current_filters: filters,
        selected_email: selectedEmail
      };

      const res = await assistantService.sendCommand(prompt, context);
      await executeAction(res);
    } catch (err) {
      console.error('Assistant error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'assistant',
          text: 'The AI assistant is temporarily unavailable. You can continue using the application normally.'
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmSend = async () => {
    if (!pendingConfirmation) return;
    const { data } = pendingConfirmation;
    setPendingConfirmation(null);

    try {
      const res = await mailService.sendEmail(data);
      if (res.success) {
        closeCompose();
        refresh();
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'assistant',
            text: `Email successfully sent to ${data.to}!`
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'assistant',
            text: `Failed to send email: ${res.error?.message || 'Unknown error'}. Your draft is preserved.`
          }
        ]);
      }
    } catch (err) {
      console.error('Error confirming send:', err);
    }
  };

  const cancelSend = () => {
    setPendingConfirmation(null);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'assistant',
        text: 'Email sending cancelled. You can continue editing your draft.'
      }
    ]);
  };

  return (
    <AssistantContext.Provider
      value={{
        messages,
        isProcessing,
        sendCommand,
        confirmSend,
        cancelSend,
        pendingConfirmation
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
}
