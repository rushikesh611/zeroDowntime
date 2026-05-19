import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { logger } from '../utils/logger.js';

interface MonitorCheckParams {
    url?: string;
    monitorType: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    assertions?: any[];
    host?: string;
    port?: number;
    query?: string;
}

export async function checkEndpoint(params: MonitorCheckParams, regions: string[]) {
    console.log(params)
    const supportedTypes = ['http', 'tcp', 'dns', 'ssl', 'ping', 'graphql'];
    if (supportedTypes.includes(params.monitorType)) {
        const target = params.url || (params.host ? `${params.host}:${params.port || ''}` : 'Unknown');
        logger.info(`${params.monitorType.toUpperCase()}_CHECK_START`, {
            target,
            monitorType: params.monitorType,
            regions
        });
        console.log(`Checking ${params.monitorType.toUpperCase()} endpoint:`, target, 'in regions:', regions);

        const results = await Promise.all(regions.map(region => checkFromRegion(params, region)));

        logger.info(`${params.monitorType.toUpperCase()}_CHECK_COMPLETE`, {
            target,
            results
        });

        return results;
    }

    return [];
}

async function checkFromRegion(params: MonitorCheckParams, region: string) {
    const lambda = new LambdaClient({
        region,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
    });

    const functionName = 'zd-check-http-endpoint';
    const lambdaParams = {
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify(params))
    };

    try {
        logger.info(`LAMBDA_INVOKE_START`, {
            type: params.monitorType,
            region,
            url: params.url,
            method: params.method,
            headers: params.headers,
            body: params.body,
            assertions: params.assertions,
            host: params.host,
            port: params.port,
            query: params.query
        });

        const command = new InvokeCommand(lambdaParams);
        const response = await lambda.send(command);

        // Convert Uint8Array to string and parse JSON
        const result = JSON.parse(
            new TextDecoder().decode(response.Payload)
        );

        logger.info('LAMBDA_INVOKE_SUCCESS', {
            region,
            status: result.statusCode,
            responseTime: result.responseTime,
            isUp: result.isUp
        });

        return { region, ...result };
    } catch (error: any) {
        logger.error('LAMBDA_INVOKE_ERROR', {
            region,
            error: error.message || 'Unknown error',
        });
        return { region, error: `Failed to check ${params.monitorType} endpoint` };
    }
}