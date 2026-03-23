import Stripe from 'stripe';
import paypal from 'paypal-rest-sdk';
import crypto from 'crypto';
import { WebhookEvent } from '../types';
import { logger } from '../utils/logger';
import { SubscriptionService } from './subscriptionService';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export class WebhookService {
  static async verifyStripeWebhook(signature: string, payload: string): Promise<boolean> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      return stripe.webhooks.constructEvent(payload, signature, webhookSecret) !== null;
    } catch (error) {
      logger.error('Stripe webhook verification failed', error);
      return false;
    }
  }

  static async verifyPayPalWebhook(headers: any, body: string): Promise<boolean> {
    try {
      const webhookId = headers['paypal-auth-algo'];
      const authAlgo = headers['paypal-transmission-id'];
      const certId = headers['paypal-cert-id'];
      const transmissionSig = headers['paypal-transmission-sig'];
      const timestamp = headers['paypal-transmission-time'];
      const webhookUrl = process.env.PAYPAL_WEBHOOK_URL;

      if (!webhookId || !authAlgo || !certId || !transmissionSig || !timestamp || !webhookUrl) {
        return false;
      }

      // Get PayPal certificate
      const cert = await this.getPayPalCertificate(certId);
      if (!cert) {
        return false;
      }

      // Construct verification string
      const verificationString = [
        authAlgo,
        transmissionSig,
        timestamp,
        webhookId,
        crypto.createHash('sha256').update(body).digest('hex'),
      ].join('|');

      // Verify signature
      const publicKey = crypto.createPublicKey(cert as string);
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(verificationString);
      return verify.verify(publicKey, transmissionSig, 'base64');
    } catch (error) {
      logger.error('PayPal webhook verification failed', error);
      return false;
    }
  }

  private static async getPayPalCertificate(certId: string): Promise<string | null> {
    try {
      // This is a simplified version - in production, you'd want to cache this
      const response = await fetch(`https://api.paypal.com/v1/notifications/certificates/${certId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getPayPalAccessToken()}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const cert = await response.json() as { certificate: string };
      return cert.certificate;
    } catch (error) {
      logger.error('Failed to get PayPal certificate', error);
      return null;
    }
  }

  private static async getPayPalAccessToken(): Promise<string> {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch('https://api.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json() as { access_token: string };
    return data.access_token;
  }

  static async handleStripeWebhook(event: any): Promise<void> {
    try {
      logger.info('Processing Stripe webhook', {
        type: event.type,
        id: event.id,
      });

      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleStripeSubscriptionCreated(event);
          break;
        case 'customer.subscription.updated':
          await this.handleStripeSubscriptionUpdated(event);
          break;
        case 'customer.subscription.deleted':
          await this.handleStripeSubscriptionDeleted(event);
          break;
        case 'invoice.payment_succeeded':
          await this.handleStripePaymentSucceeded(event);
          break;
        case 'invoice.payment_failed':
          await this.handleStripePaymentFailed(event);
          break;
        case 'payment_intent.succeeded':
          await this.handleStripePaymentIntentSucceeded(event);
          break;
        case 'payment_intent.payment_failed':
          await this.handleStripePaymentIntentFailed(event);
          break;
        default:
          logger.info('Unhandled Stripe webhook event', { type: event.type });
      }

      logger.info('Stripe webhook processed successfully', {
        type: event.type,
        id: event.id,
      });
    } catch (error) {
      logger.error('Error processing Stripe webhook', error);
      throw error;
    }
  }

  static async handlePayPalWebhook(event: any): Promise<void> {
    try {
      logger.info('Processing PayPal webhook', {
        eventType: event.event_type,
        id: event.id,
      });

      switch (event.event_type) {
        case 'BILLING.SUBSCRIPTION.CREATED':
          await this.handlePayPalSubscriptionCreated(event);
          break;
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          await this.handlePayPalSubscriptionActivated(event);
          break;
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await this.handlePayPalSubscriptionCancelled(event);
          break;
        case 'PAYMENT.SALE.COMPLETED':
          await this.handlePayPalPaymentCompleted(event);
          break;
        case 'PAYMENT.SALE.DENIED':
          await this.handlePayPalPaymentDenied(event);
          break;
        default:
          logger.info('Unhandled PayPal webhook event', { eventType: event.event_type });
      }

      logger.info('PayPal webhook processed successfully', {
        eventType: event.event_type,
        id: event.id,
      });
    } catch (error) {
      logger.error('Error processing PayPal webhook', error);
      throw error;
    }
  }

  private static async handleStripeSubscriptionCreated(event: any) {
    const subscription = event.data.object;
    
    // TODO: Update database with new subscription
    logger.info('Stripe subscription created', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
    });
  }

  private static async handleStripeSubscriptionUpdated(event: any) {
    const subscription = event.data.object;
    
    // TODO: Update subscription in database
    logger.info('Stripe subscription updated', {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
    });
  }

  private static async handleStripeSubscriptionDeleted(event: any) {
    const subscription = event.data.object;
    
    // TODO: Update subscription status in database
    logger.info('Stripe subscription deleted', {
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  }

  private static async handleStripePaymentSucceeded(event: any) {
    const invoice = event.data.object;
    
    // TODO: Record payment in database
    logger.info('Stripe payment succeeded', {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_paid,
      currency: invoice.currency,
    });
  }

  private static async handleStripePaymentFailed(event: any) {
    const invoice = event.data.object;
    
    // TODO: Update payment status in database
    logger.info('Stripe payment failed', {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_due,
      currency: invoice.currency,
    });
  }

  private static async handleStripePaymentIntentSucceeded(event: any) {
    const paymentIntent = event.data.object;
    
    // TODO: Record one-time payment in database
    logger.info('Stripe payment intent succeeded', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  }

  private static async handleStripePaymentIntentFailed(event: any) {
    const paymentIntent = event.data.object;
    
    // TODO: Update payment status in database
    logger.info('Stripe payment intent failed', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  }

  private static async handlePayPalSubscriptionCreated(event: any) {
    const subscription = event.resource;
    
    // TODO: Update database with new subscription
    logger.info('PayPal subscription created', {
      subscriptionId: subscription.id,
      planId: subscription.plan_id,
      status: subscription.status,
    });
  }

  private static async handlePayPalSubscriptionActivated(event: any) {
    const subscription = event.resource;
    
    // TODO: Update subscription status in database
    logger.info('PayPal subscription activated', {
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  }

  private static async handlePayPalSubscriptionCancelled(event: any) {
    const subscription = event.resource;
    
    // TODO: Update subscription status in database
    logger.info('PayPal subscription cancelled', {
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  }

  private static async handlePayPalPaymentCompleted(event: any) {
    const sale = event.resource;
    
    // TODO: Record payment in database
    logger.info('PayPal payment completed', {
      saleId: sale.id,
      subscriptionId: sale.billing_agreement_id,
      amount: sale.amount.total,
      currency: sale.amount.currency,
    });
  }

  private static async handlePayPalPaymentDenied(event: any) {
    const sale = event.resource;
    
    // TODO: Update payment status in database
    logger.info('PayPal payment denied', {
      saleId: sale.id,
      amount: sale.amount.total,
      currency: sale.amount.currency,
    });
  }

  static async saveWebhookEvent(webhookData: Partial<WebhookEvent>): Promise<void> {
    try {
      // TODO: Save webhook event to database for retry logic
      logger.info('Webhook event saved', {
        id: webhookData.id,
        type: webhookData.type,
        source: webhookData.source,
      });
    } catch (error) {
      logger.error('Failed to save webhook event', error);
    }
  }
}
