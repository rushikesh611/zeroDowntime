import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth';

import { checkWebsiteUptime } from '../services/uptimeService';


const prisma = new PrismaClient();
const router = express.Router();

// Create monitor
router.post('/', auth, async (req, res) => {
    try {
        const { url, emails, frequency } = req.body;
        const monitor = await prisma.monitor.create({
            data: {
                url,
                emails,
                frequency: frequency || 600,
                userId: req.user!.id
            }
        })
        res.status(201).json(monitor);
    } catch (error) {
        console.log('Error creating monitor', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Get all monitors
router.get('/', auth, async (req, res) => {
    try {
        const monitors = await prisma.monitor.findMany({
            where: { userId: req.user?.id }
        })
        res.json(monitors);
    } catch (error) {
        console.log('Error getting monitors', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Get single monitor
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const monitor = await prisma.monitor.findUnique({
            where: { id, userId: req.user?.id }
        });
        if (!monitor) {
            return res.status(404).json({ error: 'Monitor not found' });
        }
        res.json(monitor);
    } catch (error) {
        console.log('Error getting monitor', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Update monitor
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { url, emails, frequency, status } = req.body;
        const updatedMonitor = await prisma.monitor.update({
            where: { id, userId: req.user?.id },
            data: { url, emails, frequency, status }
        })
        res.json(updatedMonitor);
    } catch (error) {
        console.log('Error updating monitor', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})


// Delete monitor
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.monitor.delete({
            where: { id, userId: req.user?.id }
        })
        res.json({ message: 'Monitor deleted successfully' });
    } catch (error) {
        console.log('Error deleting monitor', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Manually check monitor uptime
router.post('/:id/check', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const monitor = await prisma.monitor.findUnique({
            where: { id, userId: req.user!.id }
        });
        if (!monitor) {
            return res.status(404).json({ error: 'Monitor not found' });
        }
        const uptimeResults = await checkWebsiteUptime(monitor.url);
        res.json(uptimeResults);
    } catch (error) {
        console.error('Error checking uptime:', error);
        res.status(500).json({ error: 'Error checking uptime' });
    }
});

// Get monitor logs
router.get('/:id/logs', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const logs = await prisma.monitorLog.findMany({
            where: { monitorId: id },
            orderBy: { lastCheckedAt: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        console.log('Error getting monitor logs', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// get monitor logs by region
router.get('/:id/logs/:region', auth, async (req, res) => {
    try {
        const { id, region } = req.params;
        const logs = await prisma.monitorLog.findMany({
            where: { monitorId: id, region },
            orderBy: { lastCheckedAt: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        console.log('Error getting monitor logs', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// get monitor logs for last 1 hour
router.get('/:id/logs/hour', auth, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id);
        const logs = await prisma.monitorLog.findMany({
            where: { monitorId: id, lastCheckedAt: { gte: new Date(Date.now() - 3600000) } },
            orderBy: { lastCheckedAt: 'desc' }
        });
        console.log(logs);  
        res.json(logs);
    } catch (error) {
        console.log('Error getting monitor logs', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// get monitor logs for last 24 hours
router.get('/:id/logs/day', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();
        console.log('Monitor ID:', id);
        console.log('Twenty-four hours ago:', twentyFourHoursAgo);

        const logs = await prisma.monitorLog.findMany({
            where: { monitorId: id, lastCheckedAt: { gte: twentyFourHoursAgo } },
            orderBy: { lastCheckedAt: 'desc' }
        });

        console.log('Logs:', logs);
        res.json(logs);
    } catch (error) {
        console.log('Error getting monitor logs', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

