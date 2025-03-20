import Transport from 'winston-transport';
import axios from 'axios';

interface LogInfo {
    timestamp: string;
    level: string;
    message: string;
    ms: number;
    requestId: string;
    [key: string]: any;
}

export class LogVaultTransport extends Transport {
    private readonly logVaultUrl: string;

    constructor(opts?: any) {
        super(opts);
        this.logVaultUrl = process.env.LOGVAULT_URL || 'http://localhost:8000/logs';
    }


    async log(info: LogInfo, callback: () => void) {
        setImmediate(() => {
            this.emit('logged', info)
        });

        try {
            await axios.post(this.logVaultUrl, {
                logs: [{
                    timestamp: info.timestamp,
                    source: 'server',
                    level: info.level,
                    message: info.message,
                    metadata: {
                        ...info,
                        ms: info.ms,
                        requestId: info.requestId
                    }
                }]
            })
        } catch (error) {
            console.error('Error in logging to logvault', error);
        }

        callback();
    }
}