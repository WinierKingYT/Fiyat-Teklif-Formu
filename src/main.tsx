import React from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import Logger from './utils/logger'
// @ts-ignore
import { registerSW } from 'virtual:pwa-register'
import toast from 'react-hot-toast'

// Register Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    toast((t) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '14px' }}>Yeni güncelleme mevcut</span>
        <button
          onClick={() => { toast.dismiss(t.id); updateSW(true); }}
          style={{
            background: 'var(--color-primary, #7C3AED)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Yenile
        </button>
      </div>
    ), { duration: 0 });
  },
  onOfflineReady() {
    toast.success('Uygulama çevrimdışı çalışmaya hazır');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
