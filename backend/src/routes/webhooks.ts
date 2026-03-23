import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Stripe webhook
router.post('/stripe', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement Stripe webhook handling
  logger.info('Stripe webhook received', {
    type: req.body.type,
    id: req.body.id,
  });

  res.json({ received: true });
}));

// PayPal webhook
router.post('/paypal', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement PayPal webhook handling
  logger.info('PayPal webhook received', {
    eventType: req.body.event_type,
    id: req.body.id,
  });

  res.json({ received: true });
}));

export default router;
