export interface Monitor {
    id: string;
    url: string;
    emails: string[];
    regions: string[];
    frequency: number;
    status: "RUNNING" | "PAUSED";
    userId: string;
    createdAt: string;
    updatedAt: string;
    method: string;
    headers?: Record<string, string>;
    body?: string;
    assertions?: any[];
    monitorType: "string";
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

export interface StatusPage {
    id: string;
    subdomain: string;
    title: string;
    description: string;
    isPublic: boolean;
    createdAt: string;
    monitor: {
        url: string;
        status: "RUNNING" | "PAUSED";
    }
}