import { Response } from 'express';
import { validationResult } from 'express-validator';
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

export const createPaymentIntent = asyncHandler(async (req: AuthRequest, res: Response) => {
  // TODO: Add validation rules when implementing frontend
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   throw createValidationError(errors.array()[0].msg);
  // }

  const { amount, currency = 'usd', paymentMethodId, description } = req.body;
  const userId = req.user!._id;

  // Validate amount
  if (!amount || amount <= 0) {
    throw createValidationError('Invalid amount');
  }

  try {
    // Get user's Stripe customer ID or create one
    const user = await User.findById(userId);
    if (!user) {
      throw createAuthError('User not found');
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString(),
        },
      });
      
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Create payment intent
    const result = await SubscriptionService.createStripePaymentIntent(
      amount,
      currency,
      customerId
    );

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'payment',
      status: 'pending',
      amount,
      currency,
      provider: 'stripe',
      providerTransactionId: result.paymentIntentId,
      providerPaymentIntentId: result.paymentIntentId,
      description,
    });

    await transaction.save();

    logger.info('Payment intent created', {
      userId,
      amount,
      currency,
      paymentIntentId: result.paymentIntentId,
    });

    res.json({
      success: true,
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        transactionId: transaction._id,
      },
    });
  } catch (error) {
    logger.error('Failed to create payment intent', error);
    throw new Error('Failed to create payment intent');
  }
});

export const confirmPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { paymentIntentId, transactionId } = req.body;
  const userId = req.user!._id;

  // Verify transaction ownership
  const transaction = await Transaction.findOne({
    _id: transactionId,
    userId,
    providerPaymentIntentId: paymentIntentId,
  });

  if (!transaction) {
    throw createNotFoundError('Transaction not found');
  }

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Update transaction based on payment intent status
    if (paymentIntent.status === 'succeeded') {
      transaction.status = 'succeeded';
      transaction.fees = paymentIntent.application_fee_amount || 0;
      transaction.netAmount = transaction.amount - transaction.fees;
      
      // Save payment method if it's new
      if (paymentIntent.payment_method && !paymentIntent.setup_future_usage) {
        await this.savePaymentMethod(userId, paymentIntent.payment_method);
      }
    } else if (paymentIntent.status === 'requires_payment_method') {
      transaction.status = 'failed';
      transaction.failureReason = paymentIntent.last_payment_error?.message;
    }

    await transaction.save();

    logger.info('Payment confirmed', {
      userId,
      transactionId,
      status: transaction.status,
      amount: transaction.amount,
    });

    res.json({
      success: true,
      data: {
        transaction,
        status: transaction.status,
      },
    });
  } catch (error) {
    logger.error('Failed to confirm payment', error);
    throw new Error('Failed to confirm payment');
  }
});

export const createPayPalOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  // TODO: Add validation rules when implementing frontend
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   throw createValidationError(errors.array()[0].msg);
  // }

  const { amount, currency = 'USD', description } = req.body;
  const userId = req.user!._id;

  // Validate amount
  if (!amount || amount <= 0) {
    throw createValidationError('Invalid amount');
  }

  try {
    const result = await SubscriptionService.createPayPalOrder(amount, currency);

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'payment',
      status: 'pending',
      amount,
      currency,
      provider: 'paypal',
      providerTransactionId: result.orderId,
      description,
    });

    await transaction.save();

    logger.info('PayPal order created', {
      userId,
      amount,
      currency,
      orderId: result.orderId,
    });

    res.json({
      success: true,
      data: {
        orderId: result.orderId,
        approvalUrl: result.approvalUrl,
        transactionId: transaction._id,
      },
    });
  } catch (error) {
    logger.error('Failed to create PayPal order', error);
    throw new Error('Failed to create PayPal order');
  }
});

