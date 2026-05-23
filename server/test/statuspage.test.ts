import express from 'express';
import request from 'supertest';
import statusPageRouter from '../src/routes/statuspage.js';
import prisma from '../src/lib/prisma.js';

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
    user: {
      findUnique: jest.fn(),
    },
    statusPage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    monitor: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
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
app.use('/api/status-pages', statusPageRouter);

describe('Status Pages API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/status-pages', () => {
    it('should create a status page successfully', async () => {
      const mockStatusPage = {
        id: 'sp-1',
        title: 'System Status',
        subdomain: 'status',
        userId: 'user-123',
      };

      const mockedPrisma = prisma as any;
      mockedPrisma.statusPage.count.mockResolvedValue(2);
      mockedPrisma.monitor.findUnique.mockResolvedValue({
        id: 'monitor-1',
        status: 'RUNNING',
      });
      mockedPrisma.statusPage.findUnique.mockResolvedValue(null); // Subdomain is available
      mockedPrisma.statusPage.create.mockResolvedValue(mockStatusPage);

      const res = await request(app)
        .post('/api/status-pages')
        .send({
          title: 'System Status',
          subdomain: 'status',
          monitorId: 'monitor-1',
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockStatusPage);
    });
  });

  describe('GET /api/status-pages/manage/:id', () => {
    it('should retrieve status page configuration if owner', async () => {
      const mockStatusPage = {
        id: 'sp-1',
        title: 'System Status',
        userId: 'user-123',
      };

      const mockedPrisma = prisma as any;
      mockedPrisma.statusPage.findUnique.mockResolvedValue(mockStatusPage);

      const res = await request(app).get('/api/status-pages/manage/sp-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('sp-1');
    });

    it('should return 403 if status page belongs to another user', async () => {
      const mockStatusPage = {
        id: 'sp-1',
        title: 'System Status',
        userId: 'user-456',
      };

      const mockedPrisma = prisma as any;
      mockedPrisma.statusPage.findUnique.mockResolvedValue(mockStatusPage);

      const res = await request(app).get('/api/status-pages/manage/sp-1');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Unauthorized');
    });
  });

  describe('PUT /api/status-pages/:id', () => {
    it('should update status page details', async () => {
      const mockStatusPage = {
        id: 'sp-1',
        title: 'System Status',
        userId: 'user-123',
      };

      const updatedPage = {
        ...mockStatusPage,
        title: 'Updated Status Title',
      };

      const mockedPrisma = prisma as any;
      mockedPrisma.statusPage.findUnique.mockResolvedValue(mockStatusPage);
      mockedPrisma.statusPage.update.mockResolvedValue(updatedPage);

      const res = await request(app)
        .put('/api/status-pages/sp-1')
        .send({ title: 'Updated Status Title' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Status Title');
    });
  });
});
