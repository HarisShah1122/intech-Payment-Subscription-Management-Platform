import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as paymentController from '../controllers/paymentController';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// Create payment intent
router.post('/create-intent', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await paymentController.createPaymentIntent(req, res, next);
}));

// Confirm payment
router.post('/confirm', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await paymentController.confirmPayment(req, res, next);
}));

// Create PayPal order
router.post('/paypal/create-order', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await paymentController.createPayPalOrder(req, res, next);
}));

// Capture PayPal order
router.post('/paypal/capture-order', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await paymentController.capturePayPalOrder(req, res, next);
}));

// Get payment history
router.get('/history', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await paymentController.getPaymentHistory(req, res, next);
}));

// Get payment details
router.get('/:transactionId', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await paymentController.getPaymentDetails(req, res, next);
}));

// Refund payment
router.post('/refund', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await paymentController.refundPayment(req, res, next);
}));

// Get user spending
router.get('/spending', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  await paymentController.getUserSpending(req, res, next);
}));

export default router;
