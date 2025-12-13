import { handler } from './index';
import type { MonitorCheckEvent, MonitorResponse } from './index';

// Test configuration
const TEST_CONFIG = {
    timeout: 20000, // 20s per test
    verbose: true
};

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    gray: '\x1b[90m'
};

interface TestResult {
    name: string;
    passed: boolean;
    duration: number;
    error?: string;
    response?: MonitorResponse;
}

class TestRunner {
    private results: TestResult[] = [];
    private startTime: number = 0;

    async runTest(name: string, event: MonitorCheckEvent): Promise<TestResult> {
        const testStart = Date.now();

        try {
            console.log(`${colors.blue}▶ Running:${colors.reset} ${name}`);

            const response = await handler(event);
            const duration = Date.now() - testStart;

            if (TEST_CONFIG.verbose) {
                console.log(`${colors.gray}  Response:${colors.reset}`, JSON.stringify(response, null, 2));
            }

            const passed = this.validateResponse(response, event);

            const result: TestResult = {
                name,
                passed,
                duration,
                response
            };

            if (passed) {
                console.log(`${colors.green}✓ Passed${colors.reset} (${duration}ms)`);
                if (response.error) {
                    console.log(`${colors.gray}  (Correctly handled error: ${response.error})${colors.reset}`);
                } else if (!response.isUp) {
                    console.log(`${colors.gray}  (Correctly detected service down)${colors.reset}`);
                }
                console.log();
            } else {
                console.log(`${colors.red}✗ Failed${colors.reset} (${duration}ms)\n`);
            }

            this.results.push(result);
            return result;

        } catch (error: any) {
            const duration = Date.now() - testStart;
            console.log(`${colors.red}✗ Error${colors.reset} (${duration}ms): ${error.message}\n`);

            const result: TestResult = {
                name,
                passed: false,
                duration,
                error: error.message
            };

            this.results.push(result);
            return result;
        }
    }

    private validateResponse(response: MonitorResponse, event: MonitorCheckEvent): boolean {
        // Basic validation - response should always have these fields
        if (!response.timestamp) return false;
        if (response.responseTime === undefined) return false;
        if (response.isUp === undefined) return false;

        // If there's an error, that's a valid response (we're testing error handling)
        if (response.error) return true;

        // Type-specific validation for successful responses
        switch (event.monitorType) {
            case 'http':
            case 'graphql':
                return response.statusCode !== undefined;

            case 'dns':
                return response.dnsRecords !== undefined || response.error !== undefined;

            case 'ssl':
                return response.sslInfo !== undefined || response.error !== undefined;

            case 'tcp':
            case 'ping':
                return true; // Basic response is sufficient

            default:
                return false;
        }
    }

    printSummary() {
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const total = this.results.length;
        const totalDuration = Date.now() - this.startTime;

        console.log('\n' + '='.repeat(60));
        console.log(`${colors.blue}TEST SUMMARY${colors.reset}`);
        console.log('='.repeat(60));
        console.log(`Total Tests: ${total}`);
        console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
        console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
        console.log(`Total Duration: ${totalDuration}ms`);
        console.log('='.repeat(60) + '\n');

        if (failed > 0) {
            console.log(`${colors.red}Failed Tests:${colors.reset}`);
            this.results
                .filter(r => !r.passed)
                .forEach(r => {
                    console.log(`  - ${r.name}`);
                    if (r.error) console.log(`    Error: ${r.error}`);
                    if (r.response?.error) console.log(`    Response Error: ${r.response.error}`);
                });
            console.log();
        }

        return failed === 0;
    }

    start() {
        this.startTime = Date.now();
        console.log(`${colors.blue}Starting Monitor Lambda Tests${colors.reset}\n`);
    }
}

