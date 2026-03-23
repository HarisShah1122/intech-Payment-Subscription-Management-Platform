import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import passport from 'passport';
import { User, IUser } from '../models/User';
import { 
  asyncHandler, 
  createValidationError, 
  createAuthError, 
  createConflictError 
} from '../middleware/errorHandler';
import { 
  AuthRequest, 
  authenticate, 
  generateTokens, 
  verifyRefreshToken,
  validatePasswordStrength,
  createAuthRateLimit 
} from '../middleware/auth';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const router = Router();

// Rate limiting for auth endpoints
const loginRateLimit = createAuthRateLimit(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
const registerRateLimit = createAuthRateLimit(3, 60 * 60 * 1000); // 3 attempts per hour

// Validation middleware
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .custom((value) => {
      if (!validatePasswordStrength(value)) {
        throw new Error('Password must contain uppercase, lowercase, numbers, and special characters');
      }
      return true;
    }),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Register new user
router.post('/register', registerRateLimit, validateRegister, asyncHandler(async (req: Request, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError(errors.array()[0].msg);
  }

  const { email, password, firstName, lastName } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw createConflictError('User with this email already exists');
  }

  // Create new user
  const user = new User({
    email: email.toLowerCase(),
    password,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
  });

  // Generate email verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = emailVerificationToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id.toString());

  logger.info('New user registered', { 
    userId: user._id, 
    email: user.email,
    ip: req.ip 
  });

  // TODO: Send verification email

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email to verify your account.',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    },
  });
}));

// Login user
router.post('/login', loginRateLimit, validateLogin, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError(errors.array()[0].msg);
  }

  const { email, password } = req.body;

  // Find user with password
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw createAuthError('Invalid email or password');
  }

  if (!user.isActive) {
    throw createAuthError('Account has been deactivated');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw createAuthError('Invalid email or password');
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id.toString());

  logger.info('User logged in', { 
    userId: user._id, 
    email: user.email,
    ip: req.ip 
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        preferences: user.preferences,
      },
      accessToken,
      refreshToken,
    },
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createValidationError('Refresh token is required');
  }

  try {
    const { userId } = verifyRefreshToken(refreshToken);
    
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw createAuthError('Invalid refresh token');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id.toString());

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    throw createAuthError('Invalid refresh token');
  }
}));

// Logout user
router.post('/logout', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  // TODO: Implement token blacklist in Redis
  logger.info('User logged out', { 
    userId: req.user!._id, 
    email: req.user!.email 
  });

  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

// Get current user
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
}));

// Update current user
router.put('/me', authenticate, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/),
  body('preferences.currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']),
  body('preferences.language').optional().isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh']),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError(errors.array()[0].msg);
  }

  const allowedUpdates = ['firstName', 'lastName', 'phone', 'address', 'preferences'];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    throw createValidationError('Invalid updates');
  }

  updates.forEach(update => {
    if (update === 'preferences') {
      req.user!.preferences = { ...req.user!.preferences, ...req.body.preferences };
    } else {
      (req.user as any)[update] = req.body[update];
    }
  });

  await req.user!.save();

  logger.info('User profile updated', { 
    userId: req.user!._id, 
    updates 
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: req.user,
    },
  });
}));

// Change password
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .custom((value) => {
      if (!validatePasswordStrength(value)) {
        throw new Error('Password must contain uppercase, lowercase, numbers, and special characters');
      }
      return true;
    }),
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError(errors.array()[0].msg);
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user!._id).select('+password');
  if (!user) {
    throw createAuthError('User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw createAuthError('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info('Password changed', { 
    userId: user._id, 
    email: user.email 
  });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

// Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account',
}));

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUser;
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    logger.info('User logged in via Google OAuth', { 
      userId: user._id, 
      email: user.email 
    });

    // Redirect to frontend with tokens
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`;
    res.redirect(redirectUrl);
  })
);

// Verify email
router.post('/verify-email', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw createValidationError('Verification token is required');
  }

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw createAuthError('Invalid or expired verification token');
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  logger.info('Email verified', { 
    userId: user._id, 
    email: user.email 
  });

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
}));

// Resend verification email
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail(),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError(errors.array()[0].msg);
  }

  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal that user doesn't exist
    return res.json({
      success: true,
      message: 'If an account with this email exists, a verification email has been sent.',
    });
  }

  if (user.emailVerified) {
    return res.json({
      success: true,
      message: 'Email is already verified',
    });
  }

  // Generate new verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = emailVerificationToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await user.save();

  // TODO: Send verification email

  res.json({
    success: true,
    message: 'Verification email sent',
  });
}));

export default router;
