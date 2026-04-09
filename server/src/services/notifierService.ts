import axios from 'axios';
import { logger } from '../utils/logger.js';
import * as emailService from './emailService.js';
import prisma from '../lib/prisma.js';

export async function getNotifiers(userId: string) {
    return prisma.notifier.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createNotifier(userId: string, data: { name: string, type: string, details: string }) {
    return prisma.notifier.create({
        data: {
            ...data,
            userId
        }
    });
}

export async function updateNotifier(userId: string, id: string, data: { name?: string, type?: string, details?: string }) {
    return prisma.notifier.update({
        where: { id, userId },
        data
    });
}

export async function deleteNotifier(userId: string, id: string) {
    return prisma.notifier.delete({
        where: { id, userId }
    });
}

export async function sendTestNotification(userId: string, id: string) {
    const notifier = await prisma.notifier.findUnique({
        where: { id, userId }
    });

    if (!notifier) {
        throw new Error('Notifier not found');
    }

    if (notifier.type === 'Email') {
        logger.info(`Sending test email to ${notifier.details}`);
        await emailService.sendCustomEmail(
            [notifier.details],
            '🚨 Test Notification: Beacn',
            `This is a test notification to verify that your email channel "${notifier.name}" is working correctly.`
        );
    } else if (notifier.type === 'Webhook') {
        logger.info(`Sending test webhook to ${notifier.details}`);

        // Slack-compatible yet universal payload
        const payload = {
            text: `🚨 *Test Notification*: Beacn alert channel "${notifier.name}" is working!`,
            event: "test_notification",
            notifier: {
                id: notifier.id,
                name: notifier.name,
                type: notifier.type
            },
            timestamp: new Date().toISOString(),
            message: "This is a test payload to verify your webhook endpoint is reachable and handling requests correctly."
        };

        try {
            await axios.post(notifier.details, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Beacn-Notifier'
                },
                timeout: 5000
            });
        } catch (error: any) {
            logger.error(`Webhook test failed for ${notifier.details}:`, error.message);
            throw new Error(`Webhook test failed: ${error.message}`);
        }
    }

    return { success: true };
}

export async function sendAlert(notifierId: string, url: string, results: any[]) {
    const notifier = await prisma.notifier.findUnique({
        where: { id: notifierId }
    });

    if (!notifier) {
        logger.error(`sendAlert: Notifier ${notifierId} not found`);
        return;
    }

    if (notifier.type === 'Email') {
        logger.info(`sendAlert: Sending alert email to ${notifier.details}`);
        await emailService.sendAlert([notifier.details], url, results);
    } else if (notifier.type === 'Webhook') {
        logger.info(`sendAlert: Sending alert webhook to ${notifier.details}`);

        const payload = {
            text: `🚨 *Alert*: ${url} is down!`,
            event: "monitor_down",
            monitor: {
                url,
                results
            },
            notifier: {
                id: notifier.id,
                name: notifier.name
            },
            timestamp: new Date().toISOString(),
            message: `The monitor for ${url} has reported a down state from one or more regions.`
        };

        try {
            await axios.post(notifier.details, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Beacn-Notifier'
                },
                timeout: 5000
            });
        } catch (error: any) {
            logger.error(`sendAlert: Webhook alert failed for ${notifier.details}:`, error.message);
        }
    }
}

