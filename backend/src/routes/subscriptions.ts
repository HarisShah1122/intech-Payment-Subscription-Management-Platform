import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All subscription routes require authentication
router.use(authenticate);

// TODO: Implement subscription routes
// - Get user subscriptions
// - Create new subscription
// - Update subscription
// - Cancel subscription
// - Get subscription history
// - Get available plans

// Get user subscriptions
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Subscription routes - Coming soon',
    data: [],
  });
}));

export default router;
