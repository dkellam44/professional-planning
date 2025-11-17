import { B2BIdentityProvider, StytchB2B, useStytchMemberSession } from '@stytch/react/b2b';

const config = window.__MCP_AUTH_CONFIG__ || {};
const redirectUrl = config.redirectUrl || window.location.origin + window.location.pathname;

const loginConfig = {
  authFlowType: 'organization' as const,
  products: ['emailMagicLinks' as const],
  emailMagicLinksOptions: {
    loginRedirectURL: redirectUrl,
    loginExpirationMinutes: 30,
    signupRedirectURL: redirectUrl,
    signupExpirationMinutes: 30,
    createOrganizationEnabled: false,
  },
  sessionOptions: {
    sessionDurationMinutes: 120,
  },
};

function App() {
  const { session, isInitialized } = useStytchMemberSession({ assumeHydrated: false });

  if (!isInitialized) {
    return <div className="auth-loading">Loading authorization experience…</div>;
  }

  if (!session) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h2>Sign in to continue</h2>
          <StytchB2B config={loginConfig} />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <B2BIdentityProvider />
      </div>
    </div>
  );
}

export default App;
