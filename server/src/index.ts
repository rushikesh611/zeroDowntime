import express from 'express'
import cors from 'cors'
import session from 'express-session'
import passport from './config/passport'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import { PrismaClient } from '@prisma/client'

import authRoutes from './routes/auth'
import testAuthRoutes from './routes/testAuth'
import monitorRoutes  from './routes/monitors'
import { startUptimeCheck } from './jobs/uptimeCheck'
import { logger } from './utils/logger'

dotenv.config()

export const app = express()
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient()

const corsOptions = {
    origin:'http://localhost:3000', 
    credentials:true,           
    optionSuccessStatus:200
}

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser())
app.use(express.json())
app.use(session({
  secret: process.env.SESSION_SECRET || '32665854d225bef27db95842688a526',
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes)
app.use('/api', testAuthRoutes)
app.use('/api/monitors', monitorRoutes)

app.get('/', (req: any, res: any) => {
  res.send('Zero Downtime')
})

startUptimeCheck()
logger.info('Uptime check job started')

// Start the server
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
});