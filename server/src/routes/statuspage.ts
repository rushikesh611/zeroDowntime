import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const router = express.Router();

// create a new status page
router.post('/', auth, async (req, res) => {
    try {
        const { monitorId, subdomain, title, description } = req.body;

        const monitor = await prisma.monitor.findUnique({
            where: {
                id: monitorId,
                userId: req.user!.id
            }
        })

        if (!monitor) {
            return res.status(404).json({ error: 'Monitor not found' });
        }

        const existingStatusPage = await prisma.statusPage.findUnique({
            where: { subdomain }
        })

        const statusPage = await prisma.statusPage.create({
            data: {
                monitorId,
                subdomain,
                title,
                description: description || '',
            }
        });

        res.status(201).json(statusPage)

    } catch (error) {
        res.status(500).json({ error: 'Failed to create status page' });
    }
})

// Get all status pages for the authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const userMonitors = await prisma.monitor.findMany({
            where: { userId: req.user!.id },
            select: {
                id: true,
            }
        })

        const monitorIds = userMonitors.map(m => m.id);

        const statusPages = await prisma.statusPage.findMany({
            where: { monitorId: { in: monitorIds } },
            include: {
                monitor: {
                    select: {
                        url: true,
                        status: true,
                    }
                }
            }
        })

        res.json(statusPages)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch status pages' });
    }
})

router.get('/manage/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const statusPage = await prisma.statusPage.findUnique({
      where: { id },
      include: {
        monitor: {
          select: {
            url: true,
            status: true,
            userId: true
          }
        }
      }
    });
    
    if (!statusPage) {
      return res.status(404).json({ error: 'Status page not found' });
    }
    
    // Check if user owns the monitor
    if (statusPage.monitor.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json(statusPage);
  } catch (error) {
    logger.error('Error fetching status page:', error);
    res.status(500).json({ error: 'Failed to fetch status page' });
  }
});

// Update status page
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isPublic } = req.body;
    
    // Get status page with monitor info
    const statusPage = await prisma.statusPage.findUnique({
      where: { id },
      include: {
        monitor: {
          select: { userId: true }
        }
      }
    });
    
    if (!statusPage) {
      return res.status(404).json({ error: 'Status page not found' });
    }
    
    // Check if user owns the monitor
    if (statusPage.monitor.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Update status page
    const updatedStatusPage = await prisma.statusPage.update({
      where: { id },
      data: {
        title,
        description,
        isPublic
      }
    });
    
    res.json(updatedStatusPage);
  } catch (error) {
    logger.error('Error updating status page:', error);
    res.status(500).json({ error: 'Failed to update status page' });
  }
});

// Delete status page
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get status page with monitor info
    const statusPage = await prisma.statusPage.findUnique({
      where: { id },
      include: {
        monitor: {
          select: { userId: true }
        }
      }
    });
    
    if (!statusPage) {
      return res.status(404).json({ error: 'Status page not found' });
    }
    
    // Check if user owns the monitor
    if (statusPage.monitor.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Delete status page
    await prisma.statusPage.delete({
      where: { id }
    });
    
    res.json({ message: 'Status page deleted successfully' });
  } catch (error) {
    logger.error('Error deleting status page:', error);
    res.status(500).json({ error: 'Failed to delete status page' });
  }
});

// PUBLIC ROUTE - Get public status page by subdomain
router.get('/public/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    const statusPage = await prisma.statusPage.findUnique({
      where: { 
        subdomain,
        isPublic: true
      },
      include: {
        monitor: {
          select: {
            url: true,
            status: true
          }
        }
      }
    });
    
    if (!statusPage) {
      return res.status(404).json({ error: 'Status page not found' });
    }
    
    // Get last 24 hours of logs for this monitor
    const twentyFourHoursAgo = new Date(Date.now() - 86400000);
    const logs = await prisma.monitorLog.findMany({
      where: { 
        monitorId: statusPage.monitorId,
        lastCheckedAt: { gte: twentyFourHoursAgo }
      },
      orderBy: { lastCheckedAt: 'asc' }
    });
    
    // Return status page with logs
    res.json({
      statusPage,
      logs
    });
  } catch (error) {
    logger.error('Error fetching public status page:', error);
    res.status(500).json({ error: 'Failed to fetch status page' });
  }
});

export default router;