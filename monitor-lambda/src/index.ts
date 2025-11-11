import http from 'http';
import https from 'https';
import { URL } from 'url';

interface Assertion {
    type: 'status' | 'header' | 'body';
    condition: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'matches' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual';
    value: string | number;
    property?: string; // For header assertions
}

interface MonitorCheckEvent {
    url: string;
    monitorType: 'http' | 'tcp';
    method: string;
    headers?: Record<string, string>;
    body?: string;
    assertions?: Assertion[];
}

interface AssertionResult {
    passed: boolean;
    message: string;
}

interface MonitorResponse {
    statusCode: number;
    responseTime: number;
    isUp: boolean;
    timestamp: string;
    headers?: Record<string, string>;
    body?: string;
    error?: string;
    assertions?: AssertionResult[];
}

function validateAssertion(
    assertion: Assertion,
    response: {
        statusCode: number;
        headers: http.IncomingHttpHeaders;
        body: string;
    }
): AssertionResult {
    switch (assertion.type) {
        case 'status':
            switch (assertion.condition) {
                case 'equals':
                    return {
                        passed: response.statusCode === Number(assertion.value),
                        message: `Status ${response.statusCode} equals ${assertion.value}`
                    };
                case 'notEquals':
                    return {
                        passed: response.statusCode !== Number(assertion.value),
                        message: `Status ${response.statusCode} not equals ${assertion.value}`
                    };
                case 'greaterThan':
                    return {
                        passed: response.statusCode > Number(assertion.value),
                        message: `Status ${response.statusCode} greater than ${assertion.value}`
                    };
                case 'lessThan':
                    return {
                        passed: response.statusCode < Number(assertion.value),
                        message: `Status ${response.statusCode} less than ${assertion.value}`
                    };
                case 'greaterThanOrEqual':
                    return {
                        passed: response.statusCode >= Number(assertion.value),
                        message: `Status ${response.statusCode} greater than or equal to ${assertion.value}`
                    };
                case 'lessThanOrEqual':
                    return {
                        passed: response.statusCode <= Number(assertion.value),
                        message: `Status ${response.statusCode} less than or equal to ${assertion.value}`
                    };
                default:
                    return { passed: false, message: 'Invalid status condition' };
            }

        case 'header':
            if (!assertion.property) {
                return { passed: false, message: 'No header property specified' };
            }
            const headerValue = response.headers[assertion.property];
            if (!headerValue) {
                return { passed: false, message: `Header ${assertion.property} not found` };
            }
            const headerStr = Array.isArray(headerValue) ? headerValue.join(', ') : String(headerValue);

            switch (assertion.condition) {
                case 'equals':
                    return {
                        passed: headerStr === String(assertion.value),
                        message: `Header ${assertion.property} equals ${assertion.value}`
                    };
                case 'notEquals':
                    return {
                        passed: headerStr !== String(assertion.value),
                        message: `Header ${assertion.property} not equals ${assertion.value}`
                    };
                case 'contains':
                    return {
                        passed: headerStr.includes(String(assertion.value)),
                        message: `Header ${assertion.property} contains ${assertion.value}`
                    };
                case 'notContains':
                    return {
                        passed: !headerStr.includes(String(assertion.value)),
                        message: `Header ${assertion.property} does not contain ${assertion.value}`
                    };
                case 'matches':
                    try {
                        const regex = new RegExp(String(assertion.value));
                        return {
                            passed: regex.test(headerStr),
                            message: `Header ${assertion.property} matches pattern`
                        };
                    } catch {
                        return { passed: false, message: 'Invalid regex pattern' };
                    }
                default:
                    return { passed: false, message: 'Invalid header condition' };
            }

        case 'body':
            switch (assertion.condition) {
                case 'contains':
                    return {
                        passed: response.body.includes(String(assertion.value)),
                        message: `Body contains ${assertion.value}`
                    };
                case 'notContains':
                    return {
                        passed: !response.body.includes(String(assertion.value)),
                        message: `Body does not contain ${assertion.value}`
                    };
                case 'equals':
                    return {
                        passed: response.body === String(assertion.value),
                        message: `Body equals ${assertion.value}`
                    };
                case 'notEquals':
                    return {
                        passed: response.body !== String(assertion.value),
                        message: `Body not equals ${assertion.value}`
                    };
                case 'matches':
                    try {
                        const regex = new RegExp(String(assertion.value));
                        return {
                            passed: regex.test(response.body),
                            message: `Body matches pattern`
                        };
                    } catch {
                        return { passed: false, message: 'Invalid regex pattern' };
                    }
                default:
                    return { passed: false, message: 'Invalid body condition' };
            }

        default:
            return { passed: false, message: 'Invalid assertion type' };
    }
}

// Reuse connection agents for better Lambda performance (keeps warm connections)
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 10 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 10 });

export const handler = async (event: MonitorCheckEvent): Promise<MonitorResponse> => {
    const startTime = Date.now();
    const { url, method = 'GET', headers = {}, body } = event;

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
            timeout: 15000, // 15s max
            agent: parsedUrl.protocol === 'https:' ? httpsAgent : httpAgent
        };

        return await new Promise<MonitorResponse>((resolve) => {
            const req = protocol.request(options, (res) => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                let responseBody = '';

                // Only capture response body if assertions are present or response status is not 2xx
                const shouldCaptureBody = event.assertions && event.assertions.length > 0;

                res.on('data', (chunk) => {
                    if (shouldCaptureBody && responseBody.length < 1000) {
                        responseBody += chunk.toString();
                    }
                });

                res.on('end', () => {
                    // Process assertions if they exist
                    const assertionResults = event.assertions?.map(assertion => {
                        const result = validateAssertion(assertion, {
                            statusCode: res.statusCode ?? 0,
                            headers: res.headers,
                            body: responseBody
                        });
                        return { ...result, assertion };
                    });

                    // Consider monitor up if all assertions pass, or if no assertions, check status code
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
                    statusCode: 0,
                    responseTime: Date.now() - startTime,
                    isUp: false,
                    timestamp: new Date().toISOString(),
                    error: 'Request timed out'
                });
            });

            req.on('error', (err) => {
                resolve({
                    statusCode: 0,
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
            statusCode: 0,
            responseTime: Date.now() - startTime,
            isUp: false,
            timestamp: new Date().toISOString(),
            error: error.message
        };
    }
};
