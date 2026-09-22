import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mailService } from '../services/mail';
import { useAuth } from './AuthContext';
import { useRealtime } from '../hooks/useRealtime';

const MailContext = createContext(null);

export function MailProvider({ children }) {
  const { isConnected, user } = useAuth();

  const [inboxMessages, setInboxMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [prevPageTokens, setPrevPageTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Active view & selection
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Unified Filter State (Shared between manual UI and AI assistant)
  const [filters, setFilters] = useState({
    sender: '',
    keyword: '',
    datePreset: '',
    dateFrom: '',
    dateTo: '',
    unreadOnly: false,
  });

  // Compose Modal State
  const [composeState, setComposeState] = useState({
    isOpen: false,
    data: {},
    isAi: false,
    replyContext: null,
  });

  // Build Gmail query string from filters
  const buildFilterQuery = useCallback(() => {
    const parts = [];
    if (filters.unreadOnly) parts.push('is:unread');
    if (filters.sender) parts.push(`from:${filters.sender}`);
    if (filters.keyword) parts.push(filters.keyword);
    if (filters.dateFrom) parts.push(`after:${filters.dateFrom}`);
    if (filters.dateTo) parts.push(`before:${filters.dateTo}`);
    return parts.join(' ').trim();
  }, [filters]);

  // Fetch Inbox
  const fetchInbox = useCallback(
    async (customQuery = null, pageToken = null) => {
      if (!isConnected) return;
      try {
        setLoading(true);
        setError(null);
        const queryToUse = customQuery !== null ? customQuery : buildFilterQuery();
        const res = await mailService.getInbox({
          q: queryToUse || undefined,
          page_token: pageToken || undefined,
        });

        if (res.success) {
          setInboxMessages(res.data.messages || []);
          setNextPageToken(res.data.next_page_token || null);
        } else {
          setError(res.error?.message || 'Failed to load inbox');
        }
      } catch (err) {
        console.error('Error fetching inbox:', err);
        setError('Unable to load emails. Please check your connection.');
      } finally {
        setLoading(false);
      }
    },
    [isConnected, buildFilterQuery]
  );

  // Fetch Sent
  const fetchSent = useCallback(
    async (customQuery = null, pageToken = null) => {
      if (!isConnected) return;
      try {
        setLoading(true);
        setError(null);
        const res = await mailService.getSent({
          q: customQuery || undefined,
          page_token: pageToken || undefined,
        });

        if (res.success) {
          setSentMessages(res.data.messages || []);
          setNextPageToken(res.data.next_page_token || null);
        } else {
          setError(res.error?.message || 'Failed to load sent emails');
        }
      } catch (err) {
        console.error('Error fetching sent mail:', err);
        setError('Unable to load sent emails.');
      } finally {
        setLoading(false);
      }
    },
    [isConnected]
  );

  // Fetch Single Message Detail
  const fetchMessageDetail = useCallback(async (messageId) => {
    try {
      setLoadingDetail(true);
      setError(null);
      const res = await mailService.getMessage(messageId);
      if (res.success) {
        setSelectedEmail(res.data);
        return res.data;
      } else {
        setError(res.error?.message || 'Email not found');
        return null;
      }
    } catch (err) {
      console.error('Error fetching email details:', err);
      setError('Failed to load message.');
      return null;
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Refresh current folder
  const refresh = useCallback(() => {
    if (activeFolder === 'inbox') {
      fetchInbox();
    } else {
      fetchSent();
    }
  }, [activeFolder, fetchInbox, fetchSent]);

  // Initial load on authentication
  useEffect(() => {
    if (isConnected) {
      refresh();
    }
  }, [isConnected, activeFolder]);

  // Real-Time Pub/Sub & WebSocket Synchronization
  const handleRealtimeInboxUpdate = useCallback(
    (delta) => {
      console.info('Real-time push received via WebSocket from Pub/Sub:', delta);
      if (activeFolder === 'inbox') {
        fetchInbox();
      }
    },
    [activeFolder, fetchInbox]
  );

  const {
    status: realtimeStatus,
    lastSyncTime,
    lastDelta,
    forceReconnect,
    isConnected: isLiveSyncConnected,
  } = useRealtime({
    userEmail: user?.email,
    onInboxUpdated: handleRealtimeInboxUpdate,
    enabled: isConnected && !!user?.email,
  });

  // Open Compose Modal
  const openCompose = (data = {}, isAi = false, replyContext = null) => {
    setComposeState({
      isOpen: true,
      data,
      isAi,
      replyContext,
    });
  };

  // Close Compose Modal
  const closeCompose = () => {
    setComposeState((prev) => ({ ...prev, isOpen: false, data: {}, replyContext: null }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      sender: '',
      keyword: '',
      datePreset: '',
      dateFrom: '',
      dateTo: '',
      unreadOnly: false,
    });
    fetchInbox('');
  };

  const isFiltered = Boolean(
    filters.sender ||
      filters.keyword ||
      filters.datePreset ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.unreadOnly
  );

  return (
    <MailContext.Provider
      value={{
        inboxMessages,
        sentMessages,
        loading,
        error,
        activeFolder,
        setActiveFolder,
        selectedEmail,
        setSelectedEmail,
        loadingDetail,
        filters,
        setFilters,
        clearFilters,
        isFiltered,
        fetchInbox,
        fetchSent,
        fetchMessageDetail,
        refresh,
        composeState,
        openCompose,
        closeCompose,
        nextPageToken,
        realtimeStatus,
        lastSyncTime,
        lastDelta,
        forceReconnect,
        isLiveSyncConnected,
      }}
    >
      {children}
    </MailContext.Provider>
  );
}

export function useMail() {
  const context = useContext(MailContext);
  if (!context) {
    throw new Error('useMail must be used within a MailProvider');
  }
  return context;
}
