import { logger } from "@repo/logger";

interface NotificationData {
  to: string;
  subject: string;
  body: string;
}

class NotificationService {
  /**
   * Send an email notification.
   * In production, this would integrate with SendGrid, Resend, SES, etc.
   * Currently logs to console and stores in DB for demo purposes.
   */
  public async sendEmail(data: NotificationData): Promise<boolean> {
    // Log the notification
    logger.info(`[Notification] Email to: ${data.to}`);
    logger.info(`[Notification] Subject: ${data.subject}`);
    logger.info(`[Notification] Body: ${data.body.substring(0, 200)}...`);

    // In production, integrate with an email provider:
    // await resend.emails.send({ from: 'noreply@formflow.dev', ...data });

    return true;
  }

  /**
   * Notify the form creator that a new response was submitted.
   */
  public async notifyNewResponse(params: {
    creatorEmail: string;
    creatorName: string;
    formTitle: string;
    formSlug: string;
    respondentName?: string | null;
    responseId: string;
  }): Promise<void> {
    const formUrl = `${process.env.BASE_URL || "http://localhost:8000"}/forms/${params.formSlug}`;
    const dashboardUrl = `${process.env.BASE_URL || "http://localhost:8000"}/dashboard`;

    await this.sendEmail({
      to: params.creatorEmail,
      subject: `📝 New Response: ${params.formTitle}`,
      body: [
        `Hi ${params.creatorName},`,
        ``,
        `Your form "${params.formTitle}" just received a new response!`,
        params.respondentName
          ? `Respondent: ${params.respondentName}`
          : `A new anonymous response was submitted.`,
        ``,
        `View all responses: ${dashboardUrl}`,
        `Form link: ${formUrl}`,
        ``,
        `— FormFlow`,
      ].join("\n"),
    });
  }

  /**
   * Notify a respondent that their submission was received.
   */
  public async notifyRespondent(params: {
    respondentEmail: string;
    respondentName?: string | null;
    formTitle: string;
  }): Promise<void> {
    await this.sendEmail({
      to: params.respondentEmail,
      subject: `✅ Response Received: ${params.formTitle}`,
      body: [
        params.respondentName ? `Hi ${params.respondentName},` : `Hi there,`,
        ``,
        `Thank you for submitting your response to "${params.formTitle}".`,
        `We appreciate your time and feedback!`,
        ``,
        `— FormFlow`,
      ].join("\n"),
    });
  }
}

export default NotificationService;
