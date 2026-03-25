import Stripe from 'stripe';
import paypal from 'paypal-rest-sdk';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { createAuthError, createValidationError } from '../middleware/errorHandler';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Configure PayPal
paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID!,
  client_secret: process.env.PAYPAL_CLIENT_SECRET!,
});

export interface CreateSubscriptionData {
  userId: string;
  planId: string;
  paymentMethodId?: string;
  provider: 'stripe' | 'paypal';
  trialPeriodDays?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId?: string;
  paypalPlanId?: string;
}

// Predefined subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic-monthly',
    name: 'Basic Plan',
    description: 'Perfect for individuals getting started',
    price: 999, // $9.99 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Up to 100 transactions/month',
      'Basic analytics',
      'Email support',
      'Mobile app access'
    ],
  },
  {
    id: 'pro-monthly',
    name: 'Pro Plan',
    description: 'For growing businesses and power users',
    price: 2999, // $29.99 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited transactions',
      'Advanced analytics',
      'Priority email support',
      'API access',
      'Custom integrations'
    ],
  },
  {
    id: 'basic-yearly',
    name: 'Basic Plan (Yearly)',
    description: 'Basic plan with 20% discount',
    price: 9590, // $95.90 in cents (20% discount)
    currency: 'usd',
    interval: 'year',
    features: [
      'Up to 100 transactions/month',
      'Basic analytics',
      'Email support',
      'Mobile app access'
    ],
  },
  {
    id: 'pro-yearly',
    name: 'Pro Plan (Yearly)',
    description: 'Pro plan with 20% discount',
    price: 28790, // $287.90 in cents (20% discount)
    currency: 'usd',
    interval: 'year',
    features: [
      'Unlimited transactions',
      'Advanced analytics',
      'Priority email support',
      'API access',
      'Custom integrations'
    ],
  },
];

export class SubscriptionService {
  static async getPlans(): Promise<SubscriptionPlan[]> {
    return SUBSCRIPTION_PLANS;
  }

