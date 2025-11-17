process.env.CODA_API_TOKEN = process.env.CODA_API_TOKEN || 'test-coda-token';
process.env.STYTCH_PROJECT_ID = process.env.STYTCH_PROJECT_ID || 'project-test';
process.env.STYTCH_SECRET = process.env.STYTCH_SECRET || 'secret-test';
process.env.STYTCH_DOMAIN = process.env.STYTCH_DOMAIN || 'https://api.stytch.com';
process.env.BASE_URL = process.env.BASE_URL || 'https://coda.bestviable.com';

import type { Request, Response } from 'express';
import { authenticate, __setStytchClient } from '../middleware/stytch-auth';

type MockResponse = Response & {
  headersStore: Record<string, string>;
  body?: unknown;
  statusCode?: number;
};

const createResponse = (): MockResponse => {
  const headersStore: Record<string, string> = {};
  const res: Partial<Response> = {
    status(code: number) {
      (this as any).statusCode = code;
      return this as Response;
    },
    setHeader(key: string, value: string) {
      headersStore[key] = value;
      return this as Response;
    },
    json(payload: unknown) {
      (this as any).body = payload;
      return this as Response;
    },
  };
  return Object.assign(res, { headersStore, statusCode: 200 }) as MockResponse;
};

const createJwt = (payload: Record<string, unknown>): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
};

describe('authenticate middleware', () => {
  beforeEach(() => {
    __setStytchClient(null as any);
  });

  it('returns 401 with RFC-compliant header when token is missing', async () => {
    const req = { path: '/mcp', headers: {} } as Partial<Request>;
    const res = createResponse();
    await authenticate(req as Request, res as Response, jest.fn());
    expect(res.statusCode).toBe(401);
    expect(res.headersStore['WWW-Authenticate']).toContain('resource_metadata_uri');
    expect(res.body).toMatchObject({ error: 'unauthorized' });
  });

  it('rejects tokens with mismatched audience', async () => {
    const fakeClient = {
      sessions: {
        authenticateJwt: jest.fn().mockResolvedValue({
          session: {
            session_id: 'sess-123',
            user_id: 'user-123',
            custom_claims: {},
          },
        }),
      },
    };
    __setStytchClient(fakeClient as any);

    const wrongAudienceToken = createJwt({
      aud: 'https://not-valid.example/mcp',
      iss: 'https://api.stytch.com',
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    const req = {
      path: '/mcp',
      headers: { authorization: `Bearer ${wrongAudienceToken}` },
    } as Partial<Request>;
    const res = createResponse();

    await authenticate(req as Request, res as Response, jest.fn());

    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ message: 'Token audience mismatch' });
    expect(res.headersStore['WWW-Authenticate']).toContain('resource_metadata_uri');
  });
});
