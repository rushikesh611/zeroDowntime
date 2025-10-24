import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User, PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
export default async function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token;
  if (!token) {
    logger.warn('Access denied. No token provided.');
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '$2a$04$Ls3wM2PzVdm.08FoS3sv3uANW.EkuhFhNdSeuBNpKkXInkXumGgkm') as JwtPayload;
    // Fetch user from the database using the decoded userId
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      logger.warn('User not found for the provided token.');
      throw new Error('User not found');
    }

    // Attach the user object to the request
    req.user = user;
    logger.info(`User authenticated: ${user.username}`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(400).json({ error: 'Invalid token.' });
  }
}