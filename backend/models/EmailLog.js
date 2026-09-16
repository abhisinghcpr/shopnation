const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    eventType: {
      type: String,
      enum: [
        'ORDER_PLACED',
        'PAYMENT_SUCCESS',
        'ORDER_PROCESSING',
        'ORDER_SHIPPED',
        'OUT_FOR_DELIVERY',
        'ORDER_DELIVERED',
        'ORDER_CANCELLED',
        'REFUND_PENDING',
        'ADMIN_MESSAGE',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['Sent', 'Failed', 'Pending'],
      default: 'Pending',
    },
    messageId: { type: String },
    sentAt: { type: Date },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

// Unique protection: prevent duplicate successful sends for same order + event
emailLogSchema.index({ order: 1, eventType: 1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
