import Transport from 'winston-transport';
import axios from 'axios';

interface LogInfo {
    timestamp: string;
    level: string;
    message: string;
    [key: string]: any;
}

export class LogVaultTransport extends Transport {
    private readonly logVaultUrl: string;
    private buffer: any[] = [];
    private readonly batchSize: number;
    private readonly flushInterval: number;
    private timer: NodeJS.Timeout | null = null;

    constructor(opts: any = {}) {
        super(opts);
        this.logVaultUrl = process.env.LOGVAULT_URL || 'http://localhost:8000/logs';
        this.batchSize = opts.batchSize || 100;  // Buffer size before forcing a flush
        this.flushInterval = opts.flushInterval || 10000;  // Flush every 5 seconds
        this.startTimer();
    }

    private startTimer() {
        this.timer = setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }

    private async flush() {
        if (this.buffer.length === 0) return;

        const logsToSend = [...this.buffer];
        this.buffer = [];

        try {
            await axios.post(this.logVaultUrl, {
                logs: logsToSend
            }, {
                timeout: 5000, // 5 second timeout
            });
        } catch (error) {
            console.error('Failed to send logs to LogVault:', error);
            // Put the logs back in the buffer for retry
            this.buffer = [...logsToSend, ...this.buffer].slice(0, 1000); // Prevent infinite growth
        }
    }


    async log(info: LogInfo, callback: () => void) {
        setImmediate(() => {
            this.emit('logged', info);
        });

        const { timestamp, level, message, ...metadata } = info;

        const logEntry = {
            timestamp: info.timestamp || new Date().toISOString(),
            source: 'server',
            level,
            message,
            metadata,
        };

        this.buffer.push(logEntry);

        if (this.buffer.length >= this.batchSize) {
            await this.flush();
        }

        callback();
    }

    close() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        // Final flush of any remaining logs
        return this.flush();
    }
}