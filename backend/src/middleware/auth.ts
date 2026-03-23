import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { createAuthError, createAuthzError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createAuthError('Access token is required');
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw createAuthError('User not found');
    }

    if (!user.isActive) {
      throw createAuthError('User account is deactivated');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createAuthError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createAuthError('Token expired'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createAuthError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(createAuthzError('Insufficient permissions'));
    }

    next();
  };
};

// Optional authentication - doesn't throw error if no token
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Silently ignore authentication errors for optional auth
  }
  
  next();
};

// Check if user owns the resource or is admin
export const checkOwnership = (resourceUserField: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createAuthError('Authentication required'));
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.body[resourceUserField] || req.params[resourceUserField];
    
    if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
      return next(createAuthzError('Access denied: You can only access your own resources'));
    }

    next();
  };
};

// Rate limiting for authentication endpoints
export const createAuthRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const requestData = requests.get(key);

    if (!requestData || now > requestData.resetTime) {
      requests.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (requestData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many authentication attempts, please try again later',
          retryAfter: Math.ceil((requestData.resetTime - now) / 1000),
        },
      });
    }

    requestData.count++;
    next();
  };
};

// Email verification check
export const requireEmailVerification = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(createAuthError('Authentication required'));
  }

  if (!req.user.emailVerified) {
    return next(createAuthError('Email verification required'));
  }

  next();
};

// Password strength validation
export const validatePasswordStrength = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

// Generate JWT tokens
export const generateTokens = (userId: string) => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

  if (!jwtSecret || !jwtRefreshSecret) {
    throw new Error('JWT secrets are not defined');
  }

  const accessToken = jwt.sign({ userId }, jwtSecret, { expiresIn: jwtExpiresIn });
  const refreshToken = jwt.sign({ userId }, jwtRefreshSecret, { expiresIn: jwtRefreshExpiresIn });

  return { accessToken, refreshToken };
};

// Verify refresh token
export const verifyRefreshToken = (token: string): { userId: string } => {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!jwtRefreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.verify(token, jwtRefreshSecret) as { userId: string };
};
