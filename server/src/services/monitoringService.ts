import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { logger } from '../utils/logger';

interface MonitorCheckParams {
    url: string;
    type: 'http';
    method: string;
    headers?: Record<string, string>;
    body?: string;
}

export async function checkEndpoint(params: MonitorCheckParams, regions: string[]) {
    logger.info('Starting HTTP check', {
        url: params.url,
        method: params.method,
        regions,
        action: 'HTTP_CHECK_START'
    });

    const results = await Promise.all(regions.map(region => checkFromRegion(params, region)));

    logger.info('Completed HTTP check', {
        url: params.url,
        results,
        action: 'HTTP_CHECK_COMPLETE'
    });

    return results;
}

async function checkFromRegion(params: MonitorCheckParams, region: string) {
    const lambda = new LambdaClient({
        region,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
    });

    // We now use a single Lambda function for all HTTP monitoring
    const functionName = 'checkEndpoint';
    const lambdaParams = {
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify(params))
    };

    try {
        logger.info(`Invoking lambda function for ${params.type} check`, {
            region,
            url: params.url,
            method: params.method,
            action: 'LAMBDA_INVOKE_START'
        });

        const command = new InvokeCommand(lambdaParams);
        const response = await lambda.send(command);
        
        // Convert Uint8Array to string and parse JSON
        const result = JSON.parse(
            new TextDecoder().decode(response.Payload)
        );

        logger.info('Lambda function response', {
            region,
            status: result.statusCode,
            responseTime: result.responseTime,
            isUp: result.isUp,
            action: 'LAMBDA_INVOKE_SUCCESS'
        });
        
        return { region, ...result };
    } catch (error: any) {
        logger.error('Lambda function failed', {
            region,
            error: error.message || 'Unknown error',
            action: 'LAMBDA_INVOKE_ERROR'
        });
        return { region, error: `Failed to check ${params.type} endpoint` };
    }
}