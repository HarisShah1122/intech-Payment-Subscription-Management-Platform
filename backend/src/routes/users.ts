import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get user profile (already in auth routes, keeping for consistency)
router.get('/profile', asyncHandler(async (req: any, res: Response, next: NextFunction) => {
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