// Test Suite
async function runAllTests() {
    const runner = new TestRunner();
    runner.start();

    // ==================== HTTP TESTS ====================
    console.log(`${colors.yellow}═══ HTTP Monitoring Tests ═══${colors.reset}\n`);

    await runner.runTest('HTTP - GET request (Google)', {
        monitorType: 'http',
        url: 'https://www.google.com',
        method: 'GET'
    });

    await runner.runTest('HTTP - With status assertion (200)', {
        monitorType: 'http',
        url: 'https://httpbin.org/status/200',
        method: 'GET',
        assertions: [
            { type: 'status', condition: 'equals', value: 200 }
        ]
    });

    await runner.runTest('HTTP - Response time assertion', {
        monitorType: 'http',
        url: 'https://www.google.com',
        method: 'GET',
        assertions: [
            { type: 'responseTime', condition: 'lessThan', value: 5000 }
        ]
    });

    await runner.runTest('HTTP - Body contains assertion', {
        monitorType: 'http',
        url: 'https://httpbin.org/html',
        method: 'GET',
        assertions: [
            { type: 'body', condition: 'contains', value: 'html' }
        ]
    });

    await runner.runTest('HTTP - Header assertion', {
        monitorType: 'http',
        url: 'https://httpbin.org/headers',
        method: 'GET',
        assertions: [
            { type: 'header', condition: 'contains', value: 'application/json', property: 'content-type' }
        ]
    });

    await runner.runTest('HTTP - POST request', {
        monitorType: 'http',
        url: 'https://httpbin.org/post',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
    });

    await runner.runTest('HTTP - 404 response (should mark as down)', {
        monitorType: 'http',
        url: 'https://httpbin.org/status/404',
        method: 'GET'
    });

    await runner.runTest('HTTP - Timeout test (should timeout)', {
        monitorType: 'http',
        url: 'https://httpbin.org/delay/20',
        method: 'GET'
    });

    // ==================== GRAPHQL TESTS ====================
    console.log(`${colors.yellow}═══ GraphQL Monitoring Tests ═══${colors.reset}\n`);

    await runner.runTest('GraphQL - Basic query', {
        monitorType: 'graphql',
        url: 'https://countries.trevorblades.com/',
        query: '{ countries { code name } }'
    });

    await runner.runTest('GraphQL - Query with body assertion', {
        monitorType: 'graphql',
        url: 'https://countries.trevorblades.com/',
        query: '{ countries(filter: { code: { eq: "US" } }) { name } }',
        assertions: [
            { type: 'body', condition: 'contains', value: 'United States' }
        ]
    });

    // ==================== TCP TESTS ====================
    console.log(`${colors.yellow}═══ TCP Monitoring Tests ═══${colors.reset}\n`);

    await runner.runTest('TCP - Google HTTPS port', {
        monitorType: 'tcp',
        host: 'www.google.com',
        port: 443
    });

    await runner.runTest('TCP - Google HTTP port', {
        monitorType: 'tcp',
        host: 'www.google.com',
        port: 80
    });

    await runner.runTest('TCP - Connection timeout', {
        monitorType: 'tcp',
        host: '192.0.2.1', // Test network, should timeout
        port: 9999
    });

    await runner.runTest('TCP - With response time assertion', {
        monitorType: 'tcp',
        host: 'www.google.com',
        port: 443,
        assertions: [
            { type: 'responseTime', condition: 'lessThan', value: 3000 }
        ]
    });

    // ==================== DNS TESTS ====================
    console.log(`${colors.yellow}═══ DNS Monitoring Tests ═══${colors.reset}\n`);

    await runner.runTest('DNS - A record lookup', {
        monitorType: 'dns',
        host: 'google.com',
        dnsRecordType: 'A'
    });

    await runner.runTest('DNS - AAAA record lookup', {
        monitorType: 'dns',
        host: 'google.com',
        dnsRecordType: 'AAAA'
    });

    await runner.runTest('DNS - MX record lookup', {
        monitorType: 'dns',
        host: 'google.com',
        dnsRecordType: 'MX'
    });

    await runner.runTest('DNS - TXT record lookup', {
        monitorType: 'dns',
        host: 'google.com',
        dnsRecordType: 'TXT'
    });

    await runner.runTest('DNS - NS record lookup', {
        monitorType: 'dns',
        host: 'google.com',
        dnsRecordType: 'NS'
    });

    await runner.runTest('DNS - Invalid domain', {
        monitorType: 'dns',
        host: 'this-domain-definitely-does-not-exist-12345.com',
        dnsRecordType: 'A'
    });

    await runner.runTest('DNS - With response time assertion', {
        monitorType: 'dns',
        host: 'google.com',
        dnsRecordType: 'A',
        assertions: [
            { type: 'responseTime', condition: 'lessThan', value: 2000 }
        ]
    });

    // ==================== SSL TESTS ====================
    console.log(`${colors.yellow}═══ SSL Monitoring Tests ═══${colors.reset}\n`);

    await runner.runTest('SSL - Valid certificate (Google)', {
        monitorType: 'ssl',
        host: 'www.google.com',
        port: 443
    });

    await runner.runTest('SSL - Certificate expiry assertion', {
        monitorType: 'ssl',
        host: 'www.google.com',
        port: 443,
        assertions: [
            { type: 'certificateExpiry', condition: 'greaterThan', value: 7 }
        ]
    });

    await runner.runTest('SSL - Custom port', {
        monitorType: 'ssl',
        host: 'www.google.com',
        port: 443
    });

    await runner.runTest('SSL - Expired certificate (badssl.com)', {
        monitorType: 'ssl',
        host: 'expired.badssl.com',
        port: 443
    });

    // ==================== PING TESTS ====================
    console.log(`${colors.yellow}═══ Ping Monitoring Tests ═══${colors.reset}\n`);

    await runner.runTest('Ping - Google', {
        monitorType: 'ping',
        host: 'www.google.com'
    });

    await runner.runTest('Ping - Cloudflare DNS', {
        monitorType: 'ping',
        host: '1.1.1.1'
    });

    await runner.runTest('Ping - Unreachable host', {
        monitorType: 'ping',
        host: '192.0.2.1' // Test network
    });

    // ==================== EDGE CASES ====================
    console.log(`${colors.yellow}═══ Edge Case Tests ═══${colors.reset}\n`);

    await runner.runTest('Edge - Missing URL for HTTP (should error)', {
        monitorType: 'http',
        method: 'GET'
    } as any);

    await runner.runTest('Edge - Missing host for TCP (should error)', {
        monitorType: 'tcp',
        port: 80
    } as any);

    await runner.runTest('Edge - Invalid monitor type (should error)', {
        monitorType: 'invalid' as any,
        url: 'https://google.com'
    });

    await runner.runTest('Edge - Invalid URL format (should error)', {
        monitorType: 'http',
        url: 'not-a-valid-url',
        method: 'GET'
    });

    // Print summary
    const success = runner.printSummary();
    process.exit(success ? 0 : 1);
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error(`${colors.red}Fatal error:${colors.reset}`, error);
        process.exit(1);
    });
}

export { runAllTests, TestRunner };