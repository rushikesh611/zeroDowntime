import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth';

import { checkWebsiteUptime } from '../services/uptimeService';


const prisma = new PrismaClient();
const router = express.Router();

router.post('/', auth, async (req, res) => {
    try {
        const { url, emails, frequency } = req.body;
        const monitor = await prisma.monitor.create({
            data: {
                url,
                emails,
                frequency: frequency || 300,
                userId: req.user!.id
            }
        })
        res.status(201).json(monitor);
    } catch (error) {
        console.log('Error creating monitor', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

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

export default router;