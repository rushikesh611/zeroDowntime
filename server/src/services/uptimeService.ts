import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { logger } from '../utils/logger';


export async function checkWebsiteUptime(url: string, regions: string[]) {
    logger.info('Starting uptime check', {
        url,
        regions,
        action: 'UPTIME_CHECK_START'
    });
    const results = await Promise.all(regions.map(region => checkFromRegion(url, region)));
    logger.info('Completed uptime check', {
        url,
        results,
        action: 'UPTIME_CHECK_COMPLETE'
    });
    return results;
}

async function checkFromRegion(url: string, region: string) {
    const lambda = new LambdaClient({
        region,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
    });

    const params = {
        FunctionName: 'checkWebsiteUptime',
        Payload: Buffer.from(JSON.stringify({ url }))
    };

    try {
        logger.info('Invoking lambda function', {
            region,
            action: 'LAMBDA_INVOKE_START'
        });
        const command = new InvokeCommand(params);
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
    } catch (error : any) {
        logger.error('Lambda function failed', {
            region,
            error: error.message || 'Unknown error',
            action: 'LAMBDA_INVOKE_ERROR'
        });
        return { region, error: 'Failed to check uptime' };
    }
}