// Common types used across the application

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
  timestamp?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserQuery extends PaginationQuery {
  search?: string;
  role?: 'user' | 'admin';
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface SubscriptionQuery extends PaginationQuery {
  userId?: string;
  status?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  planId?: string;
}

export interface TransactionQuery extends PaginationQuery {
  userId?: string;
  subscriptionId?: string;
  status?: 'succeeded' | 'failed' | 'pending' | 'refunded';
  type?: 'payment' | 'subscription' | 'refund';
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  churnRate: number;
  avgRevenuePerUser: number;
  subscriptionGrowth: number;
  revenueGrowth: number;
}

export interface HealthCheck {
  success: boolean;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services?: {
    database: string;
    memory: {
      used: number;
      total: number;
      external: number;
    };
    cpu: {
      usage: any;
    };
  };
}

export interface WebhookEvent {
  id: string;
  type: string;
  source: 'stripe' | 'paypal';
  processed: boolean;
  data: any;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  data?: Record<string, any>;
  text?: string;
  html?: string;
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key: string;
  data: any;
}

export interface RateLimitInfo {
  windowMs: number;
  maxRequests: number;
  currentRequests: number;
  resetTime: number;
}

export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface GoogleProfile {
  id: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
  };
  emails: Array<{
    value: string;
    type: string;
  }>;
  photos: Array<{
    value: string;
  }>;
}

export interface StripeEvent {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: any;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
  type: string;
}

export interface PayPalEvent {
  id: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  event_type: string;
  summary: string;
  resource: any;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal';
  provider: 'stripe' | 'paypal';
  isDefault: boolean;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  createdAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  intervalCount: number;
  trialPeriodDays?: number;
  features: string[];
  isActive: boolean;
  stripePriceId?: string;
  paypalPlanId?: string;
  createdAt: Date;
  updatedAt: Date;
}
