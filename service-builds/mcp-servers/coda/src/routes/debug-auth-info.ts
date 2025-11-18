import { Router, Request, Response } from 'express';
import { decodeJwtClaims } from '../middleware/stytch-auth';
import { AuthenticatedRequest } from '../middleware/stytch-auth';

const router = Router();

router.get('/debug/auth-info', (req: AuthenticatedRequest, res: Response) => {
    const enableDebug = process.env.ENABLE_AUTH_DEBUG === 'true';
    if (!enableDebug) {
        return res.status(404).json({ error: 'Not found' });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(400).json({ error: 'Missing Authorization header' });
    }
    const token = authHeader.substring(7);
    try {
        const claims = decodeJwtClaims(token);
        return res.status(200).json({ claims });
    } catch (e) {
        return res.status(400).json({ error: 'Invalid token format' });
    }
});

export default router;
