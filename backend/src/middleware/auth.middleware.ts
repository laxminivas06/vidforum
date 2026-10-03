import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sendError } from '../utils/api-response';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  institutionId: string;
  permissions: string[];
  assignedWorkspaces?: string[];
  mustChangePassword?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      institutionId?: string;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication token missing or invalid', 401, 'UNAUTHORIZED');
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      fullName: decoded.fullName,
      role: decoded.role,
      institutionId: decoded.institutionId,
      permissions: decoded.permissions || [],
      assignedWorkspaces: decoded.assignedWorkspaces || [],
      mustChangePassword: Boolean(decoded.mustChangePassword),
    };
    req.institutionId = req.user.institutionId;
    next();
  } catch (error: any) {
    if (error?.name === 'TokenExpiredError') {
      sendError(res, 'Token has expired. Please refresh your session.', 401, 'TOKEN_EXPIRED');
    } else {
      sendError(res, 'Invalid or expired token', 401, 'INVALID_TOKEN');
    }
  }
}
