import React from 'react';
import ReactDOM from 'react-dom/client';
import { StytchProvider } from '@stytch/react';
import { StytchUIClient } from '@stytch/vanilla-js';
import App from './App';
import './style.css';

const config = window.__MCP_AUTH_CONFIG__ || {};

if (!config.stytchPublicToken) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<main class="auth-error">Missing Stytch public token. Contact the admin.</main>';
  }
} else {
  const stytchClient = new StytchUIClient(config.stytchPublicToken);
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <StytchProvider stytch={stytchClient}>
        <App />
      </StytchProvider>
    </React.StrictMode>
  );
}
