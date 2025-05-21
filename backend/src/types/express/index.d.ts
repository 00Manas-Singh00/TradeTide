import { Express } from 'express-serve-static-core';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        // Add other user properties as needed
      };
    }
  }
}

export {}; 