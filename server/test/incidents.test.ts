import express from 'express';
import request from 'supertest';
import incidentRouter from '../src/routes/incidents.js';
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
    statusPage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    incident: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    incidentUpdate: {
      create: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
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
app.use('/api/incidents', incidentRouter);

describe('Incidents API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/incidents', () => {
    it('should create an incident successfully', async () => {
      const mockStatusPage = {
        id: 'sp-123',
        userId: 'user-123',
      };

      const mockIncident = {
        id: 'inc-123',
        title: 'Database Outage',
        severity: 'CRITICAL',
        status: 'INVESTIGATING',
        statusPageId: 'sp-123',
      };

      const mockedPrisma = prisma as any;
      mockedPrisma.statusPage.findUnique.mockResolvedValue(mockStatusPage);
      mockedPrisma.incident.create.mockResolvedValue(mockIncident);

      const res = await request(app)
        .post('/api/incidents')
        .send({
          statusPageId: 'sp-123',
          title: 'Database Outage',
          severity: 'CRITICAL',
          status: 'INVESTIGATING',
          message: 'We are investigating connectivity issues.',
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockIncident);
    });

    it('should return 400 if message is missing', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .send({
          statusPageId: 'sp-123',
          title: 'Database Outage',
          severity: 'CRITICAL',
          status: 'INVESTIGATING',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Update message is required');
    });
  });

  describe('GET /api/incidents/:id', () => {
    it('should retrieve incident details if authorized', async () => {
      const mockIncident = {
        id: 'inc-123',
        title: 'Database Outage',
        statusPageId: 'sp-123',
        statusPage: {
          id: 'sp-123',
          userId: 'user-123',
        },
      };

      const mockedPrisma = prisma as any;
      mockedPrisma.incident.findUnique.mockResolvedValue(mockIncident);

      const res = await request(app).get('/api/incidents/inc-123');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('inc-123');
    });
  });
});
