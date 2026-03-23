// MongoDB initialization script
db = db.getSiblingDB('fintech_payment');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "role"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        },
        role: {
          enum: ["user", "admin"]
        }
      }
    }
  }
});

db.createCollection('subscriptions', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "status", "currentPeriodStart"],
      properties: {
        status: {
          enum: ["active", "canceled", "past_due", "unpaid", "trialing"]
        }
      }
    }
  }
});

db.createCollection('transactions');
db.createCollection('paymentMethods');
db.createCollection('webhookEvents');

// Create indexes for performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "googleId": 1 }, { sparse: true });
db.subscriptions.createIndex({ "userId": 1 });
db.subscriptions.createIndex({ "stripeCustomerId": 1 }, { sparse: true });
db.subscriptions.createIndex({ "paypalSubscriptionId": 1 }, { sparse: true });
db.subscriptions.createIndex({ "status": 1 });
db.transactions.createIndex({ "userId": 1 });
db.transactions.createIndex({ "subscriptionId": 1 });
db.transactions.createIndex({ "stripePaymentIntentId": 1 }, { sparse: true });
db.transactions.createIndex({ "paypalOrderId": 1 }, { sparse: true });
db.webhookEvents.createIndex({ "id": 1 }, { unique: true });
db.webhookEvents.createIndex({ "processed": 1 });
db.webhookEvents.createIndex({ "createdAt": 1 });

// Insert default admin user (password: admin123)
db.users.insertOne({
  email: "admin@fintech.com",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvO.", // bcrypt hash of admin123
  role: "admin",
  isActive: true,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print("Database initialized successfully");
