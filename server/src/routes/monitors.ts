import { PrismaClient } from '@prisma/client';
import express from 'express';
import auth from '../middleware/auth';

import { Resend } from 'resend';
import { checkEndpoint } from '../services/monitoringService';
import { logger } from '../utils/logger';


const prisma = new PrismaClient();
const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

import { MonitorInput } from '../types/monitor';

// Create monitor
router.post('/', auth, async (req, res) => {
    try {
        const monitorData: MonitorInput = req.body;
        logger.info('Create monitor payload:', monitorData);

        console.log('Received monitor data:', monitorData);
        // Prepare monitor data based on type
        const baseMonitorData = {
            monitorType: monitorData.monitorType,
            emails: monitorData.emails,
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

// Get all monitors
router.get('/', auth, async (req, res) => {
    try {
        const monitors = await prisma.monitor.findMany({
            where: { userId: req.user?.id }
        })
        res.json(monitors);
        logger.info('Monitors retrieved successfully:', { monitorsCount: monitors.length });
    } catch (error) {
        logger.error('Error getting monitors:', error);
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
        const { url, monitorType, method, headers, body, emails, frequency, status, regions, assertions } = req.body;

        const monitorData = {
            url,
            monitorType,
            method,
            headers: headers || {},
            body: body || null,
            emails,
            frequency,
            status,
            regions,
            assertions: assertions ? JSON.parse(JSON.stringify(assertions)) : undefined,
        };

        const updatedMonitor = await prisma.monitor.update({
            where: { id, userId: req.user?.id },
            data: monitorData
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

        // The status page will be auto-deleted due to the cascading delete in prisma schema
        await prisma.monitor.delete({
            where: { id, userId: req.user?.id }
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
        const monitor = await prisma.monitor.findUnique({
            where: { id, userId: req.user!.id }
        });
        if (!monitor) {
            logger.info('Monitor not found:', { monitorId: id });
            return res.status(404).json({ error: 'Monitor not found' });
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
        logger.error('Error getting monitor logs:', error);
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
        logger.error('Error getting monitor logs:', error);
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
        logger.error('Error getting monitor logs:', error);
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
        logger.error('Error getting monitor logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// send test email
router.post('/:id/test-email', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const monitor = await prisma.monitor.findUnique({
            where: { id, userId: req.user!.id }
        });
        if (!monitor) {
            return res.status(404).json({ error: 'Monitor not found' });
        }
        const { emails } = monitor;
        const emailSource = process.env.EMAIL_SOURCE || '';
        const { data, error } = await resend.emails.send({
            from: emailSource,
            to: emails,
            subject: '🚨 Test email from ZeroDowntime',
            text: 'This is a test email from the ZeroDowntime service. If you received this email, it means the email service is working correctly.'
        });
        if (error) {
            logger.error('Error sending test email:', error);
            return res.status(500).json({ error: 'Error sending test email' });
        }
        res.json({ message: 'Test email sent successfully' });
    } catch (error) {
        logger.error('Error sending test email:', error);
        res.status(500).json({ error: 'Error sending test email' });
    }
});

export default router;

