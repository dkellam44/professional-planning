import { useStytchUser, useStytch } from '@stytch/react';
import { IdentityProvider, StytchLogin } from '@stytch/react';
import { Products, OAuthProviders } from '@stytch/vanilla-js';
import { useEffect } from 'react';

/**
 * MCP OAuth Authorization UI (B2C)
 *
 * This component handles the OAuth authorization flow for MCP clients (ChatGPT, Claude).
 *
 * Flow:
 * 1. If user not logged in → Show Google OAuth login
 * 2. User authenticates with Google → Stytch creates session
 * 3. Once logged in → IdentityProvider shows Connected Apps consent screen
 * 4. User approves → Redirects to ChatGPT with authorization code
 */
function App() {
  const { user } = useStytchUser();
  const stytchClient = useStytch();

  // Handle OAuth callback from Google
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const isCallback = window.location.pathname === '/oauth/callback';

    if (token && !user) {
      // Authenticate the OAuth token
      stytchClient.oauth.authenticate(token, {
        session_duration_minutes: 60,
      }).then(() => {
        // After successful authentication, redirect back to /oauth/authorize with saved parameters
        if (isCallback) {
          const savedParams = sessionStorage.getItem('oauth_params');
          if (savedParams) {
            window.location.href = `/oauth/authorize?${savedParams}`;
          } else {
            window.location.href = '/oauth/authorize';
          }
        }
      }).catch((error) => {
        console.error('[OAuth] Authentication failed:', error);
      });
    }
  }, [user, stytchClient]);

  // If user is logged in, show the Connected Apps consent screen
  if (user) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h2>Authorize Coda MCP</h2>
          <IdentityProvider />
        </div>
      </div>
    );
  }

  // If user is not logged in, show the login screen
  // Save the current OAuth parameters to restore after Google login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.toString()) {
      sessionStorage.setItem('oauth_params', params.toString());
    }
  }, []);

  // Redirect to clean callback URL (required by Stytch redirect URL validation)
  const callbackUrl = `${window.location.origin}/oauth/callback`;

  const loginConfig = {
    products: [Products.oauth],
    oauthOptions: {
      providers: [{ type: OAuthProviders.Google }],
      loginRedirectURL: callbackUrl,
      signupRedirectURL: callbackUrl,
    },
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2>Sign in to Authorize Coda MCP</h2>
        <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '0.9rem' }}>
          Sign in with your Google account to continue
        </p>
        <StytchLogin config={loginConfig} />
      </div>
    </div>
  );
}

export default App;
