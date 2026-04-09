export interface Monitor {
    id: string;
    url?: string;
    notifierId?: string;
    notifier?: Notifier;
    regions: string[];
    frequency: number;
    status: "RUNNING" | "PAUSED";
    userId: string;
    createdAt: string;
    updatedAt: string;
    method?: string;
    host?: string;
    port?: number;
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

export type NotifierType = 'Email' | 'Webhook';

export interface Notifier {
    id: string;
    name: string;
    type: NotifierType;
    details: string;
    createdAt: string;
    updatedAt: string;
}