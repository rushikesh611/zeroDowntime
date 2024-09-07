import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth';


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

export default router;