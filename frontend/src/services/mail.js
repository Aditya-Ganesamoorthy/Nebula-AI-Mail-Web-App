import api from './api';

export const mailService = {
  async getInbox(params = {}) {
    const response = await api.get('/api/mail/inbox', { params });
    return response.data;
  },

  async getSent(params = {}) {
    const response = await api.get('/api/mail/sent', { params });
    return response.data;
  },

  async getMessage(messageId) {
    const response = await api.get(`/api/mail/${messageId}`);
    return response.data;
  },

  async getThread(threadId) {
    const response = await api.get(`/api/mail/threads/${threadId}`);
    return response.data;
  },

  async sendEmail(payload) {
    const response = await api.post('/api/mail/send', payload);
    return response.data;
  },

  async replyEmail(payload) {
    const response = await api.post('/api/mail/reply', payload);
    return response.data;
  },

  async markAsRead(messageIds, unread = false) {
    const response = await api.post('/api/mail/mark-read', {
      message_ids: messageIds,
      unread
    });
    return response.data;
  }
};
