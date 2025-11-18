// src/routes/connector-openai.ts
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authenticate, AuthenticatedRequest } from '../middleware/stytch-auth';

const router = Router();

// POST /connector/openai
router.post('/openai', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            req.body,
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }
        );
        res.status(response.status).json(response.data);
    } catch (err: any) {
        console.error('[Connector OpenAI] error', err);
        if (axios.isAxiosError(err)) {
            const status = err.response?.status || 500;
            const data = err.response?.data || { message: 'OpenAI request failed' };
            return res.status(status).json(data);
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
