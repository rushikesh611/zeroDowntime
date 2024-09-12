import AWS from 'aws-sdk'

const ses = new AWS.SES({ region: 'eu-west-1' })

// TODO: Implement verifyEmailIdentity check for ses as it requires a verified email address to send emails

export async function sendAlert(emails: string[], url: string, results: any[]){
    const emailSource = process.env.EMAIL_SOURCE || '';
    const params = {
        Destination: {
            ToAddresses: emails
        },
        Message: {
            Body:{
                Text: {
                    Data: `The website ${url} is down. Results: ${JSON.stringify(results)}`
                }
            },
            Subject: {
                Data: `Alert: ${url} is down`
            }
        },
        Source: emailSource
    }

    try {
        await ses.sendEmail(params).promise();
        console.log(`Alert sent to ${emails.join(', ')}`);
      } catch (error) {
        console.error('Error sending email:', error);
      }
}