import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Subscription } from '../models/Subscription';
import { Transaction } from '../models/Transaction';
import { PaymentMethod } from '../models/PaymentMethod';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { 
  asyncHandler, 
  createValidationError, 
  createAuthError, 
  createNotFoundError 
} from '../middleware/errorHandler';
import { SubscriptionService } from '../services/subscriptionService';
import { logger } from '../utils/logger';
import { SubscriptionQuery } from '../types';

export const getPlans = asyncHandler(async (req: any, res: Response) => {
  const plans = SubscriptionService.getPlans();
  
  res.json({
    success: true,
    data: plans,
  });
});

export const getUserSubscriptions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const subscriptions = await Subscription.findByUserId(userId.toString())
    .populate('userId', 'email firstName lastName');

  res.json({
    success: true,
    data: subscriptions,
  });
});

export const getActiveSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const activeSubscription = await Subscription.findActiveByUserId(userId.toString())
    .populate('userId', 'email firstName lastName');

  if (!activeSubscription) {
    return res.json({
      success: true,
      data: null,
      message: 'No active subscription found',
    });
  }

  res.json({
    success: true,
    data: activeSubscription,
  });
});

export const createSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError(errors.array()[0].msg);
  }

  const { planId, paymentMethodId, provider, trialPeriodDays } = req.body;
  const userId = req.user!._id;

  // Check if user already has active subscription
  const existingSubscription = await Subscription.findActiveByUserId(userId.toString());
  if (existingSubscription) {
    throw createValidationError('User already has an active subscription');
  }

  // Validate plan
  const plan = SubscriptionService.getPlanById(planId);
  if (!plan) {
    throw createValidationError('Invalid plan ID');
  }

  // Get payment method if provided
  let paymentMethod;
  if (paymentMethodId) {
    paymentMethod = await PaymentMethod.findOne({ 
      _id: paymentMethodId, 
      userId 
    });
    if (!paymentMethod) {
      throw createValidationError('Payment method not found');
    }
  }

  try {
    // Create subscription with provider
    const result = await SubscriptionService.createSubscription({
      userId: userId.toString(),
      planId,
      paymentMethodId,
      provider,
      trialPeriodDays,
    });

    logger.info('Subscription created', {
      userId,
      planId,
      provider,
      subscriptionId: result.subscriptionId,
    });

    res.json({
      success: true,
      message: 'Subscription created successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Failed to create subscription', error);
    throw new Error('Failed to create subscription');
  }
});

export const updateSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError(errors.array()[0].msg);
  }

  const { subscriptionId } = req.params;
  const { planId } = req.body;
  const userId = req.user!._id;

  // Find subscription
  const subscription = await Subscription.findOne({
    _id: subscriptionId,
    userId,
  });

  if (!subscription) {
    throw createNotFoundError('Subscription not found');
  }

  if (!subscription.isActive()) {
    throw createValidationError('Cannot update inactive subscription');
  }

  try {
    const result = await SubscriptionService.updateSubscription(
      subscription.providerSubscriptionId,
      planId
    );

    // Update local subscription
    const plan = SubscriptionService.getPlanById(planId);
    if (plan) {
      subscription.planId = planId;
      subscription.planName = plan.name;
      subscription.amount = plan.price;
      await subscription.save();
    }

    logger.info('Subscription updated', {
      userId,
      subscriptionId,
      newPlanId: planId,
    });

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Failed to update subscription', error);
    throw new Error('Failed to update subscription');
  }
});

export const cancelSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { subscriptionId } = req.params;
  const { immediate } = req.body;
  const userId = req.user!._id;

  // Find subscription
  const subscription = await Subscription.findOne({
    _id: subscriptionId,
    userId,
  });

  if (!subscription) {
    throw createNotFoundError('Subscription not found');
  }

  if (subscription.status === 'canceled') {
    throw createValidationError('Subscription is already canceled');
  }

  try {
    if (immediate) {
      // Immediate cancellation
      await SubscriptionService.cancelSubscription(
        subscription.provider,
        subscription.providerSubscriptionId
      );
      
      subscription.status = 'canceled';
      subscription.endedAt = new Date();
      await subscription.save();
    } else {
      // Cancel at period end
      await SubscriptionService.updateSubscription(
        subscription.providerSubscriptionId,
        { cancel_at_period_end: true }
      );
      
      subscription.cancelAtPeriodEnd = true;
      await subscription.save();
    }

    logger.info('Subscription canceled', {
      userId,
      subscriptionId,
      immediate,
    });

    res.json({
      success: true,
      message: immediate ? 'Subscription canceled immediately' : 'Subscription will be canceled at period end',
      data: {
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    });
  } catch (error) {
    logger.error('Failed to cancel subscription', error);
    throw new Error('Failed to cancel subscription');
  }
});

