import express from 'express';
import auth from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/test-auth', auth, async (req, res) => {
    if (!req.user) {
        logger.error('User not authenticated', { user: req.user });
        return res.status(401).json({ error: 'Not authenticated' });

    }
    // Return the authenticated user's information
    res.json({ user: req.user });
});

export default router;