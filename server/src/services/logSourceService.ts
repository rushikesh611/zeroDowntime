import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export class LogSourceService {
    static async createLogSource(userId: string, name: string) {
        const apiKey = crypto.randomBytes(32).toString("hex");

        return prisma.logSource.create({
            data: {
                name,
                apiKey,
                userId
            }
        });
    }

    static async getLogSources(userId: string) {
        return prisma.logSource.findMany({
            where: {
                userId
            }
        });
    }

    static async deleteLogSource(id: string, userId: string) {
        return prisma.logSource.deleteMany({
            where: {
                id,
                userId
            }
        });
    }

    static async validateApiKey(apiKey: string) {
        return prisma.logSource.findUnique({
            where: { apiKey },
            select: {
                id: true,
                name: true,
                userId: true
            }
        })
    }
}