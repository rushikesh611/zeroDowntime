import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { checkWebsiteUptime } from '../services/uptimeService'

const prisma = new PrismaClient()

// Cache to store details for each monitor by monitorId
const cache: { [key: string]: { results: any[], lastCheckedAt: Date } } = {}

export function startUptimeCheck() {
    cron.schedule('*/30 * * * * *', async () => {
        const monitors = await prisma.monitor.findMany({ where: { status: 'RUNNING' } })

        for (const monitor of monitors) {
            const currentTime = new Date()
            const lastCheckedAt = cache[monitor.id]?.lastCheckedAt || new Date(0)

            // Note: frequency is in milliseconds
            if (Number(currentTime) - Number(lastCheckedAt) >= monitor.frequency) {
                const results = await checkWebsiteUptime(monitor.url)
                const isDown = results.some(result => !result.isUp)

                if (isDown) {
                    console.log(`Website ${monitor.url} is down`)
                    // TODO: send email alert
                } else {
                    console.log(`Website ${monitor.url} is up`)
                }

                // Initialize cache if it doesn't exist for this monitor
                if (!cache[monitor.id]) {
                    cache[monitor.id] = { results: [], lastCheckedAt: currentTime }
                }

                // Push the current check results into the cache
                cache[monitor.id].results.push({ time: currentTime, isDown, results })

                // Update lastCheckedAt in the cache
                cache[monitor.id].lastCheckedAt = currentTime

                // Check if there are 10 records in the cache
                if (cache[monitor.id].results.length >= 10) {

                    // Insert the 10 records into the database
                    for (const record of cache[monitor.id].results) {
                        for (const result of record.results) {
                            await prisma.monitorLog.create({
                                data: {
                                    monitorId: monitor.id,
                                    region: result.region,
                                    statusCode: result.statusCode,
                                    responseTime: result.responseTime,
                                    isUp: result.isUp,
                                }
                            })
                        }
                    }

                    // Clear the cached results for this monitor
                    cache[monitor.id].results = []
                }
            }
        }
    })
}
