import http from 'http';
import https from 'https';
import net from 'net';
import dns from 'dns';
import tls from 'tls';
import { URL } from 'url';
import { promisify } from 'util';

const dnsResolve = promisify(dns.resolve);

interface Assertion {
    type: 'status' | 'header' | 'body' | 'responseTime' | 'certificateExpiry';
    condition: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'matches' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual';
    value: string | number;
    property?: string;
}

export interface MonitorCheckEvent {
    url?: string;
    host?: string;
    port?: number;
    monitorType: 'http' | 'tcp' | 'dns' | 'ssl' | 'ping' | 'graphql';
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    query?: string; // GraphQL query
    dnsRecordType?: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';
    expectedIp?: string; // For DNS validation
    assertions?: Assertion[];
}

interface AssertionResult {
    passed: boolean;
    message: string;
}

export interface MonitorResponse {
    statusCode?: number;
    responseTime: number;
    isUp: boolean;
    timestamp: string;
    headers?: Record<string, string>;
    body?: string;
    error?: string;
    assertions?: AssertionResult[];
    dnsRecords?: string[];
    sslInfo?: {
        valid: boolean;
        validFrom?: string;
        validTo?: string;
        daysUntilExpiry?: number;
        issuer?: string;
    };
}

function validateAssertion(
    assertion: Assertion,
    context: {
        statusCode?: number;
        headers?: http.IncomingHttpHeaders;
        body?: string;
        responseTime?: number;
        daysUntilExpiry?: number;
    }
): AssertionResult {
    switch (assertion.type) {
        case 'status':
            if (context.statusCode === undefined) {
                return { passed: false, message: 'No status code available' };
            }
            return validateNumericCondition(
                assertion.condition,
                context.statusCode,
                Number(assertion.value),
                'Status'
            );

        case 'responseTime':
            if (context.responseTime === undefined) {
                return { passed: false, message: 'No response time available' };
            }
            return validateNumericCondition(
                assertion.condition,
                context.responseTime,
                Number(assertion.value),
                'Response time'
            );

        case 'certificateExpiry':
            if (context.daysUntilExpiry === undefined) {
                return { passed: false, message: 'No certificate expiry available' };
            }
            return validateNumericCondition(
                assertion.condition,
                context.daysUntilExpiry,
                Number(assertion.value),
                'Days until expiry'
            );

        case 'header':
            if (!assertion.property || !context.headers) {
                return { passed: false, message: 'No header property or headers available' };
            }
            const headerValue = context.headers[assertion.property];
            if (!headerValue) {
                return { passed: false, message: `Header ${assertion.property} not found` };
            }
            const headerStr = Array.isArray(headerValue) ? headerValue.join(', ') : String(headerValue);
            return validateStringCondition(assertion.condition, headerStr, String(assertion.value), `Header ${assertion.property}`);

        case 'body':
            if (!context.body) {
                return { passed: false, message: 'No body available' };
            }
            return validateStringCondition(assertion.condition, context.body, String(assertion.value), 'Body');

        default:
            return { passed: false, message: 'Invalid assertion type' };
    }
}

function validateNumericCondition(
    condition: string,
    actual: number,
    expected: number,
    label: string
): AssertionResult {
    switch (condition) {
        case 'equals':
            return { passed: actual === expected, message: `${label} ${actual} equals ${expected}` };
        case 'notEquals':
            return { passed: actual !== expected, message: `${label} ${actual} not equals ${expected}` };
        case 'greaterThan':
            return { passed: actual > expected, message: `${label} ${actual} greater than ${expected}` };
        case 'lessThan':
            return { passed: actual < expected, message: `${label} ${actual} less than ${expected}` };
        case 'greaterThanOrEqual':
            return { passed: actual >= expected, message: `${label} ${actual} >= ${expected}` };
        case 'lessThanOrEqual':
            return { passed: actual <= expected, message: `${label} ${actual} <= ${expected}` };
        default:
            return { passed: false, message: 'Invalid numeric condition' };
    }
}

