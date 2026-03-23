import { Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { 
  asyncHandler, 
  createValidationError, 
  createNotFoundError,
  createConflictError 
} from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { PaginationResult, UserQuery } from '../types';

export const getUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  
  res.json({
    success: true,
    data: {
      user: {
        id: user!._id,
        email: user!.email,
        firstName: user!.firstName,
        lastName: user!.lastName,
        role: user!.role,
        isActive: user!.isActive,
        emailVerified: user!.emailVerified,
        avatar: user!.avatar,
        phone: user!.phone,
        address: user!.address,
        preferences: user!.preferences,
        createdAt: user!.createdAt,
        lastLoginAt: user!.lastLoginAt,
      },
    },
  });
});

export const updateUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
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

export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 10,
    sort = 'createdAt',
    order = 'desc',
    search,
    role,
    isActive,
    emailVerified,
  } = req.query as UserQuery;

  // Build query
  const query: any = {};

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (role) {
    query.role = role;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === true;
  }

  if (emailVerified !== undefined) {
    query.emailVerified = emailVerified === true;
  }

  // Build sort
  const sortOptions: any = {};
  sortOptions[sort as string] = order === 'asc' ? 1 : -1;

  // Calculate pagination
  const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

  // Execute query
  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit.toString())),
    User.countDocuments(query),
  ]);

  const pages = Math.ceil(total / parseInt(limit.toString()));

  const result: PaginationResult<IUser> = {
    data: users,
    pagination: {
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
      total,
      pages,
      hasNext: parseInt(page.toString()) < pages,
      hasPrev: parseInt(page.toString()) > 1,
    },
  };

  res.json({
    success: true,
    data: result,
  });
});

export const getUserById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const user = await User.findById(id)
    .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires');

  if (!user) {
    throw createNotFoundError('User not found');
  }

  res.json({
    success: true,
    data: {
      user,
    },
  });
});

export const updateUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isActive, role } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw createNotFoundError('User not found');
  }

  if (isActive !== undefined) {
    user.isActive = isActive;
  }

  if (role && ['user', 'admin'].includes(role)) {
    user.role = role;
  }

  await user.save();

  logger.info('User status updated by admin', { 
    targetUserId: id,
    updatedBy: req.user!._id,
    updates: { isActive, role }
  });

  res.json({
    success: true,
    message: 'User status updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
      },
    },
  });
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw createNotFoundError('User not found');
  }

  // Don't allow users to delete themselves
  if (user._id.toString() === req.user!._id.toString()) {
    throw createValidationError('You cannot delete your own account');
  }

  await User.findByIdAndDelete(id);

  logger.info('User deleted by admin', { 
    targetUserId: id,
    deletedBy: req.user!._id,
    targetEmail: user.email
  });

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

export const getUserStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [
    totalUsers,
    activeUsers,
    verifiedUsers,
    adminUsers,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ emailVerified: true }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ 
      createdAt: { 
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
      } 
    }),
  ]);

  const stats = {
    totalUsers,
    activeUsers,
    verifiedUsers,
    adminUsers,
    recentUsers,
    inactiveUsers: totalUsers - activeUsers,
    unverifiedUsers: totalUsers - verifiedUsers,
    regularUsers: totalUsers - adminUsers,
    verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) : '0',
    activationRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : '0',
  };

  res.json({
    success: true,
    data: stats,
  });
});

export const exportUserData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id)
    .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires');

  if (!user) {
    throw createNotFoundError('User not found');
  }

  const userData = {
    personalInfo: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
    },
    accountInfo: {
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    preferences: user.preferences,
  };

  // Set headers for file download
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=user-data-${user._id}.json`);

  res.json(userData);
});
