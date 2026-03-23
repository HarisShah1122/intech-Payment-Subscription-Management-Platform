import { EmailOptions } from '../types';
import { logger } from '../utils/logger';

export class EmailService {
  private static readonly fromEmail = process.env.SMTP_USER || 'noreply@fintech-platform.com';
  private static readonly fromName = 'Fintech Payment Platform';

  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // TODO: Implement actual email sending using nodemailer or sendgrid
      // For now, just log the email
      logger.info('Email would be sent', {
        to: options.to,
        subject: options.subject,
        template: options.template,
      });

      // Example implementation with nodemailer (would need to install nodemailer):
      /*
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      await transporter.sendMail(mailOptions);
      */

      return true;
    } catch (error) {
      logger.error('Failed to send email', error);
      return false;
    }
  }

  static async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      data: {
        verificationUrl,
        userEmail: email,
      },
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to Fintech Payment Platform!</h2>
          <p style="color: #666; line-height: 1.6;">Thank you for signing up. Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Best regards,<br>
            Fintech Payment Platform Team
          </p>
        </div>
      `,
    });
  }

  static async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      data: {
        resetUrl,
        userEmail: email,
      },
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
          <p style="color: #666; line-height: 1.6;">We received a request to reset your password. Click the button below to reset it.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Best regards,<br>
            Fintech Payment Platform Team
          </p>
        </div>
      `,
    });
  }

  static async sendSubscriptionConfirmationEmail(email: string, planName: string, amount: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Subscription Confirmation',
      template: 'subscription-confirmation',
      data: {
        planName,
        amount,
        userEmail: email,
      },
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #28a745; margin-bottom: 20px;">Subscription Confirmed!</h2>
          <p style="color: #666; line-height: 1.6;">Thank you for subscribing to our <strong>${planName}</strong>.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #333;">
              <strong>Plan:</strong> ${planName}<br>
              <strong>Amount:</strong> ${amount}<br>
              <strong>Status:</strong> <span style="color: #28a745;">Active</span>
            </p>
          </div>
          <p style="color: #666; line-height: 1.6;">You can manage your subscription from your dashboard.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Best regards,<br>
            Fintech Payment Platform Team
          </p>
        </div>
      `,
    });
  }

  static async sendSubscriptionCancelledEmail(email: string, planName: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Subscription Cancelled',
      template: 'subscription-cancelled',
      data: {
        planName,
        userEmail: email,
      },
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #dc3545; margin-bottom: 20px;">Subscription Cancelled</h2>
          <p style="color: #666; line-height: 1.6;">Your subscription to <strong>${planName}</strong> has been cancelled.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #333;">
              <strong>Plan:</strong> ${planName}<br>
              <strong>Status:</strong> <span style="color: #dc3545;">Cancelled</span><br>
              <strong>Access Until:</strong> End of current billing period
            </p>
          </div>
          <p style="color: #666; line-height: 1.6;">We're sorry to see you go! You can resubscribe at any time from your dashboard.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Best regards,<br>
            Fintech Payment Platform Team
          </p>
        </div>
      `,
    });
  }

  static async sendPaymentFailedEmail(email: string, amount: string, errorMessage?: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Payment Failed',
      template: 'payment-failed',
      data: {
        amount,
        errorMessage,
        userEmail: email,
      },
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #dc3545; margin-bottom: 20px;">Payment Failed</h2>
          <p style="color: #666; line-height: 1.6;">We were unable to process your payment of <strong>${amount}</strong>.</p>
          ${errorMessage ? `<p style="color: #666; line-height: 1.6;"><strong>Reason:</strong> ${errorMessage}</p>` : ''}
          <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24;">
              <strong>What to do:</strong><br>
              1. Check your payment method details<br>
              2. Ensure sufficient funds are available<br>
              3. Try the payment again or use a different payment method
            </p>
          </div>
          <p style="color: #666; line-height: 1.6;">You can update your payment method from your dashboard.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Best regards,<br>
            Fintech Payment Platform Team
          </p>
        </div>
      `,
    });
  }

  static async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Fintech Payment Platform!',
      template: 'welcome',
      data: {
        firstName,
        userEmail: email,
      },
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #007bff; margin-bottom: 20px;">Welcome to Fintech Payment Platform!</h2>
          <p style="color: #666; line-height: 1.6;">Hi ${firstName},</p>
          <p style="color: #666; line-height: 1.6;">Thank you for joining our platform! We're excited to help you manage your payments and subscriptions.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Getting Started:</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>Complete your profile setup</li>
              <li>Add a payment method</li>
              <li>Choose a subscription plan</li>
              <li>Explore our features</li>
            </ul>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Best regards,<br>
            Fintech Payment Platform Team
          </p>
        </div>
      `,
    });
  }
}
