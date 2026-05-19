import express from 'express';
import dns from 'dns';
import { promisify } from 'util';
import tls from 'tls';
import { URL } from 'url';
import auth from '../middleware/auth.js';
import { verifyMonitorAccess, AuthorizedRequest } from '../middleware/authorize.js';
import { checkEndpoint } from '../services/monitoringService.js';
import { logger } from '../utils/logger.js';
import { MonitorInput } from '../types/monitor.js';
import prisma from '../lib/prisma.js';

const lookupPromise = promisify(dns.lookup);
const sslCache: Record<string, { days: number | null; timestamp: number }> = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function isPrivateIP(ip: string): boolean {
    // IPv4 Checks
    if (/^(127\.|10\.|192\.168\.|169\.254\.)/.test(ip)) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
    // IPv6 Checks
    if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd00:')) return true;
    return false;
}

async function isSafeHost(host: string): Promise<boolean> {
    if (isPrivateIP(host)) return false;
    try {
        const { address } = await lookupPromise(host);
        if (isPrivateIP(address)) return false;
        return true;
    } catch (error) {
        return false;
    }
}

function getSSLDaysRemaining(host: string, port = 443): Promise<number | null> {
    return new Promise((resolve) => {
        let resolved = false;
        const socket = tls.connect({
            host,
            port,
            servername: host,
            timeout: 5000,
            rejectUnauthorized: false
        }, () => {
            const cert = socket.getPeerCertificate();
            socket.destroy();
            if (!resolved) {
                resolved = true;
                if (cert && cert.valid_to) {
                    const expiry = new Date(cert.valid_to);
                    const diffTime = expiry.getTime() - Date.now();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    resolve(diffDays);
                } else {
                    resolve(null);
                }
            }
        });
        
        socket.on('error', () => {
            if (!resolved) {
                resolved = true;
                resolve(null);
            }
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            if (!resolved) {
                resolved = true;
                resolve(null);
            }
        });
    });
}

async function getCachedSSLDaysRemaining(host: string, port = 443): Promise<number | null> {
    const cacheKey = `${host}:${port}`;
    const cached = sslCache[cacheKey];
    const now = Date.now();

    if (cached && (now - cached.timestamp < CACHE_TTL)) {
        return cached.days;
    }

    const isSafe = await isSafeHost(host);
    if (!isSafe) {
        logger.warn(`SSRF Blocked: Unsafe SSL check requested for host: ${host}`);
        sslCache[cacheKey] = { days: null, timestamp: now };
        return null;
    }

    const days = await getSSLDaysRemaining(host, port);
    sslCache[cacheKey] = { days, timestamp: now };
    return days;
}

const router = express.Router();

