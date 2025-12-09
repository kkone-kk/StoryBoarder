import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import posthog from 'posthog-js';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Initialize PostHog if environment variables are present
// Fix: Cast import.meta to any to avoid TypeScript error 'Property env does not exist on type ImportMeta'
const posthogKey = (import.meta as any).env?.VITE_POSTHOG_KEY;
const posthogHost = (import.meta as any).env?.VITE_POSTHOG_HOST;

if (posthogKey && posthogHost) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    autocapture: true,
    capture_pageview: true,
    persistence: 'localStorage',
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);