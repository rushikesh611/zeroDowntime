export interface Monitor {
    id: string;
    url: string;
    emails: string[];
    frequency: number;
    status: "RUNNING" | "PAUSED";
    userId: string;
    createdAt: string;
    updatedAt: string;
}


export interface MonitorLog {
    id: string;
    monitorId: string;
    isUp: boolean;
    statusCode: number;
    responseTime: number;
    region: string;
    lastCheckedAt: string;
};
