import { Resend } from 'resend'
import { logger } from '../utils/logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAlert(emails: string[], url: string, results: any[]) {
    const emailSource = process.env.EMAIL_SOURCE || '';

    try {
        logger.info(`emailService: Sending alert email to: ${emails.join(', ')}`);
        // const { data, error } = await resend.emails.send({
        //     from: emailSource,
        //     to: emails,
        //     subject: `🚨Alert: ${url} is down`,
        //     text: `The website ${url} is down. Results: ${JSON.stringify(results)}`
        // })

        const error = null;
        const data = { id: 'mock-email-id' };
        console.log('Pretending to send email alert...');

        if (error) {
            logger.error('emailService: Error sending email alert:', error);
        } else {
            logger.info(`emailService: Alert sent to ${emails.join(', ')}. Message ID: ${data?.id}`);
        }
    } catch (error) {
        logger.error('emailService: Error sending email alert:', error);
    }
}