function validateStringCondition(
    condition: string,
    actual: string,
    expected: string,
    label: string
): AssertionResult {
    switch (condition) {
        case 'equals':
            return { passed: actual === expected, message: `${label} equals expected value` };
        case 'notEquals':
            return { passed: actual !== expected, message: `${label} not equals expected value` };
        case 'contains':
            return { passed: actual.includes(expected), message: `${label} contains "${expected}"` };
        case 'notContains':
            return { passed: !actual.includes(expected), message: `${label} does not contain "${expected}"` };
        case 'matches':
            try {
                const regex = new RegExp(expected);
                return { passed: regex.test(actual), message: `${label} matches pattern` };
            } catch {
                return { passed: false, message: 'Invalid regex pattern' };
            }
        default:
            return { passed: false, message: 'Invalid string condition' };
    }
}

// Reuse connection agents
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 10 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 10 });

async function checkHttp(event: MonitorCheckEvent): Promise<MonitorResponse> {
    const startTime = Date.now();
    const { url, method = 'GET', headers = {}, body } = event;

    if (!url) {
        throw new Error('URL is required for HTTP monitoring');
    }

    try {
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        const options: http.RequestOptions = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method,
            headers: {
                ...headers,
                'User-Agent': 'ZeroDowntime-Monitor/2.0'
            },
            timeout: 15000,
            agent: parsedUrl.protocol === 'https:' ? httpsAgent : httpAgent
        };

        return await new Promise<MonitorResponse>((resolve) => {
            const req = protocol.request(options, (res) => {
                const responseTime = Date.now() - startTime;
                let responseBody = '';

                const shouldCaptureBody = event.assertions && event.assertions.length > 0;

                res.on('data', (chunk) => {
                    if (shouldCaptureBody && responseBody.length < 5000) {
                        responseBody += chunk.toString();
                    }
                });

                res.on('end', () => {
                    const assertionResults = event.assertions?.map(assertion =>
                        validateAssertion(assertion, {
                            statusCode: res.statusCode ?? 0,
                            headers: res.headers,
                            body: responseBody,
                            responseTime
                        })
                    );

                    const isUp = assertionResults
                        ? assertionResults.every(r => r.passed)
                        : (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 400;

                    resolve({
                        statusCode: res.statusCode ?? 0,
                        responseTime,
                        isUp,
                        timestamp: new Date().toISOString(),
                        headers: Object.fromEntries(
                            Object.entries(res.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : String(v || '')])
                        ),
                        body: shouldCaptureBody ? responseBody : undefined,
                        assertions: assertionResults
                    });
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    responseTime: Date.now() - startTime,
                    isUp: false,
                    timestamp: new Date().toISOString(),
                    error: 'Request timed out'
                });
            });

            req.on('error', (err) => {
                resolve({
                    responseTime: Date.now() - startTime,
                    isUp: false,
                    timestamp: new Date().toISOString(),
                    error: err.message
                });
            });

            if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
                req.write(body);
            }

            req.end();
        });
    } catch (error: any) {
        return {
            responseTime: Date.now() - startTime,
            isUp: false,
            timestamp: new Date().toISOString(),
            error: error.message
        };
    }
}

