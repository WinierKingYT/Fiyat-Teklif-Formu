import React from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Logger from './utils/logger'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Yeni içerik mevcut. Yenilemek ister misiniz?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    Logger.log('Uygulama çevrimdışı çalışmaya hazır.');
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
