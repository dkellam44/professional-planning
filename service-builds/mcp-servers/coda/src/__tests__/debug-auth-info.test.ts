import request from 'supertest';
import express from 'express';
import debugAuthInfoRouter from '../../src/routes/debug-auth-info';
import { decodeJwtClaims } from '../../src/middleware/stytch-auth';

// Helper to create a JWT (unsigned) for testing
function createFakeJwt(payload: object): string {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${header}.${body}.`;
}

describe('GET /debug/auth-info', () => {
    const app = express();
    app.use(debugAuthInfoRouter);

    beforeAll(() => {
        process.env.ENABLE_AUTH_DEBUG = 'true';
    });

    afterAll(() => {
        delete process.env.ENABLE_AUTH_DEBUG;
    });

    it('returns 200 with decoded claims for valid token', async () => {
        const payload = { sub: 'user123', email: 'test@example.com', aud: 'test-aud' };
        const token = createFakeJwt(payload);
        const res = await request(app)
            .get('/debug/auth-info')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(res.body.claims).toMatchObject(payload);
    });

    it('returns 400 for missing Authorization header', async () => {
        const res = await request(app).get('/debug/auth-info').expect(400);
        expect(res.body.error).toBe('Missing Authorization header');
    });

    it('returns 400 for malformed token', async () => {
        const res = await request(app)
            .get('/debug/auth-info')
            .set('Authorization', 'Bearer malformed')
            .expect(400);
        expect(res.body.error).toBe('Invalid token format');
    });
});
