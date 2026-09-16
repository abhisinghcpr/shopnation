const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * Helper: Recalculate average rating and review count for a product
 */
const recalculateProductRating = async (productId) => {
  try {
    const stats = await Review.aggregate([
      { $match: { product: new (require('mongoose').Types.ObjectId)(productId) } },
      {
        $group: {
          _id: '$product',
          reviewCount: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        reviewCount: stats[0].reviewCount,
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        reviewCount: 0,
      });
    }
  } catch (error) {
    console.error('Error recalculating product rating stats:', error);
  }
};

/**
 * Customer: Create a review for a product
 * POST /api/v1/customer/reviews
 */
exports.createReview = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, rating (1-5), and review comment are required.',
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5.',
      });
    }

    // Check if customer has already reviewed this product
    const existingReview = await Review.findOne({ customer: customerId, product: productId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product. You can edit your existing review.',
      });
    }

    // Check if customer purchased this product in any valid/delivered order
    const matchingOrder = await Order.findOne({
      customer: customerId,
      'items.product': productId,
      orderStatus: { $ne: 'Cancelled' },
    }).sort({ createdAt: -1 });

    if (!matchingOrder) {
      return res.status(403).json({
        success: false,
        message: 'Verified Purchase Required: You can only review products you have purchased.',
      });
    }

    const review = await Review.create({
      customer: customerId,
      product: productId,
      order: matchingOrder._id,
      rating: numRating,
      comment,
      isVerifiedPurchase: true,
    });

    await recalculateProductRating(productId);

    const populatedReview = await Review.findById(review._id).populate('customer', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been submitted successfully.',
      review: populatedReview,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while submitting review.',
    });
  }
};

/**
 * Public/Customer: Get all reviews for a product with rating distribution
 * GET /api/v1/customer/products/:productId/reviews
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const currentCustomerId = req.customer?.id;

    const reviews = await Review.find({ product: productId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    // Calculate rating breakdown distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalSum = 0;

    reviews.forEach((rev) => {
      if (distribution[rev.rating] !== undefined) {
        distribution[rev.rating] += 1;
      }
      totalSum += rev.rating;
    });

    const totalCount = reviews.length;
    const averageRating = totalCount > 0 ? (totalSum / totalCount).toFixed(1) : 0;

    // Check purchase eligibility for logged-in user
    let userCanReview = false;
    let userReview = null;

    if (currentCustomerId) {
      userReview = reviews.find((r) => r.customer?._id?.toString() === currentCustomerId || r.customer?.toString() === currentCustomerId);

      if (!userReview) {
        const matchingOrder = await Order.findOne({
          customer: currentCustomerId,
          'items.product': productId,
          orderStatus: { $ne: 'Cancelled' },
        });
        if (matchingOrder) {
          userCanReview = true;
        }
      }
    }

    return res.status(200).json({
      success: true,
      reviews,
      stats: {
        totalCount,
        averageRating: Number(averageRating),
        distribution,
      },
      userCanReview,
      userReview,
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews.',
    });
  }
};

/**
 * Customer: Update own review
 * PUT /api/v1/customer/reviews/:id
 */
exports.updateReview = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (review.customer.toString() !== customerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this review.' });
    }

    if (rating) {
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
      }
      review.rating = numRating;
    }

    if (comment) {
      review.comment = comment;
    }

    await review.save();
    await recalculateProductRating(review.product);

    const updatedPopulated = await Review.findById(review._id).populate('customer', 'name');

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully.',
      review: updatedPopulated,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating review.' });
  }
};

/**
 * Customer: Delete own review
 * DELETE /api/v1/customer/reviews/:id
 */
exports.deleteReview = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (review.customer.toString() !== customerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this review.' });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(id);
    await recalculateProductRating(productId);

    return res.status(200).json({
      success: true,
      message: 'Your review has been deleted.',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting review.' });
  }
};

/**
 * Admin: Get all reviews with search & filters
 * GET /api/v1/admin/reviews
 */
exports.getAllReviewsAdmin = async (req, res) => {
  try {
    const { product, rating, search } = req.query;
    const filter = {};

    if (product) filter.product = product;
    if (rating) filter.rating = Number(rating);

    let reviews = await Review.find(filter)
      .populate('customer', 'name email phone')
      .populate('product', 'name image price category')
      .sort({ createdAt: -1 });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      reviews = reviews.filter(
        (r) =>
          r.comment?.toLowerCase().includes(q) ||
          r.customer?.name?.toLowerCase().includes(q) ||
          r.customer?.email?.toLowerCase().includes(q) ||
          r.product?.name?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching admin reviews.' });
  }
};

/**
 * Admin: Delete inappropriate review
 * DELETE /api/v1/admin/reviews/:id
 */
exports.deleteReviewAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(id);
    await recalculateProductRating(productId);

    return res.status(200).json({
      success: true,
      message: 'Review removed by Admin successfully.',
    });
  } catch (error) {
    console.error('Error deleting review by admin:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting review.' });
  }
};
