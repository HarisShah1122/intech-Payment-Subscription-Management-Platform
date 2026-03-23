import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// TODO: Implement admin routes
// - Get all users
// - Get user details
// - Update user status
// - Get all subscriptions
// - Get all transactions
// - Get analytics
// - System health

// Get admin dashboard stats
router.get('/dashboard', asyncHandler(async (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Admin routes - Coming soon',
    data: {
      totalUsers: 0,
      activeSubscriptions: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
    },
  });
}));

export default router;
