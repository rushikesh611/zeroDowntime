import express from 'express';
import request from 'supertest';
import logSourceRouter from '../src/routes/logSource.js';
import prisma from '../src/lib/prisma.js';
import crypto from 'crypto';

// Mock auth middleware
jest.mock('../src/middleware/auth.js', () => {
  return jest.fn((req, res, next) => {
    req.user = { id: 'user-123', username: 'test_user', plan: 'PRO' };
    next();
  });
});

jest.mock('../src/lib/prisma.js', () => ({
  __esModule: true,
  default: {
    logSource: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
// 204 handler
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data: any) {
    if (
      data === null ||
      data === undefined ||
      (Array.isArray(data) && data.length === 0)
    ) {
      return res.status(204).end();
    }
    return originalJson.call(this, data);
  };
  next();
});
app.use('/api/log', logSourceRouter);

describe('Log Source API & Key Hashing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/log', () => {
    it('should create log source and return raw api key', async () => {
      const mockedPrisma = prisma as any;
      
      mockedPrisma.logSource.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: 'source-1',
          name: data.name,
          apiKey: data.apiKey,
          userId: data.userId,
          createdAt: new Date().toISOString(),
        });
      });

      const res = await request(app)
        .post('/api/log')
        .send({ name: 'Backend API Service' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Backend API Service');
      expect(res.body.apiKey).toHaveLength(64);
      
      const dbSavedHash = mockedPrisma.logSource.create.mock.calls[0][0].data.apiKey;
      const expectedHash = crypto.createHash('sha256').update(res.body.apiKey).digest('hex');
      expect(dbSavedHash).toBe(expectedHash);
    });
  });

  describe('GET /api/log', () => {
    it('should return log sources with masked api keys', async () => {
      const mockSources = [
        {
          id: 'source-1',
          name: 'Frontend Web App',
          apiKey: 'db_saved_sha256_hash_value',
          createdAt: new Date().toISOString(),
        },
      ];

      const mockedPrisma = prisma as any;
      mockedPrisma.logSource.findMany.mockResolvedValue(mockSources);

      const res = await request(app).get('/api/log');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Frontend Web App');
      expect(res.body[0].apiKey).toBe('••••••••••••••••');
    });
  });

  describe('GET /api/log/validate', () => {
    it('should validate valid raw api key successfully', async () => {
      const rawKey = 'raw_key_123456789_abcdef';
      const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

      const mockSource = {
        id: 'source-1',
        name: 'Production Server',
        userId: 'user-123',
      };

      const mockedPrisma = prisma as any;
      mockedPrisma.logSource.findUnique.mockResolvedValue(mockSource);

      const res = await request(app)
        .get('/api/log/validate')
        .set('X-API-Key', rawKey);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('source-1');
      expect(res.body.name).toBe('Production Server');
      expect(mockedPrisma.logSource.findUnique).toHaveBeenCalledWith({
        where: { apiKey: hashedKey },
        select: expect.any(Object),
      });
    });
  });
});
