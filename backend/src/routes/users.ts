import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get user profile (already in auth routes, keeping for consistency)
router.get('/profile', asyncHandler(async (req: AuthRequest, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
}));

// TODO: Add more user-specific routes
// - Update preferences
// - Get user statistics
// - Delete account
// - Export user data

export default router;
