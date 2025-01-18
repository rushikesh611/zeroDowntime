import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { logger } from '../utils/logger';


export async function checkWebsiteUptime(url: string, regions: string[]) {
    logger.info(`Checking uptime for ${url} from regions:`, regions);
    const results = await Promise.all(regions.map(region => checkFromRegion(url, region)));
    logger.info(`Uptime check results for ${url}:`, results);
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
        logger.info('invoking lambda with params:', params);
        const command = new InvokeCommand(params);
        const response = await lambda.send(command);
        
        // Convert Uint8Array to string and parse JSON
        const result = JSON.parse(
            new TextDecoder().decode(response.Payload)
        );
        
        logger.info(`Uptime check from ${region}:`, result);
        return { region, ...result };
    } catch (error) {
        logger.error(`Error checking uptime from ${region}:`, error);
        return { region, error: 'Failed to check uptime' };
    }
}