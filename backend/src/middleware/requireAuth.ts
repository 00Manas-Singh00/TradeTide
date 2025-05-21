import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Extend the Request type
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      // add other fields if needed
    };
  }
}

interface AuthPayload {
  id: string;
  // add other fields if needed
}

const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  // Allow mock token for demo
  if (token === 'mock-jwt-token') {
    // Use a valid ObjectId string for demo/mock user
    req.user = { id: '64b7c2f2e4b0c2a1d8e4f123' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }
};

export default requireAuth; 