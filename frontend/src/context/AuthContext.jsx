import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check auth on initial mount or redirect
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        // Check if session_id is in current URL query (returned from OAuth redirect)
        const params = new URLSearchParams(window.location.search);
        const urlSessionId = params.get('session_id');

        if (urlSessionId) {
          localStorage.setItem('nebula_session_id', urlSessionId);
          // Clean URL without full reload
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }

        const storedSessionId = localStorage.getItem('nebula_session_id');
        const res = await authService.getMe(storedSessionId);

        if (res.success && res.data.connected) {
          setUser(res.data);
          setIsConnected(true);
        } else {
          setUser(null);
          setIsConnected(false);
        }
      } catch (err) {
        console.error('Failed to verify session:', err);
        setError('Failed to check authentication status');
        setUser(null);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const connectGmail = async () => {
    try {
      setError(null);
      const res = await authService.startGoogleAuth();
      if (res.success && res.data.auth_url) {
        // Redirect browser to Google's OAuth consent screen
        window.location.href = res.data.auth_url;
      } else {
        throw new Error('Could not retrieve Google authorization URL');
      }
    } catch (err) {
      console.error('Failed to initiate Google OAuth:', err);
      setError('Unable to start Google sign-in. Please try again.');
    }
  };

  const disconnectGmail = async () => {
    try {
      const storedSessionId = localStorage.getItem('nebula_session_id');
      await authService.logout(storedSessionId);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('nebula_session_id');
      setUser(null);
      setIsConnected(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isConnected,
        loading,
        error,
        connectGmail,
        disconnectGmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
