import AWS from 'aws-sdk'

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

const regions = ['us-east-1', 'eu-west-1', 'ap-south-1'];

export async function checkWebsiteUptime(url: string) {
    const results = await Promise.all(regions.map(region => checkFromRegion(url, region)))
    return results;
}

async function checkFromRegion(url: string, region: string) {
    const lambda = new AWS.Lambda({ region })

    const params = {
        FunctionName: 'checkWebsiteUptime',
        Payload: JSON.stringify({ url })
    }

    try {
        const response = await lambda.invoke(params).promise()
        const result = JSON.parse(response.Payload as string)
        return { region, ...result }
    } catch (error) {
        console.error(`Error checking uptime from ${region}:`, error);
        return { region, error: 'Failed to check uptime' };
    }
}