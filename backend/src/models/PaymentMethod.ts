import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentMethod extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'card' | 'bank_account' | 'paypal';
  provider: 'stripe' | 'paypal';
  providerPaymentMethodId: string;
  isDefault: boolean;
  card?: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
    fingerprint: string;
    funding: string;
  };
  bankAccount?: {
    bankName: string;
    last4: string;
    routingNumber: string;
    accountType: string;
  };
  paypal?: {
    email: string;
    payerId: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentMethodSchema = new Schema<IPaymentMethod>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['card', 'bank_account', 'paypal'],
    required: true,
  },
  provider: {
    type: String,
    enum: ['stripe', 'paypal'],
    required: true,
  },
  providerPaymentMethodId: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
    index: true,
  },
  card: {
    brand: String,
    last4: String,
    expiryMonth: Number,
    expiryYear: Number,
    fingerprint: String,
    funding: String,
  },
  bankAccount: {
    bankName: String,
    last4: String,
    routingNumber: String,
    accountType: String,
  },
  paypal: {
    email: String,
    payerId: String,
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
      // Don't expose sensitive data
      if (ret.card) {
        delete ret.card.fingerprint;
      }
      if (ret.bankAccount) {
        delete ret.bankAccount.routingNumber;
      }
      return ret;
    },
  },
});

// Indexes for performance
paymentMethodSchema.index({ userId: 1, isDefault: 1 });
paymentMethodSchema.index({ provider: 1, providerPaymentMethodId: 1 });

// Static methods
paymentMethodSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
};

paymentMethodSchema.statics.findDefaultByUserId = function(userId: string) {
  return this.findOne({ userId, isDefault: true });
};

paymentMethodSchema.statics.findByProviderId = function(provider: string, providerId: string) {
  return this.findOne({ provider, providerPaymentMethodId: providerId });
};

paymentMethodSchema.statics.setDefault = function(userId: string, paymentMethodId: string) {
  return this.updateMany(
    { userId, _id: { $ne: paymentMethodId } },
    { isDefault: false }
  ).then(() => {
    return this.findByIdAndUpdate(paymentMethodId, { isDefault: true });
  });
};

// Instance methods
paymentMethodSchema.methods.getDisplayInfo = function() {
  switch (this.type) {
    case 'card':
      return {
        type: 'card',
        display: `${this.card?.brand} •••• ${this.card?.last4}`,
        expiry: `${this.card?.expiryMonth}/${this.card?.expiryYear}`,
      };
    case 'bank_account':
      return {
        type: 'bank_account',
        display: `${this.bankAccount?.bankName} •••• ${this.bankAccount?.last4}`,
        accountType: this.bankAccount?.accountType,
      };
    case 'paypal':
      return {
        type: 'paypal',
        display: this.paypal?.email,
      };
    default:
      return {
        type: 'unknown',
        display: 'Unknown Payment Method',
      };
  }
};

paymentMethodSchema.methods.isExpired = function() {
  if (this.type !== 'card' || !this.card) return false;
  const now = new Date();
  const expiryDate = new Date(this.card.expiryYear, this.card.expiryMonth, 0);
  return expiryDate < now;
};

// Pre-save middleware
paymentMethodSchema.pre('save', async function(next) {
  // Ensure only one default payment method per user
  if (this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export const PaymentMethod = mongoose.model<IPaymentMethod>('PaymentMethod', paymentMethodSchema);
