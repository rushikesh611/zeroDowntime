import crypto from "crypto";
import prisma from "../lib/prisma.js";

export class LogSourceService {
    static hashApiKey(apiKey: string): string {
        return crypto.createHash("sha256").update(apiKey).digest("hex");
    }

    static async createLogSource(userId: string, name: string) {
        const rawApiKey = crypto.randomBytes(32).toString("hex");
        const hashedApiKey = this.hashApiKey(rawApiKey);

        const logSource = await prisma.logSource.create({
            data: {
                name,
                apiKey: hashedApiKey,
                userId
            }
        });

        // Return the raw API key only once during creation so the user can copy it
        return {
            ...logSource,
            apiKey: rawApiKey
        };
    }

    static async getLogSources(userId: string) {
        return prisma.logSource.findMany({
            where: {
                userId
            }
        });
    }

    static async deleteLogSource(id: string, userId: string) {
        return prisma.logSource.delete({
            where: {
                id,
                userId
            }
        });
    }

    static async validateApiKey(apiKey: string) {
        const hashedApiKey = this.hashApiKey(apiKey);
        return prisma.logSource.findUnique({
            where: { apiKey: hashedApiKey },
            select: {
                id: true,
                name: true,
                userId: true
            }
        });
    }
}