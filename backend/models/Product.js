const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product original price is required'],
      min: [0, 'Price must be greater than or equal to 0'],
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      default: 0,
      min: [0, 'Discount value cannot be negative'],
    },
    finalPrice: {
      type: Number,
      default: 0,
      min: [0, 'Final price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    stock: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      default: 'In Stock',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, 'Review count cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

// Middleware to calculate finalPrice and stock status automatically before saving
productSchema.pre('save', function (next) {
  const priceNum = Number(this.price) || 0;
  const discountVal = Number(this.discountValue) || 0;

  let calculatedFinal = priceNum;

  if (this.discountType === 'percentage') {
    const validPercent = Math.min(Math.max(discountVal, 0), 100);
    calculatedFinal = priceNum - (priceNum * validPercent) / 100;
  } else if (this.discountType === 'fixed') {
    const validFixed = Math.min(Math.max(discountVal, 0), priceNum);
    calculatedFinal = priceNum - validFixed;
  }

  this.finalPrice = Math.max(0, Math.round(calculatedFinal * 100) / 100);

  // Stock status calculation
  const qty = Number(this.quantity) || 0;
  if (qty === 0) {
    this.stock = 'Out of Stock';
  } else if (qty <= 5) {
    this.stock = 'Low Stock';
  } else {
    this.stock = 'In Stock';
  }

  next();
});

module.exports = mongoose.model('Product', productSchema);