export const capturePayPalOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId, transactionId } = req.body;
  const userId = req.user!._id;

  // Verify transaction ownership
  const transaction = await Transaction.findOne({
    _id: transactionId,
    userId,
    providerTransactionId: orderId,
  });

  if (!transaction) {
    throw createNotFoundError('Transaction not found');
  }

  try {
    const result = await SubscriptionService.capturePayPalOrder(orderId);

    // Update transaction
    if (result.order.status === 'COMPLETED') {
      transaction.status = 'succeeded';
      
      // Calculate fees (PayPal typically charges 2.9% + $0.30)
      transaction.fees = Math.round((transaction.amount * 0.029 + 0.30) * 100) / 100;
      transaction.netAmount = transaction.amount - transaction.fees;
    } else {
      transaction.status = 'failed';
      transaction.failureReason = result.order.status;
    }

    await transaction.save();

    logger.info('PayPal order captured', {
      userId,
      transactionId,
      status: transaction.status,
      amount: transaction.amount,
    });

    res.json({
      success: true,
      data: {
        transaction,
        status: transaction.status,
      },
    });
  } catch (error) {
    logger.error('Failed to capture PayPal order', error);
    throw new Error('Failed to capture PayPal order');
  }
});

export const getPaymentHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  const { page = 1, limit = 20, type, status } = req.query;

  // Build query
  const query: any = { userId };
  
  if (type) {
    query.type = type;
  }
  
  if (status) {
    query.status = status;
  }

  // Calculate pagination
  const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

  // Execute query
  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit.toString())),
    Transaction.countDocuments(query),
  ]);

  const pages = Math.ceil(total / parseInt(limit.toString()));

  res.json({
    success: true,
    data: {
      transactions,
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

export const getPaymentDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { transactionId } = req.params;
  const userId = req.user!._id;

  const transaction = await Transaction.findOne({
    _id: transactionId,
    userId,
  }).populate('subscriptionId');

  if (!transaction) {
    throw createNotFoundError('Transaction not found');
  }

  res.json({
    success: true,
    data: transaction,
  });
});

export const refundPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { transactionId, reason, amount } = req.body;
  const userId = req.user!._id;

  // Find transaction
  const transaction = await Transaction.findOne({
    _id: transactionId,
    userId,
  });

  if (!transaction) {
    throw createNotFoundError('Transaction not found');
  }

  if (!transaction.isRefundable()) {
    throw createValidationError('Payment cannot be refunded');
  }

  const refundAmount = amount || transaction.getRefundableAmount();

  try {
    let refundResult;

    if (transaction.provider === 'stripe') {
      refundResult = await stripe.refunds.create({
        payment_intent: transaction.providerPaymentIntentId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: reason || 'requested_by_customer',
      });
    } else if (transaction.provider === 'paypal') {
      // Implement PayPal refund logic
      throw new Error('PayPal refunds not yet implemented');
    }

    // Update transaction
    if (refundResult.status === 'succeeded') {
      transaction.status = 'refunded';
      transaction.refundedAmount = (transaction.refundedAmount || 0) + refundAmount;
      transaction.refundReason = reason;
      
      // Create refund transaction
      const refundTransaction = new Transaction({
        userId,
        type: 'refund',
        status: 'succeeded',
        amount: -refundAmount, // Negative amount for refund
        currency: transaction.currency,
        provider: transaction.provider,
        providerTransactionId: refundResult.id,
        description: `Refund for transaction ${transaction._id}`,
        refundReason: reason,
      });

      await refundTransaction.save();
    }

    await transaction.save();

    logger.info('Payment refunded', {
      userId,
      transactionId,
      refundAmount,
      reason,
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        transaction,
        refundResult,
      },
    });
  } catch (error) {
    logger.error('Failed to refund payment', error);
    throw new Error('Failed to refund payment');
  }
});

export const savePaymentMethod = async (userId: string, paymentMethodId: string) => {
  try {
    const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    const paymentMethod = new PaymentMethod({
      userId,
      type: stripePaymentMethod.type,
      provider: 'stripe',
      providerPaymentMethodId: paymentMethodId,
      isDefault: false,
    });

    if (stripePaymentMethod.type === 'card') {
      paymentMethod.card = {
        brand: stripePaymentMethod.card.brand,
        last4: stripePaymentMethod.card.last4,
        expiryMonth: stripePaymentMethod.card.exp_month,
        expiryYear: stripePaymentMethod.card.exp_year,
        fingerprint: stripePaymentMethod.card.fingerprint,
        funding: stripePaymentMethod.card.funding,
      };
    }

    await paymentMethod.save();
    return paymentMethod;
  } catch (error) {
    logger.error('Failed to save payment method', error);
    throw new Error('Failed to save payment method');
  }
};

export const getUserSpending = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id;
  
  const spending = await Transaction.getUserSpending(userId.toString());
  
  res.json({
    success: true,
    data: spending[0] || { totalSpent: 0, transactionCount: 0 },
  });
});
