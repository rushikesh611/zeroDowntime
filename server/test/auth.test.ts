import jwt from 'jsonwebtoken';
import auth from '../src/middleware/auth.js';
import prisma from '../src/lib/prisma.js';

jest.mock('../src/lib/prisma.js', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
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

describe('Auth Middleware', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      cookies: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret-key-12345';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if no token cookie is present', async () => {
    await auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token verification fails', async () => {
    req.cookies.token = 'invalid-token';
    await auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not found in database', async () => {
    const token = jwt.sign({ userId: 'user-123' }, 'test-secret-key-12345');
    req.cookies.token = token;
    // We access the mocked findUnique from the default export of mock
    const mockedPrisma = prisma as any;
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    await auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should authenticate user and call next() if token is valid', async () => {
    const token = jwt.sign({ userId: 'user-123' }, 'test-secret-key-12345');
    req.cookies.token = token;
    const mockUser = { id: 'user-123', username: 'john_doe' };
    const mockedPrisma = prisma as any;
    mockedPrisma.user.findUnique.mockResolvedValue(mockUser);

    await auth(req, res, next);
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });
});
