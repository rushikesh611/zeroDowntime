import express from 'express';
import auth from '../middleware/auth.js';
import { verifyStatusPageAccess, AuthorizedRequest } from '../middleware/authorize.js';
import { logger } from '../utils/logger.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// create a new status page
router.post('/', auth, async (req, res) => {
  try {
    const { monitorId, subdomain, title, description, customDomain } = req.body;

    const user = (req as any).user;
    logger.info(`Creating status page for user ${user.id}`, { monitorId, subdomain, title });

    // Check plan limits
    const statusPageCount = await prisma.statusPage.count({
      where: { userId: user.id }
    });

    logger.info(`User ${user.id} has ${statusPageCount} status pages. Plan: ${user.plan}`);

    const plan = user.plan;
    const limit = plan === 'FREE' ? 1 : (plan === 'PRO' ? 10 : 50);

    if (statusPageCount >= limit) {
      logger.warn(`${plan} tier limit reached for user ${user.id}`);
      return res.status(403).json({ error: `${plan} tier limit reached: ${limit} status pages maximum.` });
    }

    const monitor = await prisma.monitor.findUnique({
      where: {
        id: monitorId,
        userId: user.id
      }
    });

    if (!monitor) {
      logger.warn(`Monitor ${monitorId} not found for user ${(req as any).user.id}`);
      return res.status(404).json({ error: 'Monitor not found' });
    }

    if (monitor.status !== 'RUNNING') {
      return res.status(400).json({ error: 'Only active (RUNNING) monitors can be added to a status page.' });
    }

    const existingSubdomain = await prisma.statusPage.findUnique({
      where: { subdomain }
    });

    if (existingSubdomain) {
      logger.warn(`Subdomain ${subdomain} already taken`);
      return res.status(400).json({ error: 'Subdomain already taken.' });
    }

    const statusPage = await prisma.statusPage.create({
      data: {
        userId: (req as any).user.id,
        subdomain: subdomain.toLowerCase().trim(),
        customDomain: customDomain || null,
        title,
        description: description || '',
        monitors: {
          connect: { id: monitorId }
        }
      }
    });

    logger.info(`Status page created: ${statusPage.id}`);
    res.status(201).json(statusPage);

  } catch (error: any) {
    logger.error('Error creating status page:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create status page: ' + error.message });
  }
});

// Get all status pages for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const statusPages = await prisma.statusPage.findMany({
      where: { userId: (req as any).user.id },
      include: {
        monitors: {
          select: {
            url: true,
            status: true,
          }
        }
      }
    });

    res.json(statusPages);
  } catch (error) {
    logger.error('Error fetching status pages:', error);
    res.status(500).json({ error: 'Failed to fetch status pages' });
  }
});

router.get('/manage/:id', auth, verifyStatusPageAccess(), async (req: AuthorizedRequest, res) => {
  try {
    const { id } = req.params;

    const statusPage = await prisma.statusPage.findUnique({
      where: { id },
      include: {
        monitors: {
          select: {
            id: true,
            url: true,
            name: true,
            status: true,
            userId: true
          }
        },
        incidents: {
          orderBy: { createdAt: 'desc' },
          include: {
            updates: {
                orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    res.json(statusPage);
  } catch (error) {
    logger.error('Error fetching status page:', error);
    res.status(500).json({ error: 'Failed to fetch status page' });
  }
});

// Update status page (add/remove monitors, change metadata)
router.put('/:id', auth, verifyStatusPageAccess(), async (req: AuthorizedRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, isPublic, customDomain, monitorIds } = req.body;
    const existingStatusPage = req.statusPage!;

    // If updating monitorIds, verify ownership of all new monitors
    if (monitorIds) {
        const plan = (req as any).user.plan;
        const monitorLimit = plan === 'FREE' ? 1 : (plan === 'PRO' ? 15 : 50);

        if (monitorIds.length > monitorLimit) {
            return res.status(403).json({ error: `${plan} tier only allows ${monitorLimit} monitors per status page.` });
        }

        const monitors = await prisma.monitor.findMany({
            where: {
                id: { in: monitorIds },
                userId: (req as any).user.id
            }
        });

        if (monitors.length !== monitorIds.length) {
            return res.status(400).json({ error: 'Some monitors were not found or unauthorized' });
        }

        if (monitors.some(m => m.status !== 'RUNNING')) {
            return res.status(400).json({ error: 'Only active (RUNNING) monitors can be added to a status page.' });
        }
    }

    const updatedStatusPage = await prisma.statusPage.update({
      where: { id },
      data: {
        title,
        description,
        isPublic,
        customDomain: customDomain || null,
        monitors: monitorIds ? {
          set: monitorIds.map((mid: string) => ({ id: mid }))
        } : undefined
      }
    });

    res.json(updatedStatusPage);
  } catch (error: any) {
    logger.error('Error updating status page:', error);
    res.status(500).json({ error: 'Failed to update status page: ' + error.message });
  }
});

// Delete status page
router.delete('/:id', auth, verifyStatusPageAccess(), async (req: AuthorizedRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.statusPage.delete({ where: { id } });
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

    const statusPage = await prisma.statusPage.findFirst({
      where: {
        OR: [
          { subdomain },
          { customDomain: subdomain }
        ],
        isPublic: true
      },
      include: {
        monitors: {
          select: {
            id: true,
            name: true,
            url: true,
            status: true
          }
        },
        incidents: {
          orderBy: { createdAt: 'desc' },
          include: {
            updates: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!statusPage) {
      return res.status(404).json({ error: 'Status page not found' });
    }

    // Get logs for all monitors in this status page
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const logs = await prisma.monitorLog.findMany({
      where: {
        monitorId: { in: statusPage.monitorIds },
        lastCheckedAt: { gte: sevenDaysAgo }
      },
      select: {
        monitorId: true,
        isUp: true,
        lastCheckedAt: true
      },
      orderBy: { lastCheckedAt: 'asc' }
    });

    // Aggregate logs by day per monitor
    const dailyUptimeByMonitor: Record<string, any[]> = {};
    
    statusPage.monitors.forEach(monitor => {
        const monitorLogs = logs.filter(l => l.monitorId === monitor.id);
        const dailyUptime = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.setHours(0, 0, 0, 0));
            const dayEnd = new Date(date.setHours(23, 59, 59, 999));

            const dayLogs = monitorLogs.filter(l => 
                l.lastCheckedAt >= dayStart && l.lastCheckedAt <= dayEnd
            );

            const total = dayLogs.length;
            const up = dayLogs.filter(l => l.isUp).length;
            const uptimePercent = total > 0 ? (up / total) * 100 : 100;

            dailyUptime.push({
                date: dayStart.toISOString().split('T')[0],
                uptime: uptimePercent.toFixed(1),
                totalChecks: total,
                status: total === 0 ? 'NO_DATA' : (uptimePercent > 99 ? 'OPERATIONAL' : (uptimePercent > 95 ? 'DEGRADED' : 'OUTAGE'))
            });
        }
        dailyUptimeByMonitor[monitor.id] = dailyUptime.reverse();
    });

    res.json({
      statusPage,
      dailyUptimeByMonitor,
      activeIncidents: statusPage.incidents.filter(inc => inc.status !== 'RESOLVED'),
      pastIncidents: statusPage.incidents.filter(inc => inc.status === 'RESOLVED').slice(0, 10)
    });
  } catch (error) {
    logger.error('Error fetching public status page:', error);
    res.status(500).json({ error: 'Failed to fetch status page' });
  }
});

export default router;