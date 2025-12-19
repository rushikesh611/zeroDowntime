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
}

export async function checkEndpoint(params: MonitorCheckParams, regions: string[]) {
    console.log(params)
    if (params.monitorType === 'http') {

        logger.info("HTTP_CHECK_START", {
            url: params.url,
            method: params.method,
            regions
        });
        console.log('Checking endpoint:', params.url, 'in regions:', regions);

        const results = await Promise.all(regions.map(region => checkFromRegion(params, region)));

        logger.info('HTTP_CHECK_COMPLETE', {
            url: params.url,
            results
        });

        return results;
    } else if (params.monitorType === 'tcp') {
        logger.info("TCP_CHECK_START", {
            host: params.host,
            port: params.port,
            regions
        });
        console.log('Checking endpoint:', params.host + ':' + params.port, 'in regions:', regions);

        const results = await Promise.all(regions.map(region => checkFromRegion(params, region)));

        logger.info('TCP_CHECK_COMPLETE', {
            host: params.host + ':' + params.port,
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
            port: params.port
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