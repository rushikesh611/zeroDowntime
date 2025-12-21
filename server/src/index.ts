import { PrismaClient } from '@prisma/client'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import rateLimit from 'express-rate-limit'
import session from 'express-session'
import helmet from 'helmet'
import passport from './config/passport.js'
import { startUptimeCheck } from './jobs/uptimeCheck.js'
import authRoutes from './routes/auth.js'
import logRoutes from './routes/logSource.js'
import monitorRoutes from './routes/monitors.js'
import statusPageRoutes from './routes/statuspage.js'
import testAuthRoutes from './routes/testAuth.js'
import { logger, logVaultTransport } from './utils/logger.js'


export const app = express()
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient()
const isProd = process.env.NODE_ENV === 'production'
const clientUrl = isProd ? process.env.CLIENT_URL : 'http://localhost:3000';

app.set('trust proxy', 1); // Trust first proxy (Nginx)

if (isProd && !process.env.CLIENT_URL) {
  logger.warn('CLIENT_URL not set in production environment. CORS may be misconfigured.');
  console.warn('CLIENT_URL not set in production environment.');
}


const corsOptions = {
  origin: clientUrl,
  credentials: true,
  optionSuccessStatus: 200
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

app.disable('x-powered-by')


// Middleware
app.use(helmet())
app.use(limiter)
app.use(cors(corsOptions));
app.use(cookieParser())
app.use(express.json())
app.use(session({
  secret: process.env.SESSION_SECRET || '32665854d225bef27db95842688a526',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true', // Flexible for HTTP/HTTPS
    httpOnly: true,
    sameSite: 'strict'
  }
}))
app.use(passport.initialize());
app.use(passport.session());
// app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes)
app.use('/api', testAuthRoutes)
app.use('/api/monitors', monitorRoutes)
app.use('/api/log', logRoutes)
app.use('/api/status-pages', statusPageRoutes);

app.get('/', (req: any, res: any) => {
  res.send('Zero Downtime')
})

try {
  startUptimeCheck()
  logger.info('uptimeCheck job started');
}
catch (error) {
  logger.error('Failed to start uptimeCheck job:', error);
}

process.on('SIGTERM', async () => {
  await logVaultTransport.close();
  process.exit(0);
});

// Start the server
app.listen(PORT, async () => {
  logger.info(`Service running on port ${PORT}`);
  console.log(`Service running on port ${PORT}`);
  try {
    logger.info('Connecting to MongoDB...');
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error: any) {
    logger.error('Database connection failed:', error);
    console.error('Full Database Error:', error);
    process.exit(1);
  }
});