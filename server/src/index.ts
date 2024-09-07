import express from 'express'
import cors from 'cors'
import session from 'express-session'
import passport from './config/passport'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

import authRoutes from './routes/auth'
import testAuthRoutes from './routes/testAuth'
import monitorRoutes  from './routes/monitors'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient()

// Middleware
app.use(cors())
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


// Start the server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
});