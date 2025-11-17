process.env.CODA_API_TOKEN = process.env.CODA_API_TOKEN || 'test-coda-token';
process.env.STYTCH_PROJECT_ID = process.env.STYTCH_PROJECT_ID || 'project-test';
process.env.STYTCH_SECRET = process.env.STYTCH_SECRET || 'secret-test';
process.env.STYTCH_DOMAIN = process.env.STYTCH_DOMAIN || 'https://api.stytch.com';
process.env.BASE_URL = process.env.BASE_URL || 'https://coda.bestviable.com';

import request from 'supertest';
import { app } from '../http-server';

describe('OAuth metadata endpoint', () => {
  it('returns protected resource metadata without auth', async () => {
    const response = await request(app)
      .get('/.well-known/oauth-protected-resource')
      .expect(200);

    expect(response.body).toHaveProperty('resource', 'https://coda.bestviable.com/mcp');
    expect(response.body.authorization_servers).toContain('https://api.stytch.com');
    expect(response.body.bearer_methods_supported).toContain('header');
  });
});
