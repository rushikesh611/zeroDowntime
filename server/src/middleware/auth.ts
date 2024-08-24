import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User, PrismaClient } from '@prisma/client'

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
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '$2a$04$Ls3wM2PzVdm.08FoS3sv3uANW.EkuhFhNdSeuBNpKkXInkXumGgkm') as JwtPayload;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });
  
      if (!user) {
        throw new Error('User not found');
      }
  
      req.user = user;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(400).json({ error: 'Invalid token.' });
    }
  }