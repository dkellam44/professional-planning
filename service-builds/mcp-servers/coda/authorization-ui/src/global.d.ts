declare global {
  interface Window {
    __MCP_AUTH_CONFIG__?: {
      stytchPublicToken?: string;
      redirectUrl?: string;
    };
  }
}

export {};
