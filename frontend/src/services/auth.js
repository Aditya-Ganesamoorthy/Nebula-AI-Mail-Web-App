import api from './api';

export const authService = {
  async startGoogleAuth() {
    const response = await api.get('/auth/google/start');
    return response.data;
  },

  async getMe(sessionId = null) {
    const params = sessionId ? { session_id: sessionId } : {};
    const response = await api.get('/auth/me', { params });
    return response.data;
  },

  async logout(sessionId = null) {
    const params = sessionId ? { session_id: sessionId } : {};
    const response = await api.post('/auth/logout', null, { params });
    return response.data;
  }
};
