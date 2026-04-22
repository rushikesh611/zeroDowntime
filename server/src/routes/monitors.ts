import express from 'express';
import auth from '../middleware/auth.js';
import { checkEndpoint } from '../services/monitoringService.js';
import { logger } from '../utils/logger.js';
import { MonitorInput } from '../types/monitor.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Create monitor
router.post('/', auth, async (req, res) => {
    try {
        const monitorData: MonitorInput = req.body;
        logger.info('Create monitor payload:', monitorData);

        const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const monitorCount = await prisma.monitor.count({ where: { userId: user.id } });

        let maxMonitors = 1;
        let minFrequency = 900;
        let maxRegions = 3;

        if (user.plan === 'PRO') {
            maxMonitors = 15;
            minFrequency = 60;
            maxRegions = 5;
        } else if (user.plan === 'PRO_PLUS') {
            maxMonitors = 50;
            minFrequency = 30;
            maxRegions = 10;
        }

        if (monitorCount >= maxMonitors) {
            return res.status(403).json({ error: `You have reached the maximum number of monitors (${maxMonitors}) for your ${user.plan} plan.` });
        }

        if (monitorData.frequency < minFrequency) {
            return res.status(400).json({ error: `Minimum frequency for your ${user.plan} plan is ${minFrequency} seconds.` });
        }

        if (monitorData.regions && monitorData.regions.length > maxRegions) {
            return res.status(400).json({ error: `Maximum regions for your ${user.plan} plan is ${maxRegions}.` });
        }

        console.log('Received monitor data:', monitorData);
        // Prepare monitor data based on type
        const baseMonitorData = {
            name: monitorData.name,
            monitorType: monitorData.monitorType,
            notifierId: monitorData.notifierId,
            frequency: monitorData.frequency,
            userId: req.user!.id,
            regions: monitorData.regions
        };

        console.log('Base monitor data:', baseMonitorData);

        // Add HTTP-specific fields only if monitorType is http
        const monitorCreateData = monitorData.monitorType === 'http'
            ? {
                ...baseMonitorData,
                url: monitorData.url,
                method: monitorData.method,
                headers: monitorData.headers,
                body: monitorData.body,
                assertions: monitorData.assertions ? JSON.parse(JSON.stringify(monitorData.assertions)) : undefined,
            } : monitorData.monitorType === 'tcp'
                ? {
                    ...baseMonitorData,
                    host: monitorData.host,
                    port: monitorData.port,
                }
                : baseMonitorData;

        const monitor = await prisma.monitor.create({
            data: monitorCreateData
        })
        res.status(201).json(monitor);
        logger.info('Monitor created successfully:', { monitorId: monitor.id });
    } catch (error) {
        logger.error('Error creating monitor:', error);
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Get all monitors (owned + shared via team)
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user!.id;
        
        // Find teams user is a member of and their roles in those teams
        const memberships = await prisma.teamMember.findMany({
            where: { userId },
            include: { team: { include: { admin: true } } }
        });
        
        const teamRoles = memberships.reduce((acc, m) => {
            acc[m.teamId] = { role: m.role, adminName: m.team.admin?.username || 'Unknown' };
            return acc;
        }, {} as Record<string, { role: string, adminName: string }>);

        const teamIds = Object.keys(teamRoles);

        // 1. Get IDs of monitors shared with this user via teams
        const sharedMonitorIds = await prisma.monitorTeam.findMany({
            where: { teamId: { in: teamIds } },
            select: { monitorId: true }
        });
        
        const monitorIds = sharedMonitorIds.map(sm => sm.monitorId);

        const monitors = await prisma.monitor.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { id: { in: monitorIds } }
                ]
            },
            include: { 
                notifier: true,
                sharedTeams: true,
                user: { select: { username: true } }
            }
        });

        const monitorsWithRoles = monitors.map(monitor => {
            if (monitor.userId === userId) {
                return { ...monitor, role: 'OWNER' };
            }
            
            // Find which shared team gives the user the highest permission
            const relevantSharedTeams = monitor.sharedTeams.filter(st => teamIds.includes(st.teamId));
            
            let bestRole: 'READ' | 'WRITE' = 'READ';
            let ownerName = '';

            relevantSharedTeams.forEach(st => {
                const teamInfo = teamRoles[st.teamId];
                if (teamInfo) {
                    if (teamInfo.role === 'WRITE') bestRole = 'WRITE';
                    ownerName = teamInfo.adminName;
                }
            });

            return { 
                ...monitor, 
                role: bestRole, 
                ownerName 
            };
        });

        res.json(monitorsWithRoles);
        logger.info('Monitors retrieved successfully:', { monitorsCount: monitors.length });
    } catch (error: any) {
        logger.error('Error getting monitors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Get single monitor
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const monitor = await prisma.monitor.findUnique({
            where: { id },
            include: { notifier: true }
        });

        if (!monitor) {
            return res.status(404).json({ error: 'Monitor not found' });
        }

        let role = 'OWNER';
        let ownerName = '';

        if (monitor.userId !== userId) {
            // Check if monitor is shared with any team the user is in
            // Refactored for MongoDB compatibility
            const userTeams = await prisma.teamMember.findMany({
                where: { userId },
                select: { teamId: true, role: true }
            });

            const teamIds = userTeams.map(ut => ut.teamId);

            const monitorShared = await prisma.monitorTeam.findFirst({
                where: {
                    monitorId: id,
                    teamId: { in: teamIds }
                },
                include: {
                    team: {
                        include: {
                            admin: true
                        }
                    }
                }
            });

            if (!monitorShared) {
                logger.warn('Access denied for monitor:', { monitorId: id, userId });
                return res.status(403).json({ error: 'Access denied' });
            }

            // Find the user's specific membership in the team that shares this monitor
            const userInTeam = userTeams.find(ut => ut.teamId === monitorShared.teamId);
            role = userInTeam?.role || 'READ';
            ownerName = monitorShared.team.admin?.username || 'Unknown';
        }

        res.json({ ...monitor, role, ownerName });
        logger.info('Monitor retrieved successfully:', { monitorId: monitor.id });
    } catch (error) {
        logger.error('Error getting monitor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Update monitor
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;
        const { name, url, monitorType, method, headers, body, notifierId, frequency, status, regions, assertions } = req.body;

        const existingMonitor = await prisma.monitor.findUnique({ where: { id } });
        if (!existingMonitor) return res.status(404).json({ error: 'Monitor not found' });

        if (existingMonitor.userId !== userId) {
            const userTeamsWithWrite = await prisma.teamMember.findMany({
                where: { userId, role: 'WRITE' },
                select: { teamId: true }
            });

            const teamIds = userTeamsWithWrite.map(ut => ut.teamId);

            const hasWriteAccess = await prisma.monitorTeam.findFirst({
                where: {
                    monitorId: id,
                    teamId: { in: teamIds }
                }
            });

            if (!hasWriteAccess) {
                return res.status(403).json({ error: 'You do not have permission to modify this monitor.' });
            }
        }

        // Check if frequency/regions update violates plan
        if (frequency !== undefined || regions !== undefined) {
            // We need to check the monitor owner's plan
            const owner = await prisma.user.findUnique({ where: { id: existingMonitor.userId } });
            if (owner) {
                let minFrequency = 900;
                let maxRegions = 3;

                if (owner.plan === 'PRO') {
                    minFrequency = 60;
                    maxRegions = 5;
                } else if (owner.plan === 'PRO_PLUS') {
                    minFrequency = 30;
                    maxRegions = 10;
                }

                if (frequency !== undefined && frequency < minFrequency) {
                    return res.status(400).json({ error: `Minimum frequency for the owner's ${owner.plan} plan is ${minFrequency} seconds.` });
                }

                if (regions !== undefined && regions.length > maxRegions) {
                    return res.status(400).json({ error: `Maximum regions for the owner's ${owner.plan} plan is ${maxRegions}.` });
                }
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (url !== undefined) updateData.url = url;
        if (monitorType !== undefined) updateData.monitorType = monitorType;
        if (method !== undefined) updateData.method = method;
        if (headers !== undefined) updateData.headers = headers;
        if (body !== undefined) updateData.body = body;
        if (notifierId !== undefined) updateData.notifierId = notifierId;
        if (frequency !== undefined) updateData.frequency = frequency;
        if (status !== undefined) updateData.status = status;
        if (regions !== undefined) updateData.regions = regions;
        if (assertions !== undefined) updateData.assertions = assertions ? JSON.parse(JSON.stringify(assertions)) : undefined;

        const updatedMonitor = await prisma.monitor.update({
            where: { id },
            data: updateData,
            include: { notifier: true }
        });

        res.json(updatedMonitor);
        logger.info('Monitor updated successfully:', { monitorId: updatedMonitor.id });
    } catch (error) {
        logger.error('Error updating monitor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})


// Delete monitor
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const existingMonitor = await prisma.monitor.findUnique({ where: { id } });
        if (!existingMonitor) return res.status(404).json({ error: 'Monitor not found' });

        if (existingMonitor.userId !== userId) {
            const userTeamsWithWrite = await prisma.teamMember.findMany({
                where: { userId, role: 'WRITE' },
                select: { teamId: true }
            });

            const teamIds = userTeamsWithWrite.map(ut => ut.teamId);

            const hasWriteAccess = await prisma.monitorTeam.findFirst({
                where: {
                    monitorId: id,
                    teamId: { in: teamIds }
                }
            });

            if (!hasWriteAccess) {
                return res.status(403).json({ error: 'You do not have permission to delete this monitor.' });
            }
        }

        // The status page will be auto-deleted due to the cascading delete in prisma schema
        await prisma.monitor.delete({
            where: { id }
        })

        res.json({ message: 'Monitor deleted successfully' });
        logger.info('Monitor deleted successfully:', { monitorId: id });
    } catch (error) {
        logger.error('Error deleting monitor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Manually check monitor uptime
router.post('/:id/check', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;
        
        const monitor = await prisma.monitor.findUnique({
            where: { id }
        });
        if (!monitor) {
            logger.info('Monitor not found:', { monitorId: id });
            return res.status(404).json({ error: 'Monitor not found' });
        }

        if (monitor.userId !== userId) {
            const userTeams = await prisma.teamMember.findMany({
                where: { userId },
                select: { teamId: true }
            });
            const teamIds = userTeams.map(ut => ut.teamId);
            const hasAccess = await prisma.monitorTeam.findFirst({
                where: { monitorId: id, teamId: { in: teamIds } }
            });
            if (!hasAccess) return res.status(403).json({ error: 'Access denied' });
        }

        // Ensure the monitor is HTTP type
        if (monitor.monitorType !== 'http') {
            return res.status(400).json({ error: 'Only HTTP monitors can be checked manually' });
        }

        if (!monitor.method) {
            return res.status(400).json({ error: 'HTTP method is required' });
        }

        // Prepare check parameters for HTTP monitor
        const monitorResults = await checkEndpoint({
            url: monitor.url ?? undefined,
            monitorType: 'http',
            method: monitor.method ?? undefined,
            headers: (monitor.headers as Record<string, string>) ?? undefined,
            body: monitor.body ?? undefined,
            assertions: (monitor.assertions as any[]) ?? undefined  // ADD THIS LINE
        }, monitor.regions);

        res.json(monitorResults);
        logger.info('Uptime check completed successfully:', { monitorId: id });
    } catch (error) {
        logger.error('Error checking uptime:', error);
        res.status(500).json({ error: 'Error checking uptime' });
    }
});

// Get monitor logs (last 24 hours only for performance)
router.get('/:id/logs', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { aggregate, interval = '15' } = req.query;
        const userId = req.user!.id;
        const twentyFourHoursAgo = new Date(Date.now() - 86400000);
        
        const monitor = await prisma.monitor.findUnique({ where: { id } });
        if (!monitor) return res.status(404).json({ error: 'Monitor not found' });

        if (monitor.userId !== userId) {
            const userTeams = await prisma.teamMember.findMany({
                where: { userId },
                select: { teamId: true }
            });
            const teamIds = userTeams.map(ut => ut.teamId);
            const hasAccess = await prisma.monitorTeam.findFirst({
                where: { monitorId: id, teamId: { in: teamIds } }
            });
            if (!hasAccess) return res.status(403).json({ error: 'Access denied' });
        }

        const logs = await prisma.monitorLog.findMany({
            where: { 
                monitorId: id,
                lastCheckedAt: { gte: twentyFourHoursAgo }
            },
            orderBy: { lastCheckedAt: 'desc' }
        });

        if (aggregate === 'true') {
            const intervalMs = parseInt(interval as string) * 60 * 1000;
            const buckets: Record<string, any> = {};

            logs.forEach(log => {
                const timestamp = new Date(log.lastCheckedAt).getTime();
                const bucketTime = Math.floor(timestamp / intervalMs) * intervalMs;
                const key = `${log.region}_${bucketTime}`;

                if (!buckets[key]) {
                    buckets[key] = {
                        region: log.region,
                        lastCheckedAt: new Date(bucketTime),
                        responseTime: 0,
                        count: 0,
                        status: 'UP'
                    };
                }

                buckets[key].responseTime += log.responseTime || 0;
                buckets[key].count += 1;
                if (log.status === 'DOWN') {
                    buckets[key].status = 'DOWN';
                }
            });

            const aggregatedLogs = Object.values(buckets).map((b: any) => ({
                ...b,
                responseTime: Math.round(b.responseTime / b.count),
                count: undefined
            }));

            return res.json(aggregatedLogs);
        }

        res.json(logs);
    } catch (error) {
        logger.error('Error getting monitor logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// get monitor logs by region
router.get('/:id/logs/:region', auth, async (req, res) => {
    try {
        const { id, region } = req.params;
        const userId = req.user!.id;

        const monitor = await prisma.monitor.findUnique({ where: { id } });
        if (!monitor) return res.status(404).json({ error: 'Monitor not found' });

        if (monitor.userId !== userId) {
            const userTeams = await prisma.teamMember.findMany({
                where: { userId },
                select: { teamId: true }
            });
            const teamIds = userTeams.map(ut => ut.teamId);
            const hasAccess = await prisma.monitorTeam.findFirst({
                where: { monitorId: id, teamId: { in: teamIds } }
            });
            if (!hasAccess) return res.status(403).json({ error: 'Access denied' });
        }

        const logs = await prisma.monitorLog.findMany({
            where: { monitorId: id, region },
            orderBy: { lastCheckedAt: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        logger.error('Error getting monitor logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// get monitor logs for last 1 hour
router.get('/:id/logs/hour', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const monitor = await prisma.monitor.findUnique({ where: { id } });
        if (!monitor) return res.status(404).json({ error: 'Monitor not found' });

        if (monitor.userId !== userId) {
            const userTeams = await prisma.teamMember.findMany({
                where: { userId },
                select: { teamId: true }
            });
            const teamIds = userTeams.map(ut => ut.teamId);
            const hasAccess = await prisma.monitorTeam.findFirst({
                where: { monitorId: id, teamId: { in: teamIds } }
            });
            if (!hasAccess) return res.status(403).json({ error: 'Access denied' });
        }

        const logs = await prisma.monitorLog.findMany({
            where: { monitorId: id, lastCheckedAt: { gte: new Date(Date.now() - 3600000) } },
            orderBy: { lastCheckedAt: 'desc' }
        });
        console.log(logs);
        res.json(logs);
    } catch (error) {
        logger.error('Error getting monitor logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// get monitor logs for last 24 hours
router.get('/:id/logs/day', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;
        const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();

        const monitor = await prisma.monitor.findUnique({ where: { id } });
        if (!monitor) return res.status(404).json({ error: 'Monitor not found' });

        if (monitor.userId !== userId) {
            const userTeams = await prisma.teamMember.findMany({
                where: { userId },
                select: { teamId: true }
            });
            const teamIds = userTeams.map(ut => ut.teamId);
            const hasAccess = await prisma.monitorTeam.findFirst({
                where: { monitorId: id, teamId: { in: teamIds } }
            });
            if (!hasAccess) return res.status(403).json({ error: 'Access denied' });
        }

        const logs = await prisma.monitorLog.findMany({
            where: { monitorId: id, lastCheckedAt: { gte: twentyFourHoursAgo } },
            orderBy: { lastCheckedAt: 'desc' }
        });

        console.log('Logs:', logs);
        res.json(logs);
    } catch (error) {
        logger.error('Error getting monitor logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Get monitor stats (avg, p95, p99) for last 24h
router.get('/:id/stats', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;
        const twentyFourHoursAgo = new Date(Date.now() - 86400000);

        const monitor = await prisma.monitor.findUnique({ where: { id } });
        if (!monitor) return res.status(404).json({ error: 'Monitor not found' });

        if (monitor.userId !== userId) {
            const userTeams = await prisma.teamMember.findMany({
                where: { userId },
                select: { teamId: true }
            });
            const teamIds = userTeams.map(ut => ut.teamId);
            const hasAccess = await prisma.monitorTeam.findFirst({
                where: { monitorId: id, teamId: { in: teamIds } }
            });
            if (!hasAccess) return res.status(403).json({ error: 'Access denied' });
        }

        // Fetch only responseTime to minimize payload from DB
        const logs = await prisma.monitorLog.findMany({
            where: { 
                monitorId: id, 
                lastCheckedAt: { gte: twentyFourHoursAgo },
                responseTime: { gt: 0 } // Only consider valid responses
            },
            select: { responseTime: true }
        });

        if (logs.length === 0) {
            return res.json({ avg: 0, p95: 0, p99: 0, count: 0 });
        }

        const times = logs.map(l => l.responseTime).sort((a, b) => a - b);
        const count = times.length;
        const sum = times.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / count);

        const getPercentile = (p: number) => {
            const index = Math.ceil((p / 100) * count) - 1;
            return times[index];
        };

        res.json({
            avg,
            p95: getPercentile(95),
            p99: getPercentile(99),
            count
        });
    } catch (error) {
        logger.error('Error getting monitor stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test email notification for monitor
router.post('/:id/test-email', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const monitor = await prisma.monitor.findUnique({
            where: { id },
            include: { notifier: true }
        });

        if (!monitor) return res.status(404).json({ error: 'Monitor not found' });

        // Permission check
        if (monitor.userId !== userId) {
            const userTeams = await prisma.teamMember.findMany({
                where: { userId },
                select: { teamId: true }
            });
            const teamIds = userTeams.map(ut => ut.teamId);
            const hasAccess = await prisma.monitorTeam.findFirst({
                where: { monitorId: id, teamId: { in: teamIds } }
            });
            if (!hasAccess) return res.status(403).json({ error: 'Access denied' });
        }

        if (!monitor.notifier) {
            return res.status(400).json({ error: 'No notification channel configured for this monitor' });
        }

        const { sendTestNotification } = await import('../services/notifierService.js');
        const result = await sendTestNotification(monitor.userId, monitor.notifierId!);
        res.json(result);
    } catch (error: any) {
        logger.error('Error testing email:', error);
        res.status(500).json({ error: error.message || 'Error testing email' });
    }
});

export default router;