async function checkGraphQL(event: MonitorCheckEvent): Promise<MonitorResponse> {
    const startTime = Date.now();
    const { url, headers = {}, query } = event;

    if (!url || !query) {
        throw new Error('URL and query are required for GraphQL monitoring');
    }

    try {
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        const graphqlBody = JSON.stringify({ query });

        const options: http.RequestOptions = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(graphqlBody),
                'User-Agent': 'ZeroDowntime-Monitor/2.0'
            },
            timeout: 15000,
            agent: parsedUrl.protocol === 'https:' ? httpsAgent : httpAgent
        };

        return await new Promise<MonitorResponse>((resolve) => {
            const req = protocol.request(options, (res) => {
                const responseTime = Date.now() - startTime;
                let responseBody = '';

                res.on('data', (chunk) => {
                    if (responseBody.length < 5000) {
                        responseBody += chunk.toString();
                    }
                });

                res.on('end', () => {
                    let isUp = (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 400;

                    // Additional GraphQL-specific checks
                    try {
                        const parsed = JSON.parse(responseBody);
                        if (parsed.errors && parsed.errors.length > 0) {
                            isUp = false;
                        }
                    } catch {
                        // Not valid JSON
                        isUp = false;
                    }

                    const assertionResults = event.assertions?.map(assertion =>
                        validateAssertion(assertion, {
                            statusCode: res.statusCode ?? 0,
                            headers: res.headers,
                            body: responseBody,
                            responseTime
                        })
                    );

                    if (assertionResults) {
                        isUp = assertionResults.every(r => r.passed);
                    }

                    resolve({
                        statusCode: res.statusCode ?? 0,
                        responseTime,
                        isUp,
                        timestamp: new Date().toISOString(),
                        body: responseBody,
                        assertions: assertionResults
                    });
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    responseTime: Date.now() - startTime,
                    isUp: false,
                    timestamp: new Date().toISOString(),
                    error: 'Request timed out'
                });
            });

            req.on('error', (err) => {
                resolve({
                    responseTime: Date.now() - startTime,
                    isUp: false,
                    timestamp: new Date().toISOString(),
                    error: err.message
                });
            });

            req.write(graphqlBody);
            req.end();
        });
    } catch (error: any) {
        return {
            responseTime: Date.now() - startTime,
            isUp: false,
            timestamp: new Date().toISOString(),
            error: error.message
        };
    }
}

async function checkTCP(event: MonitorCheckEvent): Promise<MonitorResponse> {
    const startTime = Date.now();
    const { host, port } = event;

    if (!host || !port) {
        throw new Error('Host and port are required for TCP monitoring');
    }

    return new Promise<MonitorResponse>((resolve) => {
        const socket = net.createConnection({
            host,
            port,
            timeout: 10000
        });

        socket.on('connect', () => {
            const responseTime = Date.now() - startTime;
            socket.destroy();

            const assertionResults = event.assertions?.map(assertion =>
                validateAssertion(assertion, { responseTime })
            );

            const isUp = assertionResults ? assertionResults.every(r => r.passed) : true;

            resolve({
                responseTime,
                isUp,
                timestamp: new Date().toISOString(),
                assertions: assertionResults
            });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({
                responseTime: Date.now() - startTime,
                isUp: false,
                timestamp: new Date().toISOString(),
                error: 'Connection timed out'
            });
        });

        socket.on('error', (err) => {
            resolve({
                responseTime: Date.now() - startTime,
                isUp: false,
                timestamp: new Date().toISOString(),
                error: err.message
            });
        });
    });
}

async function checkDNS(event: MonitorCheckEvent): Promise<MonitorResponse> {
    const startTime = Date.now();
    const { host, dnsRecordType = 'A', expectedIp } = event;

    if (!host) {
        throw new Error('Host is required for DNS monitoring');
    }

    try {
        const rawRecords = await dnsResolve(host, dnsRecordType);
        const records = Array.isArray(rawRecords) ? rawRecords : [rawRecords];
        const responseTime = Date.now() - startTime;

        let isUp = records && records.length > 0;

        // If expectedIp is provided, validate it
        if (expectedIp && records) {
            const recordStrings = records.map(r => typeof r === 'string' ? r : JSON.stringify(r));
            isUp = recordStrings.some(record => record.includes(expectedIp));
        }

        const assertionResults = event.assertions?.map(assertion =>
            validateAssertion(assertion, { responseTime })
        );

        if (assertionResults) {
            isUp = assertionResults.every(r => r.passed);
        }

        return {
            responseTime,
            isUp,
            timestamp: new Date().toISOString(),
            dnsRecords: records.map(r => typeof r === 'string' ? r : JSON.stringify(r)),
            assertions: assertionResults
        };
    } catch (error: any) {
        return {
            responseTime: Date.now() - startTime,
            isUp: false,
            timestamp: new Date().toISOString(),
            error: error.message
        };
    }
}

