import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// Hide splash once React mounts
if (typeof window !== 'undefined' && window.__hideSplash) {
  window.__hideSplash();
}

// Register PWA service worker in production
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => {
        try { window.__sw_registered = true; } catch (e) {}
        return navigator.serviceWorker.ready;
      })
      .then(() => { try { window.__sw_ready = true; } catch (e) {} })
      .catch((err) => {
        console.error('SW registration failed', err);
      });
  });
}
