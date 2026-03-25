import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  type: 'payment' | 'subscription' | 'refund' | 'chargeback';
  status: 'succeeded' | 'failed' | 'pending' | 'refunded' | 'partially_refunded';
  amount: number;
  currency: string;
  provider: 'stripe' | 'paypal';
  providerTransactionId: string;
  providerPaymentIntentId?: string;
  providerChargeId?: string;
  description?: string;
  metadata?: Record<string, any>;
  failureReason?: string;
  refundReason?: string;
  refundedAmount?: number;
  fees?: number;
  netAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription',
    index: true,
  },
  type: {
    type: String,
    enum: ['payment', 'subscription', 'refund', 'chargeback'],
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['succeeded', 'failed', 'pending', 'refunded', 'partially_refunded'],
    required: true,
    index: true,
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
  provider: {
    type: String,
    enum: ['stripe', 'paypal'],
    required: true,
  },
  providerTransactionId: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
  },
  providerPaymentIntentId: {
    type: String,
  },
  providerChargeId: {
    type: String,
  },
  description: {
    type: String,
    trim: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  failureReason: {
    type: String,
    trim: true,
  },
  refundReason: {
    type: String,
    trim: true,
  },
  refundedAmount: {
    type: Number,
    min: 0,
  },
  fees: {
    type: Number,
    min: 0,
  },
  netAmount: {
    type: Number,
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
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ provider: 1, providerTransactionId: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });

// Static methods
transactionSchema.statics.findByUserId = function(userId: string, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('subscriptionId');
};

transactionSchema.statics.findSuccessfulByUserId = function(userId: string) {
  return this.find({ 
    userId, 
    status: 'succeeded',
    type: { $in: ['payment', 'subscription'] }
  }).sort({ createdAt: -1 });
};

transactionSchema.statics.findByProviderId = function(provider: string, providerId: string) {
  return this.findOne({ provider, providerTransactionId: providerId });
};

transactionSchema.statics.calculateRevenue = function(startDate?: Date, endDate?: Date) {
  const match: any = { status: 'succeeded', type: { $in: ['payment', 'subscription'] } };
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalFees: { $sum: '$fees' },
        netRevenue: { $sum: '$netAmount' },
        transactionCount: { $sum: 1 },
      },
    },
  ]);
};

transactionSchema.statics.getUserSpending = function(userId: string) {
  return this.aggregate([
    { 
      $match: { 
        userId: new mongoose.Types.ObjectId(userId),
        status: 'succeeded',
        type: { $in: ['payment', 'subscription'] }
      }
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
      },
    },
  ]);
};

// Instance methods
transactionSchema.methods.isRefundable = function() {
  return this.status === 'succeeded' && 
         this.type !== 'refund' && 
         this.refundedAmount !== this.amount;
};

transactionSchema.methods.getRefundableAmount = function() {
  if (!this.isRefundable()) return 0;
  return this.amount - (this.refundedAmount || 0);
};

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  // Calculate net amount if not provided
  if (this.isModified('amount') || this.isModified('fees')) {
    this.netAmount = this.amount - (this.fees || 0);
  }
  
  // Set refunded amount to 0 if not provided
  if (this.isModified('status') && this.status === 'refunded' && !this.refundedAmount) {
    this.refundedAmount = this.amount;
  }
  
  next();
});

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
