import api from './api';

export const assistantService = {
  async sendCommand(prompt, context = {}) {
    const response = await api.post('/api/assistant/command', {
      prompt,
      context
    });
    return response.data;
  },

  async getHealth() {
    const response = await api.get('/api/assistant/health');
    return response.data;
  }
};