export const getSubscriptionTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { subscriptionId } = req.params;
  const userId = req.user!._id;

  // Verify subscription ownership
  const subscription = await Subscription.findOne({
    _id: subscriptionId,
    userId,
  });

  if (!subscription) {
    throw createNotFoundError('Subscription not found');
  }

  const transactions = await Transaction.find({
    userId,
    subscriptionId,
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: transactions,
  });
});

export const getPaymentMethods = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const paymentMethods = await PaymentMethod.findByUserId(userId.toString());

  res.json({
    success: true,
    data: paymentMethods,
  });
});

export const setDefaultPaymentMethod = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { paymentMethodId } = req.body;
  const userId = req.user!._id;

  // Verify ownership
  const paymentMethod = await PaymentMethod.findOne({
    _id: paymentMethodId,
    userId,
  });

  if (!paymentMethod) {
    throw createNotFoundError('Payment method not found');
  }

  await PaymentMethod.setDefault(userId.toString(), paymentMethodId);

  res.json({
    success: true,
    message: 'Default payment method updated',
  });
});

export const deletePaymentMethod = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { paymentMethodId } = req.params;
  const userId = req.user!._id;

  // Verify ownership
  const paymentMethod = await PaymentMethod.findOne({
    _id: paymentMethodId,
    userId,
  });

  if (!paymentMethod) {
    throw createNotFoundError('Payment method not found');
  }

  // Check if it's being used by active subscription
  const activeSubscription = await Subscription.findActiveByUserId(userId.toString());
  if (activeSubscription && activeSubscription.providerPaymentMethodId === paymentMethod.providerPaymentMethodId) {
    throw createValidationError('Cannot delete payment method used by active subscription');
  }

  await PaymentMethod.findByIdAndDelete(paymentMethodId);

  res.json({
    success: true,
    message: 'Payment method deleted',
  });
});

// Admin functions
export const getAllSubscriptions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 20,
    status,
    provider,
    search,
  } = req.query as SubscriptionQuery;

  // Build query
  const query: any = {};

  if (status) {
    query.status = status;
  }

  if (provider) {
    query.provider = provider;
  }

  if (search) {
    query.$or = [
      { planName: { $regex: search, $options: 'i' } },
      { providerSubscriptionId: { $regex: search, $options: 'i' } },
    ];
  }

  // Calculate pagination
  const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

  // Execute query
  const [subscriptions, total] = await Promise.all([
    Subscription.find(query)
      .populate('userId', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit.toString())),
    Subscription.countDocuments(query),
  ]);

  const pages = Math.ceil(total / parseInt(limit.toString()));

  res.json({
    success: true,
    data: {
      subscriptions,
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total,
        pages,
        hasNext: parseInt(page.toString()) < pages,
        hasPrev: parseInt(page.toString()) > 1,
      },
    },
  });
});

export const getSubscriptionStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [
    totalSubscriptions,
    activeSubscriptions,
    canceledSubscriptions,
    trialSubscriptions,
    monthlyRevenue,
    yearlyRevenue,
  ] = await Promise.all([
    Subscription.countDocuments(),
    Subscription.countDocuments({ status: 'active' }),
    Subscription.countDocuments({ status: 'canceled' }),
    Subscription.countDocuments({ status: 'trialing' }),
    Transaction.calculateRevenue(),
    // Add yearly revenue calculation
  ]);

  const stats = {
    totalSubscriptions,
    activeSubscriptions,
    canceledSubscriptions,
    trialSubscriptions,
    monthlyRevenue: monthlyRevenue[0]?.totalRevenue || 0,
    churnRate: totalSubscriptions > 0 ? ((canceledSubscriptions / totalSubscriptions) * 100).toFixed(2) : '0',
    activationRate: totalSubscriptions > 0 ? ((activeSubscriptions / totalSubscriptions) * 100).toFixed(2) : '0',
  };

  res.json({
    success: true,
    data: stats,
  });
});
