import express from 'express';
import auth from '../middleware/auth.js';
import * as notifierService from '../services/notifierService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all notifiers
router.get('/', auth, async (req, res) => {
    try {
        const notifiers = await notifierService.getNotifiers((req as any).user.id);
        res.json(notifiers);
    } catch (error) {
        logger.error('Error getting notifiers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create notifier
router.post('/', auth, async (req, res) => {
    try {
        const { name, type, details } = req.body;
        if (!name || !type || !details) {
            return res.status(400).json({ error: 'Name, type, and details are required' });
        }
        const notifier = await notifierService.createNotifier((req as any).user.id, { name, type, details });
        res.status(201).json(notifier);
    } catch (error) {
        logger.error('Error creating notifier:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update notifier
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, details } = req.body;
        const notifier = await notifierService.updateNotifier((req as any).user.id, id, { name, type, details });
        res.json(notifier);
    } catch (error) {
        logger.error('Error updating notifier:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete notifier
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        await notifierService.deleteNotifier((req as any).user.id, id);
        res.json({ message: 'Notifier deleted successfully' });
    } catch (error) {
        logger.error('Error deleting notifier:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test notifier
router.post('/:id/test', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await notifierService.sendTestNotification((req as any).user.id, id);
        res.json(result);
    } catch (error: any) {
        logger.error('Error testing notifier:', error);
        res.status(500).json({ error: error.message || 'Error testing notifier' });
    }
});

export default router;
