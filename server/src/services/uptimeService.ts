import AWS from 'aws-sdk';
import { logger } from '../utils/logger';

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

// const regions = ['us-east-1', 'eu-west-1', 'ap-south-1'];

export async function checkWebsiteUptime(url: string, regions: string[]) {
    logger.info(`Checking uptime for ${url} from regions:`, regions)
    const results = await Promise.all(regions.map(region => checkFromRegion(url, region)))
    logger.info(`Uptime check results for ${url}:`, results)
    return results;
}

async function checkFromRegion(url: string, region: string) {
    const lambda = new AWS.Lambda({ region })

    const params = {
        FunctionName: 'checkWebsiteUptime',
        Payload: JSON.stringify({ url })
    }

    try {
        logger.info('invoking lambda with params:', params)
        const response = await lambda.invoke(params).promise()
        const result = JSON.parse(response.Payload as string)
        logger.info(`Uptime check from ${region}:`, result)
        return { region, ...result }
    } catch (error) {
        logger.error(`Error checking uptime from ${region}:`, error);
        return { region, error: 'Failed to check uptime' };
    }
}