// Create monitor
router.post('/', auth, async (req, res) => {
    try {
        const monitorData: MonitorInput = req.body;
        logger.info('Create monitor payload:', monitorData);

        const user = await prisma.user.findUnique({ where: { id: (req as any).user.id } });
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

        const baseMonitorData = {
            name: monitorData.name,
            monitorType: monitorData.monitorType,
            notifierId: monitorData.notifierId,
            frequency: monitorData.frequency,
            userId: (req as any).user.id,
            regions: monitorData.regions
        };

        let monitorCreateData: any = { ...baseMonitorData };

        if (monitorData.monitorType === 'http') {
            monitorCreateData = {
                ...monitorCreateData,
                url: monitorData.url,
                method: monitorData.method,
                headers: monitorData.headers,
                body: monitorData.body,
                assertions: monitorData.assertions ? JSON.parse(JSON.stringify(monitorData.assertions)) : undefined,
            };
        } else if (monitorData.monitorType === 'tcp') {
            monitorCreateData = {
                ...monitorCreateData,
                host: monitorData.host,
                port: monitorData.port,
            };
        } else if (monitorData.monitorType === 'dns') {
            monitorCreateData = {
                ...monitorCreateData,
                host: monitorData.host,
                dnsRecordType: monitorData.dnsRecordType,
                expectedIp: monitorData.expectedIp,
                assertions: monitorData.assertions ? JSON.parse(JSON.stringify(monitorData.assertions)) : undefined,
            };
        } else if (monitorData.monitorType === 'ssl') {
            monitorCreateData = {
                ...monitorCreateData,
                host: monitorData.host,
                port: monitorData.port || 443,
                assertions: monitorData.assertions ? JSON.parse(JSON.stringify(monitorData.assertions)) : undefined,
            };
        } else if (monitorData.monitorType === 'ping') {
            monitorCreateData = {
                ...monitorCreateData,
                host: monitorData.host,
                assertions: monitorData.assertions ? JSON.parse(JSON.stringify(monitorData.assertions)) : undefined,
            };
        } else if (monitorData.monitorType === 'graphql') {
            monitorCreateData = {
                ...monitorCreateData,
                url: monitorData.url,
                headers: monitorData.headers,
                query: monitorData.query,
                assertions: monitorData.assertions ? JSON.parse(JSON.stringify(monitorData.assertions)) : undefined,
            };
        }

        const monitor = await prisma.monitor.create({
            data: monitorCreateData
        });
        res.status(201).json(monitor);
        logger.info('Monitor created successfully:', { monitorId: monitor.id });
    } catch (error) {
        logger.error('Error creating monitor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all monitors (owned + shared via team)
router.get('/', auth, async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const { status } = req.query;

        const memberships = await prisma.teamMember.findMany({
            where: { userId },
            include: { team: { include: { admin: true } } }
        });

        const teamRoles = memberships.reduce((acc, m) => {
            acc[m.teamId] = { role: m.role, adminName: m.team.admin?.username || 'Unknown' };
            return acc;
        }, {} as Record<string, { role: string; adminName: string }>);

        const teamIds = Object.keys(teamRoles);

        const sharedMonitorIds = await prisma.monitorTeam.findMany({
            where: { teamId: { in: teamIds } },
            select: { monitorId: true }
        });

        const monitorIds = sharedMonitorIds.map(sm => sm.monitorId);

        const statusFilter = status && typeof status === 'string'
            ? { status: status.toUpperCase() }
            : {};

        const monitors = await prisma.monitor.findMany({
            where: {
                ...statusFilter,
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

        const twentyFourHoursAgo = new Date(Date.now() - 86400000);
        const logs = await prisma.monitorLog.findMany({
            where: {
                monitorId: { in: monitors.map(m => m.id) },
                lastCheckedAt: { gte: twentyFourHoursAgo }
            },
            orderBy: { lastCheckedAt: 'asc' }
        });

        const logsByMonitor: Record<string, typeof logs> = {};
        logs.forEach(log => {
            if (!logsByMonitor[log.monitorId]) {
                logsByMonitor[log.monitorId] = [];
            }
            logsByMonitor[log.monitorId].push(log);
        });

        const monitorsWithStats = await Promise.all(monitors.map(async (monitor) => {
            const mLogs = logsByMonitor[monitor.id] || [];

            const validLogs = mLogs.filter(l => l.responseTime > 0);
            const avgLatency = validLogs.length > 0
                ? Math.round(validLogs.reduce((sum, l) => sum + l.responseTime, 0) / validLogs.length)
                : null;

            const now = Date.now();
            const uptimeHistory = Array.from({ length: 24 }).map((_, idx) => {
                const bucketStart = now - (24 - idx) * 3600000;
                const bucketEnd = now - (23 - idx) * 3600000;
                
                const bucketLogs = mLogs.filter(l => {
                    const t = new Date(l.lastCheckedAt).getTime();
                    return t >= bucketStart && t < bucketEnd;
                });

                if (bucketLogs.length === 0) {
                    return { isUp: true, hasData: false };
                }
                const isUp = bucketLogs.every(l => l.isUp);
                return { isUp, hasData: true };
            });

            let sslDaysRemaining: number | null = null;
            const isHttps = monitor.url?.startsWith('https://');
            const isSslType = monitor.monitorType === 'ssl';

            if (isHttps || isSslType) {
                try {
                    let host = '';
                    let port = 443;
                    if (isHttps && monitor.url) {
                        const parsed = new URL(monitor.url);
                        host = parsed.hostname;
                        if (parsed.port) port = parseInt(parsed.port);
                    } else if (monitor.host) {
                        host = monitor.host;
                        if (host.includes(':')) {
                            const parts = host.split(':');
                            host = parts[0];
                            port = parseInt(parts[1]) || 443;
                        }
                        if (monitor.port) port = monitor.port;
                    }

                    if (host) {
                        sslDaysRemaining = await getCachedSSLDaysRemaining(host, port);
                    }
                } catch (err) {
                    console.error('SSL check error:', err);
                }
            }

            let role = 'OWNER';
            let ownerName = '';

            if (monitor.userId === userId) {
                role = 'OWNER';
            } else {
                const relevantSharedTeams = monitor.sharedTeams.filter(st => teamIds.includes(st.teamId));
                let bestRole: 'READ' | 'WRITE' = 'READ';
                relevantSharedTeams.forEach(st => {
                    const teamInfo = teamRoles[st.teamId];
                    if (teamInfo) {
                        if (teamInfo.role === 'WRITE') bestRole = 'WRITE';
                        ownerName = teamInfo.adminName;
                    }
                });
                role = bestRole;
            }

            return {
                ...monitor,
                role,
                ownerName,
                avgLatency,
                uptimeHistory,
                sslDaysRemaining
            };
        }));

        res.json(monitorsWithStats);
        logger.info('Monitors retrieved successfully:', { monitorsCount: monitors.length });
    } catch (error: any) {
        logger.error('Error getting monitors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single monitor
router.get('/:id', auth, verifyMonitorAccess('READ'), async (req: AuthorizedRequest, res) => {
    try {
        res.json({
            ...req.monitor,
            role: req.monitorRole,
            ownerName: req.monitorOwnerName
        });
        logger.info('Monitor retrieved successfully:', { monitorId: req.monitor.id });
    } catch (error) {
        logger.error('Error getting monitor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update monitor
router.put('/:id', auth, verifyMonitorAccess('WRITE'), async (req: AuthorizedRequest, res) => {
    try {
        const { id } = req.params;
        const { name, url, monitorType, method, headers, body, notifierId, frequency, status, regions, assertions, host, port, dnsRecordType, expectedIp, query } = req.body;
        const existingMonitor = req.monitor;

        if (frequency !== undefined || regions !== undefined) {
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
        if (host !== undefined) updateData.host = host;
        if (port !== undefined) updateData.port = port;
        if (dnsRecordType !== undefined) updateData.dnsRecordType = dnsRecordType;
        if (expectedIp !== undefined) updateData.expectedIp = expectedIp;
        if (query !== undefined) updateData.query = query;

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
});

// Delete monitor
router.delete('/:id', auth, verifyMonitorAccess('WRITE'), async (req: AuthorizedRequest, res) => {
    try {
        const { id } = req.params;
        await prisma.monitor.delete({
            where: { id }
        });
        res.json({ message: 'Monitor deleted successfully' });
        logger.info('Monitor deleted successfully:', { monitorId: id });
    } catch (error) {
        logger.error('Error deleting monitor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Manually check monitor uptime
router.post('/:id/check', auth, verifyMonitorAccess('READ'), async (req: AuthorizedRequest, res) => {
    try {
        const monitor = req.monitor;

        if (monitor.monitorType !== 'http' && monitor.monitorType !== 'graphql') {
            return res.status(400).json({ error: 'Only HTTP or GraphQL monitors can be checked manually' });
        }

        if (monitor.monitorType === 'http' && !monitor.method) {
            return res.status(400).json({ error: 'HTTP method is required' });
        }

        const monitorResults = await checkEndpoint({
            url: monitor.url ?? undefined,
            monitorType: monitor.monitorType,
            method: monitor.method ?? undefined,
            headers: (monitor.headers as Record<string, string>) ?? undefined,
            body: monitor.body ?? undefined,
            assertions: (monitor.assertions as any[]) ?? undefined,
            query: monitor.query ?? undefined
        }, monitor.regions);

        res.json(monitorResults);
        logger.info('Uptime check completed successfully:', { monitorId: monitor.id });
    } catch (error) {
        logger.error('Error checking uptime:', error);
        res.status(500).json({ error: 'Error checking uptime' });
    }
});

// Get monitor logs
router.get('/:id/logs', auth, verifyMonitorAccess('READ'), async (req: AuthorizedRequest, res) => {
    try {
        const { id } = req.params;
        const { aggregate, interval = '15' } = req.query;
        const twentyFourHoursAgo = new Date(Date.now() - 86400000);

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
                if (!log.isUp) {
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

// Get monitor logs by region
router.get('/:id/logs/:region', auth, verifyMonitorAccess('READ'), async (req: AuthorizedRequest, res) => {
    try {
        const { id, region } = req.params;
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

// Get monitor logs for last 1 hour
router.get('/:id/logs/hour', auth, verifyMonitorAccess('READ'), async (req: AuthorizedRequest, res) => {
    try {
        const { id } = req.params;
        const logs = await prisma.monitorLog.findMany({
            where: { monitorId: id, lastCheckedAt: { gte: new Date(Date.now() - 3600000) } },
            orderBy: { lastCheckedAt: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        logger.error('Error getting monitor logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get monitor logs for last 24 hours
router.get('/:id/logs/day', auth, verifyMonitorAccess('READ'), async (req: AuthorizedRequest, res) => {
    try {
        const { id } = req.params;
        const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();
        const logs = await prisma.monitorLog.findMany({
            where: { monitorId: id, lastCheckedAt: { gte: twentyFourHoursAgo } },
            orderBy: { lastCheckedAt: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        logger.error('Error getting monitor logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get monitor stats (avg, p95, p99) for last 24h
router.get('/:id/stats', auth, verifyMonitorAccess('READ'), async (req: AuthorizedRequest, res) => {
    try {
        const { id } = req.params;
        const twentyFourHoursAgo = new Date(Date.now() - 86400000);

        const logs = await prisma.monitorLog.findMany({
            where: {
                monitorId: id,
                lastCheckedAt: { gte: twentyFourHoursAgo },
                responseTime: { gt: 0 }
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
router.post('/:id/test-email', auth, verifyMonitorAccess('READ'), async (req: AuthorizedRequest, res) => {
    try {
        const monitor = req.monitor;

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
