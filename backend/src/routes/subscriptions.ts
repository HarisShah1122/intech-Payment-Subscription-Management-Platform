import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as subscriptionController from '../controllers/subscriptionController';

const router = Router();

// All subscription routes require authentication
router.use(authenticate);

// Get available subscription plans
router.get('/plans', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await subscriptionController.getPlans(req, res, next);
}));

// Get user's subscriptions
router.get('/', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await subscriptionController.getUserSubscriptions(req, res, next);
}));

// Get user's active subscription
router.get('/active', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await subscriptionController.getActiveSubscription(req, res, next);
}));

// Create new subscription
router.post('/', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await subscriptionController.createSubscription(req, res, next);
}));

// Update subscription
router.put('/:subscriptionId', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await subscriptionController.updateSubscription(req, res, next);
}));

// Cancel subscription
router.delete('/:subscriptionId', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await subscriptionController.cancelSubscription(req, res, next);
}));

// Get subscription transactions
router.get('/:subscriptionId/transactions', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await subscriptionController.getSubscriptionTransactions(req, res, next);
}));

// Get payment methods
router.get('/payment-methods', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await subscriptionController.getPaymentMethods(req, res, next);
}));

// Set default payment method
router.put('/payment-methods/default', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await subscriptionController.setDefaultPaymentMethod(req, res, next);
}));

// Delete payment method
router.delete('/payment-methods/:paymentMethodId', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await subscriptionController.deletePaymentMethod(req, res, next);
}));

// Admin routes
router.get('/admin/all', authenticate, asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await subscriptionController.getAllSubscriptions(req, res, next);
}));

router.get('/admin/stats', authenticate, asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await subscriptionController.getSubscriptionStats(req, res, next);
}));

export default router;
