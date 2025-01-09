import { Resend } from 'resend'
import { logger } from '../utils/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAlert(emails: string[], url: string, results: any[]) {
    const emailSource = process.env.EMAIL_SOURCE || '';

    try {
        const { data, error } = await resend.emails.send({
            from: emailSource,
            to: emails,
            subject: `🚨Alert: ${url} is down`,
            text: `The website ${url} is down. Results: ${JSON.stringify(results)}`
        })

        if (error) {
            logger.error('Error sending email alert:', error);
        } else {
            logger.info(`Alert sent to ${emails.join(', ')}. Message ID: ${data?.id}`);
        }
    } catch (error) {
        logger.error('Error sending email alert:', error);
    }
}