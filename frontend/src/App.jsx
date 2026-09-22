import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Inbox from './pages/Inbox';
import Sent from './pages/Sent';
import EmailDetail from './pages/EmailDetail';
import Compose from './pages/Compose';
import Auth from './pages/Auth';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/sent" element={<Sent />} />
        <Route path="/email/:id" element={<EmailDetail />} />
        <Route path="/compose" element={<Compose />} />
        <Route path="/" element={<Navigate to="/inbox" replace />} />
        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
