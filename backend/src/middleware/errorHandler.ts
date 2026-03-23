import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode = 500, message } = error;

  // Log error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    statusCode,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values((error as any).errors)
      .map((val: any) => val.message)
      .join(', ');
  }

  // Mongoose duplicate key error
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    statusCode = 400;
    const field = Object.keys((error as any).keyValue)[0];
    message = `${field} already exists`;
  }

  // Mongoose cast error
  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Stripe errors
  if ((error as any).type === 'StripeCardError') {
    statusCode = 400;
    message = error.message;
  }

  if ((error as any).type === 'StripeAPIError') {
    statusCode = 502;
    message = 'Stripe API error';
  }

  if ((error as any).type === 'StripeConnectionError') {
    statusCode = 503;
    message = 'Stripe connection error';
  }

  if ((error as any).type === 'StripeAuthenticationError') {
    statusCode = 401;
    message = 'Stripe authentication error';
  }

  // PayPal errors
  if (error.name === 'PayPalError') {
    statusCode = 400;
    message = error.message;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !error.isOperational) {
    message = 'Something went wrong';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error,
      }),
    },
    timestamp: new Date().toISOString(),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error helper
export const createValidationError = (message: string): CustomError => {
  return new CustomError(message, 400);
};

// Authentication error helper
export const createAuthError = (message: string = 'Authentication failed'): CustomError => {
  return new CustomError(message, 401);
};

// Authorization error helper
export const createAuthzError = (message: string = 'Access denied'): CustomError => {
  return new CustomError(message, 403);
};

// Not found error helper
export const createNotFoundError = (message: string = 'Resource not found'): CustomError => {
  return new CustomError(message, 404);
};

// Conflict error helper
export const createConflictError = (message: string = 'Resource conflict'): CustomError => {
  return new CustomError(message, 409);
};

// Rate limit error helper
export const createRateLimitError = (message: string = 'Too many requests'): CustomError => {
  return new CustomError(message, 429);
};

// Internal server error helper
export const createInternalError = (message: string = 'Internal server error'): CustomError => {
  return new CustomError(message, 500);
};
