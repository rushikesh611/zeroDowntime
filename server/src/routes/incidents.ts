import express from 'express';
import auth from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Get all incidents for the user across all their status pages
router.get('/', auth, async (req, res) => {
  try {
    const statusPages = await prisma.statusPage.findMany({
      where: { userId: (req as any).user.id },
      select: { id: true }
    });

    const statusPageIds = statusPages.map(sp => sp.id);

    const incidents = await prisma.incident.findMany({
      where: {
        statusPageId: { in: statusPageIds }
      },
      include: {
        statusPage: {
          select: { title: true, subdomain: true }
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(incidents);
  } catch (error) {
    logger.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// Create a new incident
router.post('/', auth, async (req, res) => {
  try {
    const { statusPageId, title, severity, status, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Update message is required' });
    }

    // Verify ownership
    const statusPage = await prisma.statusPage.findUnique({
      where: { id: statusPageId }
    });

    if (!statusPage) {
      return res.status(404).json({ error: 'Status Page not found' });
    }

    if (statusPage.userId !== (req as any).user.id) {
      return res.status(403).json({ error: 'Unauthorized access to this Status Page' });
    }

    const incident = await prisma.incident.create({
      data: {
        statusPageId,
        title,
        severity,
        status,
        updates: {
          create: {
            message,
            status
          }
        }
      },
      include: {
        updates: true
      }
    });

    res.status(201).json(incident);
  } catch (error) {
    logger.error('Error creating incident:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// Get a specific incident
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        statusPage: true,
        updates: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    if (incident.statusPage.userId !== (req as any).user.id) {
      return res.status(403).json({ error: 'Unauthorized access to this incident' });
    }

    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

// Update incident (metadata or resolving)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, severity, status, postMortem, resolvedAt } = req.body;

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: { statusPage: true }
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    if (incident.statusPage.userId !== (req as any).user.id) {
      return res.status(403).json({ error: 'Unauthorized access to this incident' });
    }

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        title,
        severity,
        status,
        postMortem,
        resolvedAt: status === 'RESOLVED' ? (resolvedAt || new Date()) : null
      }
    });

    res.json(updatedIncident);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

// Post an update to an incident
router.post('/:id/updates', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, status, severity } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Update message is required' });
    }

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: { statusPage: true }
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    if (incident.statusPage.userId !== (req as any).user.id) {
      return res.status(403).json({ error: 'Unauthorized access to this incident' });
    }

    // Create update and update incident status/severity
    const [update] = await prisma.$transaction([
      prisma.incidentUpdate.create({
        data: {
          incidentId: id,
          message,
          status: status || incident.status
        }
      }),
      prisma.incident.update({
        where: { id },
        data: { 
          status: status || incident.status,
          severity: severity || incident.severity,
          resolvedAt: status === 'RESOLVED' ? new Date() : incident.resolvedAt
        }
      })
    ]);

    res.status(201).json(update);
  } catch (error) {
    logger.error('Error posting update:', error);
    res.status(500).json({ error: 'Failed to post update' });
  }
});

// Delete an incident
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: { statusPage: true }
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    if (incident.statusPage.userId !== (req as any).user.id) {
      return res.status(403).json({ error: 'Unauthorized access to this incident' });
    }

    await prisma.incident.delete({ where: { id } });
    res.json({ message: 'Incident deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete incident' });
  }
});

export default router;
