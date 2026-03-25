import mongoose, { Schema, Document } from 'mongoose';
import { User } from './User';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  endedAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  provider: 'stripe' | 'paypal';
  providerSubscriptionId: string;
  providerCustomerId?: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  intervalCount: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  planId: {
    type: String,
    required: true,
    index: true,
  },
  planName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete'],
    default: 'incomplete',
    index: true,
  },
  currentPeriodStart: {
    type: Date,
    required: true,
  },
  currentPeriodEnd: {
    type: Date,
    required: true,
    index: true,
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false,
  },
  canceledAt: {
    type: Date,
  },
  endedAt: {
    type: Date,
  },
  trialStart: {
    type: Date,
  },
  trialEnd: {
    type: Date,
    index: true,
  },
  provider: {
    type: String,
    enum: ['stripe', 'paypal'],
    required: true,
  },
  providerSubscriptionId: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
  },
  providerCustomerId: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
    default: 'usd',
    uppercase: true,
  },
  interval: {
    type: String,
    enum: ['month', 'year'],
    required: true,
  },
  intervalCount: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes for performance
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ provider: 1, providerSubscriptionId: 1 });

// Static methods
subscriptionSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

subscriptionSchema.statics.findActiveByUserId = function(userId: string) {
  return this.findOne({ 
    userId, 
    status: { $in: ['active', 'trialing'] },
    currentPeriodEnd: { $gt: new Date() }
  });
};

subscriptionSchema.statics.findByProviderId = function(provider: string, providerId: string) {
  return this.findOne({ provider, providerSubscriptionId: providerId });
};

// Instance methods
subscriptionSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && this.currentPeriodEnd > now;
};

subscriptionSchema.methods.isTrialing = function() {
  const now = new Date();
  return this.status === 'trialing' && this.trialEnd && this.trialEnd > now;
};

subscriptionSchema.methods.willCancelAtPeriodEnd = function() {
  return this.cancelAtPeriodEnd && !this.endedAt;
};

subscriptionSchema.methods.daysUntilRenewal = function() {
  if (!this.isActive()) return -1;
  const now = new Date();
  const renewalDate = new Date(this.currentPeriodEnd);
  const diffTime = renewalDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Pre-save middleware
subscriptionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'canceled') {
    this.canceledAt = new Date();
  }
  if (this.isModified('status') && ['canceled', 'unpaid'].includes(this.status)) {
    this.endedAt = new Date();
  }
  next();
});

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
