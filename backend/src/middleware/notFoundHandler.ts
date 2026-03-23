import { Request, Response, NextFunction } from 'express';
import { createNotFoundError } from './errorHandler';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = createNotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};
