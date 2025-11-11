import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
    user_uuid: string;
  };
  serviceToken?: string;
  authMode?: 'cloudflare' | 'bearer';
}