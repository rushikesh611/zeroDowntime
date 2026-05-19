import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { Monitor, StatusPage, Incident } from '@prisma/client';

export interface AuthorizedRequest extends Request {
  monitor?: any; // populated with notifier & sharedTeams
  monitorRole?: 'OWNER' | 'WRITE' | 'READ';
  monitorOwnerName?: string;
  statusPage?: StatusPage;
  incident?: Incident & { statusPage: StatusPage };
}

export function verifyMonitorAccess(roleRequired: 'READ' | 'WRITE' = 'READ') {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        logger.warn('Unauthorized access: No authenticated user.');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const monitor = await prisma.monitor.findUnique({
        where: { id },
        include: {
          notifier: true,
          sharedTeams: {
            include: {
              team: {
                include: {
                  admin: { select: { username: true } }
                }
              }
            }
          }
        }
      });

      if (!monitor) {
        logger.info(`Monitor check failed: Monitor with ID ${id} not found.`);
        return res.status(404).json({ error: 'Monitor not found' });
      }

      let role: 'OWNER' | 'WRITE' | 'READ' = 'READ';
      let ownerName = '';

      if (monitor.userId === userId) {
        role = 'OWNER';
      } else {
        // Check team membership and roles
        const userTeams = await prisma.teamMember.findMany({
          where: { userId },
          select: { teamId: true, role: true }
        });

        const teamIds = userTeams.map(ut => ut.teamId);
        
        // Find which shared teams the user is in
        const matchingSharedTeams = monitor.sharedTeams.filter(st => teamIds.includes(st.teamId));

        if (matchingSharedTeams.length === 0) {
          logger.warn(`Forbidden monitor access: User ${userId} requested Monitor ${id}`);
          return res.status(403).json({ error: 'Access denied' });
        }

        // Determine user's best role in those teams
        const rolesInTeams = userTeams.filter(ut => 
          matchingSharedTeams.some(mst => mst.teamId === ut.teamId)
        );
        const hasWriteAccess = rolesInTeams.some(ut => ut.role === 'WRITE');
        role = hasWriteAccess ? 'WRITE' : 'READ';

        // Set owner name to the admin's username of the first shared team
        ownerName = matchingSharedTeams[0]?.team?.admin?.username || 'Unknown';
      }

      if (roleRequired === 'WRITE' && role !== 'OWNER' && role !== 'WRITE') {
        logger.warn(`Forbidden write access: User ${userId} does not have WRITE privileges for Monitor ${id}`);
        return res.status(403).json({ error: 'You do not have permission to modify this monitor.' });
      }

      req.monitor = monitor;
      req.monitorRole = role;
      req.monitorOwnerName = ownerName;
      next();
    } catch (error) {
      logger.error('Error verifying monitor access:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function verifyStatusPageAccess() {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        logger.warn('Unauthorized access: No authenticated user.');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const statusPage = await prisma.statusPage.findUnique({
        where: { id }
      });

      if (!statusPage) {
        logger.info(`Status page check failed: StatusPage with ID ${id} not found.`);
        return res.status(404).json({ error: 'Status page not found' });
      }

      if (statusPage.userId !== userId) {
        logger.warn(`Forbidden status page access: User ${userId} requested StatusPage ${id}`);
        return res.status(403).json({ error: 'Unauthorized' });
      }

      req.statusPage = statusPage;
      next();
    } catch (error) {
      logger.error('Error verifying status page access:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function verifyIncidentAccess() {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        logger.warn('Unauthorized access: No authenticated user.');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const incident = await prisma.incident.findUnique({
        where: { id },
        include: { statusPage: true }
      });

      if (!incident) {
        logger.info(`Incident check failed: Incident with ID ${id} not found.`);
        return res.status(404).json({ error: 'Incident not found' });
      }

      if (incident.statusPage.userId !== userId) {
        logger.warn(`Forbidden incident access: User ${userId} requested Incident ${id}`);
        return res.status(403).json({ error: 'Unauthorized access to this incident' });
      }

      req.incident = incident;
      next();
    } catch (error) {
      logger.error('Error verifying incident access:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
