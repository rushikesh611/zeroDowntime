import express from 'express';
import request from 'supertest';
import monitorRouter from '../src/routes/monitors.js';
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
    monitor: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    teamMember: {
      findMany: jest.fn(),
    },
    monitorTeam: {
      findMany: jest.fn(),
    },
    monitorLog: {
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

// Create App
const app = express();
app.use(express.json());
// Middleware to mock json response 204 handler
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
app.use('/api/monitors', monitorRouter);

describe('Monitors API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/monitors', () => {
    it('should create a monitor successfully', async () => {
      const mockMonitor = {
        id: 'monitor-1',
        name: 'Test HTTP Monitor',
        monitorType: 'http',
        url: 'https://example.com',
        frequency: 60,
        regions: ['us-east-1'],
        userId: 'user-123',
      };

      const mockedPrisma = prisma as any;
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'user-123', plan: 'PRO' });
      mockedPrisma.monitor.count.mockResolvedValue(5);
      mockedPrisma.monitor.create.mockResolvedValue(mockMonitor);

      const res = await request(app)
        .post('/api/monitors')
        .send({
          name: 'Test HTTP Monitor',
          monitorType: 'http',
          url: 'https://example.com',
          frequency: 60,
          regions: ['us-east-1'],
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockMonitor);
    });

    it('should fail if plan limit is reached', async () => {
      const mockedPrisma = prisma as any;
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'user-123', plan: 'PRO' });
      mockedPrisma.monitor.count.mockResolvedValue(15);

      const res = await request(app)
        .post('/api/monitors')
        .send({
          name: 'Test HTTP Monitor',
          monitorType: 'http',
          url: 'https://example.com',
          frequency: 60,
          regions: ['us-east-1'],
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('maximum number of monitors');
    });
  });

  describe('GET /api/monitors/:id', () => {
    it('should retrieve a monitor if owner', async () => {
      const mockMonitor = {
        id: 'monitor-1',
        name: 'Test HTTP Monitor',
        userId: 'user-123',
        sharedTeams: [],
      };

      const mockedPrisma = prisma as any;
      mockedPrisma.monitor.findUnique.mockResolvedValue(mockMonitor);

      const res = await request(app).get('/api/monitors/monitor-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('monitor-1');
      expect(res.body.role).toBe('OWNER');
    });

    it('should return 404 if monitor not found', async () => {
      const mockedPrisma = prisma as any;
      mockedPrisma.monitor.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/monitors/invalid-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Monitor not found');
    });
  });

  describe('PUT /api/monitors/:id', () => {
    it('should update monitor if owner', async () => {
      const mockMonitor = {
        id: 'monitor-1',
        name: 'Old Monitor Name',
        userId: 'user-123',
        sharedTeams: [],
      };

      const updatedMonitor = {
        ...mockMonitor,
        name: 'New Monitor Name',
      };

      const mockedPrisma = prisma as any;
      mockedPrisma.monitor.findUnique.mockResolvedValue(mockMonitor);
      mockedPrisma.monitor.update.mockResolvedValue(updatedMonitor);

      const res = await request(app)
        .put('/api/monitors/monitor-1')
        .send({ name: 'New Monitor Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Monitor Name');
    });
  });

  describe('DELETE /api/monitors/:id', () => {
    it('should delete monitor if owner', async () => {
      const mockMonitor = {
        id: 'monitor-1',
        userId: 'user-123',
        sharedTeams: [],
      };

      const mockedPrisma = prisma as any;
      mockedPrisma.monitor.findUnique.mockResolvedValue(mockMonitor);
      mockedPrisma.monitor.delete.mockResolvedValue(mockMonitor);

      const res = await request(app).delete('/api/monitors/monitor-1');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Monitor deleted successfully');
    });
  });
});
