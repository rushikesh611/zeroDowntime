import { Monitor, MonitorLog, PrismaClient } from '@prisma/client'
import cron from 'node-cron'
import { sendAlert } from '../services/emailService'
import { checkEndpoint } from '../services/monitoringService'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface UptimeResult {
    region: string;
    statusCode: number;
    responseTime: number;
    isUp: boolean;
}

interface CachedResult {
    time: Date;
    isDown: boolean;
    results: UptimeResult[];
}

interface MonitorCache {
    results: CachedResult[];
    lastCheckedAt: Date;
}

const cache: { [key: string]: MonitorCache } = {}

export function startUptimeCheck() {
    cron.schedule('*/30 * * * * *', async () => {
        logger.info('Running uptime check job at ' + new Date().toISOString())
        const currentTime = new Date()
        const monitors = await prisma.monitor.findMany({
            where: { status: 'RUNNING' }
        })
        if (monitors.length === 0) {
            logger.info('No monitors found to check uptime')
            return
        } else {
            logger.info(`Found ${monitors.length} monitors to check uptime`)
        }

        await Promise.all(monitors.map(async (monitor: Monitor) => {
            const lastCheckedAt = cache[monitor.id]?.lastCheckedAt || new Date(0)

            if (currentTime.getTime() - lastCheckedAt.getTime() >= monitor.frequency * 1000) {
                const results = await checkEndpoint({
                    url: monitor.url,
                    type: 'http',
                    method: monitor.method,
                    headers: monitor.headers as Record<string, string> | undefined,
                    body: monitor.body || undefined,
                    assertions: monitor.assertions as any[] | undefined 
                }, monitor.regions)
                const isDown = results.some(result => !result.isUp)

                if (isDown) {
                    logger.warn(`Endpoint ${monitor.url} is down`, { timestamp: currentTime, results })
                    await sendAlert(monitor.emails, monitor.url, results)
                } else {
                    logger.info(`Endpoint ${monitor.url} is up`, { timestamp: currentTime, monitorType: 'http' })
                }

                // Initialize or update cache
                if (!cache[monitor.id]) {
                    cache[monitor.id] = { results: [], lastCheckedAt: currentTime }
                }
                cache[monitor.id].results.push({ time: currentTime, isDown, results })
                cache[monitor.id].lastCheckedAt = currentTime

                // Batch insert if cache has 10 or more records
                if (cache[monitor.id].results.length >= 10) {
                    const logData: Omit<MonitorLog, 'id'>[] = cache[monitor.id].results.flatMap(record =>
                        record.results.map(result => ({
                            monitorId: monitor.id,
                            isUp: !record.isDown,
                            statusCode: result.statusCode,
                            responseTime: result.responseTime,
                            region: result.region,
                            lastCheckedAt: record.time,
                            headers: null,
                            responseBody: null,
                            error: null
                        }))
                    )

                    await prisma.monitorLog.createMany({
                        data: logData
                    })
                    logger.info(`Inserted ${logData.length} logs for monitor ${monitor.id}`)

                    cache[monitor.id].results = []
                }
            }
        }))
    })
}