  static async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === planId) || null;
  }

  static async createSubscription(data: CreateSubscriptionData) {
    const user = await User.findById(data.userId);
    if (!user) {
      throw createAuthError('User not found');
    }

    const plan = await this.getPlanById(data.planId);
    if (!plan) {
      throw createValidationError('Invalid plan ID');
    }

    try {
      if (data.provider === 'stripe') {
        return await this.createStripeSubscription(data);
      } else if (data.provider === 'paypal') {
        return await this.createPayPalSubscription(data);
      } else {
        throw createValidationError('Invalid payment provider');
      }
    } catch (error) {
      logger.error('Subscription creation failed', error);
      throw new Error('Failed to create subscription');
    }
  }

  static async updateSubscription(subscriptionId: string, updates: any) {
    try {
      if (updates.cancel_at_period_end !== undefined) {
        return await this.cancelStripeSubscription(subscriptionId);
      }
      
      const plan = await this.getPlanById(updates.planId);
      if (!plan) {
        throw createValidationError('Invalid plan ID');
      }

      return await this.updateStripeSubscription(subscriptionId, updates.planId);
    } catch (error) {
      logger.error('Subscription update failed', error);
      throw new Error('Failed to update subscription');
    }
  }

  static async cancelSubscription(provider: string, subscriptionId: string) {
    try {
      if (provider === 'stripe') {
        return await this.cancelStripeSubscription(subscriptionId);
      } else if (provider === 'paypal') {
        return await this.cancelPayPalSubscription(subscriptionId);
      } else {
        throw createValidationError('Invalid payment provider');
      }
    } catch (error) {
      logger.error('Subscription cancellation failed', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  static async createPayPalSubscription(data: CreateSubscriptionData) {
    const user = await User.findById(data.userId);
    if (!user) {
      throw createAuthError('User not found');
    }

    const plan = await this.getPlanById(data.planId);
    if (!plan) {
      throw createValidationError('Invalid plan ID');
    }

    try {
      // Create PayPal subscription
      const subscriptionData = {
        plan_id: plan.paypalPlanId || data.planId,
        subscriber: {
          name: {
            given_name: user.firstName,
            surname: user.lastName,
          },
          email_address: user.email,
        },
        application_context: {
          brand_name: 'Fintech Payment Platform',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
          },
          return_url: `${process.env.FRONTEND_URL}/subscription/success`,
          cancel_url: `${process.env.FRONTEND_URL}/subscription/cancelled`,
        },
      };

      const subscription = await paypal.subscription.create(subscriptionData);

      logger.info('PayPal subscription created', {
        userId: user._id,
        subscriptionId: subscription.id,
        planId: data.planId,
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        approvalUrl: subscription.links?.find(link => link.rel === 'approve')?.href,
      };
    } catch (error) {
      logger.error('PayPal subscription creation failed', error);
      throw new Error('Failed to create PayPal subscription');
    }
  }

  static async cancelStripeSubscription(subscriptionId: string) {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId, {
        at_period_end: true, // Cancel at end of period
      });

      logger.info('Stripe subscription cancelled', {
        subscriptionId,
        status: subscription.status,
      });

      return {
        success: true,
        status: subscription.status,
        canceledAt: subscription.canceled_at,
        periodEnd: subscription.current_period_end,
      };
    } catch (error) {
      logger.error('Stripe subscription cancellation failed', error);
      throw new Error('Failed to cancel Stripe subscription');
    }
  }

  static async cancelPayPalSubscription(subscriptionId: string) {
    try {
      const subscription = await paypal.subscription.cancel(subscriptionId, {
        reason: 'Customer requested cancellation',
      });

      logger.info('PayPal subscription cancelled', {
        subscriptionId,
        status: subscription.status,
      });

      return {
        success: true,
        status: subscription.status,
      };
    } catch (error) {
      logger.error('PayPal subscription cancellation failed', error);
      throw new Error('Failed to cancel PayPal subscription');
    }
  }

  static async updateStripeSubscription(subscriptionId: string, planId: string) {
    try {
      const plan = await this.getPlanById(planId);
      if (!plan) {
        throw createValidationError('Invalid plan ID');
      }

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
          price: plan.stripePriceId || planId,
        }],
        proration_behavior: 'create_prorations',
      });

      logger.info('Stripe subscription updated', {
        subscriptionId,
        newPlanId: planId,
      });

      return {
        success: true,
        subscription,
      };
    } catch (error) {
      logger.error('Stripe subscription update failed', error);
      throw new Error('Failed to update Stripe subscription');
    }
  }

  static async getStripeSubscription(subscriptionId: string) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice.payment_intent'],
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to retrieve Stripe subscription', error);
      throw new Error('Failed to retrieve subscription');
    }
  }

  static async getPayPalSubscription(subscriptionId: string) {
    try {
      const subscription = await paypal.subscription.get(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Failed to retrieve PayPal subscription', error);
      throw new Error('Failed to retrieve subscription');
    }
  }

  static async createStripePaymentIntent(amount: number, currency: string = 'usd', customerId?: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      logger.error('Stripe payment intent creation failed', error);
      throw new Error('Failed to create payment intent');
    }
  }

  static async createPayPalOrder(amount: number, currency: string = 'USD') {
    try {
      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
        }],
        application_context: {
          brand_name: 'Fintech Payment Platform',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancelled`,
        },
      };

      const order = await paypal.order.create(orderData);

      return {
        success: true,
        orderId: order.id,
        approvalUrl: order.links?.find(link => link.rel === 'approve')?.href,
      };
    } catch (error) {
      logger.error('PayPal order creation failed', error);
      throw new Error('Failed to create PayPal order');
    }
  }

  static async capturePayPalOrder(orderId: string) {
    try {
      const captureData = {};
      const order = await paypal.order.capture(orderId, captureData);

      logger.info('PayPal order captured', {
        orderId,
        status: order.status,
      });

      return {
        success: true,
        order,
      };
    } catch (error) {
      logger.error('PayPal order capture failed', error);
      throw new Error('Failed to capture PayPal order');
    }
  }
}
