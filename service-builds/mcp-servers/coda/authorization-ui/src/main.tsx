import React from 'react';
import ReactDOM from 'react-dom/client';
import { StytchB2BProvider } from '@stytch/react/b2b';
import { StytchB2BUIClient } from '@stytch/vanilla-js/b2b';
import App from './App';
import './style.css';

const config = window.__MCP_AUTH_CONFIG__ || {};

if (!config.stytchPublicToken) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<main class="auth-error">Missing Stytch public token. Contact the admin.</main>';
  }
} else {
  const stytchClient = new StytchB2BUIClient(config.stytchPublicToken);
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <StytchB2BProvider stytch={stytchClient}>
        <App />
      </StytchB2BProvider>
    </React.StrictMode>
  );
}
