// src/routes/connector-claude.ts
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authenticate, AuthenticatedRequest } from '../middleware/stytch-auth';

const router = Router();

// POST /connector/claude
router.post('/claude', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Anthropic API key not configured' });
    }
    try {
        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            req.body,
            {
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }
        );
        res.status(response.status).json(response.data);
    } catch (err: any) {
        console.error('[Connector Claude] error', err);
        if (axios.isAxiosError(err)) {
            const status = err.response?.status || 500;
            const data = err.response?.data || { message: 'Claude request failed' };
            return res.status(status).json(data);
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
