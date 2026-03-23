import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// TODO: Implement payment routes
// - Create payment intent
// - Confirm payment
// - Get payment history
// - Get payment methods
// - Add payment method
// - Remove payment method

// Create payment intent
router.post('/create-intent', asyncHandler(async (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Payment routes - Coming soon',
    data: null,
  });
}));

export default router;