async function checkSSL(event: MonitorCheckEvent): Promise<MonitorResponse> {
    const startTime = Date.now();
    const { host, port = 443 } = event;

    if (!host) {
        throw new Error('Host is required for SSL monitoring');
    }

    return new Promise<MonitorResponse>((resolve) => {
        const socket = tls.connect({
            host,
            port,
            servername: host,
            timeout: 10000,
            rejectUnauthorized: false // We want to check even invalid certs
        });

        socket.on('secureConnect', () => {
            const responseTime = Date.now() - startTime;
            const cert = socket.getPeerCertificate();

            if (!cert || Object.keys(cert).length === 0) {
                socket.destroy();
                resolve({
                    responseTime,
                    isUp: false,
                    timestamp: new Date().toISOString(),
                    error: 'No certificate found'
                });
                return;
            }

            const now = new Date();
            const validFrom = new Date(cert.valid_from);
            const validTo = new Date(cert.valid_to);
            const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isValid = now >= validFrom && now <= validTo && socket.authorized;

            socket.destroy();

            const assertionResults = event.assertions?.map(assertion =>
                validateAssertion(assertion, { responseTime, daysUntilExpiry })
            );

            const isUp = assertionResults ? assertionResults.every(r => r.passed) : isValid;

            resolve({
                responseTime,
                isUp,
                timestamp: new Date().toISOString(),
                sslInfo: {
                    valid: isValid,
                    validFrom: cert.valid_from,
                    validTo: cert.valid_to,
                    daysUntilExpiry,
                    issuer: cert.issuer?.O || 'Unknown'
                },
                assertions: assertionResults
            });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({
                responseTime: Date.now() - startTime,
                isUp: false,
                timestamp: new Date().toISOString(),
                error: 'SSL handshake timed out'
            });
        });

        socket.on('error', (err) => {
            resolve({
                responseTime: Date.now() - startTime,
                isUp: false,
                timestamp: new Date().toISOString(),
                error: err.message
            });
        });
    });
}

async function checkPing(event: MonitorCheckEvent): Promise<MonitorResponse> {
    const startTime = Date.now();
    const { host } = event;

    if (!host) {
        throw new Error('Host is required for ping monitoring');
    }

    // Lambda doesn't support ICMP, so we'll do a TCP ping on port 80 or 443
    // This is a workaround since Lambda can't send ICMP packets

    const ports = [443, 80];

    for (const port of ports) {
        try {
            const result = await checkTCP({ ...event, host, port, monitorType: 'tcp' });
            if (result.isUp) {
                return {
                    ...result,
                    responseTime: Date.now() - startTime
                };
            }
        } catch {
            continue;
        }
    }

    return {
        responseTime: Date.now() - startTime,
        isUp: false,
        timestamp: new Date().toISOString(),
        error: 'Host unreachable (tried ports 443, 80)'
    };
}

export const handler = async (event: MonitorCheckEvent): Promise<MonitorResponse> => {
    try {
        switch (event.monitorType) {
            case 'http':
                return await checkHttp(event);
            case 'graphql':
                return await checkGraphQL(event);
            case 'tcp':
                return await checkTCP(event);
            case 'dns':
                return await checkDNS(event);
            case 'ssl':
                return await checkSSL(event);
            case 'ping':
                return await checkPing(event);
            default:
                throw new Error(`Unsupported monitor type: ${event.monitorType}`);
        }
    } catch (error: any) {
        return {
            responseTime: 0,
            isUp: false,
            timestamp: new Date().toISOString(),
            error: error.message
        };
    }
};