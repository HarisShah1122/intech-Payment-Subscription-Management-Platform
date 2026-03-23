import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { 
  asyncHandler, 
  createValidationError, 
  createAuthError, 
  createConflictError 
} from '../middleware/errorHandler';
import { 
  generateTokens, 
  verifyRefreshToken,
  validatePasswordStrength 
} from '../middleware/auth';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
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
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
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
});

export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw createValidationError('Refresh token is required');
  }

  try {
    const { userId } = verifyRefreshToken(token);
    
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
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  // TODO: Implement token blacklist in Redis
  logger.info('User logged out', { 
    userId: req.user!._id, 
    email: req.user!.email 
  });

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

export const getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
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
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
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
});

export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
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
});

export const resendVerification = asyncHandler(async (req: AuthRequest, res: Response) => {
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
});

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
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
      message: 'If an account with this email exists, a password reset email has been sent.',
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // TODO: Send password reset email

  logger.info('Password reset requested', { 
    userId: user._id, 
    email: user.email 
  });

  res.json({
    success: true,
    message: 'Password reset email sent',
  });
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError(errors.array()[0].msg);
  }

  const { token, newPassword } = req.body;

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw createAuthError('Invalid or expired reset token');
  }

  // Update password
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  logger.info('Password reset completed', { 
    userId: user._id, 
    email: user.email 
  });

  res.json({
    success: true,
    message: 'Password reset successful',
  });
});
