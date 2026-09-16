import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { reviewService } from '../../services/reviewService';
import { getImageUrl } from '../../config/apiConfig';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

const CustomerProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCustomerAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const productId = product?._id || product?.id;
  const inWishlist = isInWishlist(productId);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const products = await productService.getProducts();
      const found = products.find((p) => p._id === id || p.id === id);
      if (found) {
        setProduct(found);
      } else {
        setErrorMsg('Product not found');
      }
    } catch (err) {
      console.error('Failed to load product details:', err);
      setErrorMsg('Unable to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || isProcessing) return;
    setIsProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await addToCart(productId, quantity);
      setSuccessMsg(`Added ${quantity} unit(s) of "${product.name}" to Cart!`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      if (err.code === 'UNAUTHENTICATED' || err.message?.includes('UNAUTHENTICATED')) {
        navigate('/customer/login', { state: { from: `/customer/products/${id}` } });
      } else {
        setErrorMsg(err.message || 'Failed to add product to cart');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product || isProcessing) return;
    setIsProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await toggleWishlist(productId);
      setSuccessMsg(res.message || 'Wishlist updated');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      if (err.code === 'UNAUTHENTICATED' || err.message?.includes('UNAUTHENTICATED')) {
        navigate('/customer/login', { state: { from: `/customer/products/${id}` } });
      } else {
        setErrorMsg(err.message || 'Failed to update wishlist');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading product details...</span>
        </div>
        <p className="mt-2 text-muted">Loading product details...</p>
      </div>
    );
  }

  if (errorMsg && !product) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-warning d-inline-block px-5 py-4 shadow-sm rounded-3">
          <i className="bi bi-exclamation-triangle fs-1 d-block mb-2 text-warning"></i>
          <h4>Product Not Found</h4>
          <p className="text-muted mb-3">{errorMsg || 'The requested product is not available.'}</p>
          <Link to="/customer/products" className="btn btn-primary fw-bold">
            Back to Shop Catalog
          </Link>
        </div>
      </div>
    );
  }

  const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;
  const originalP = Number(product.price) || 0;
  const finalP = product.finalPrice !== undefined ? Number(product.finalPrice) : originalP;
  const hasDiscount = product.discountValue > 0;
  const savings = originalP - finalP;

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb fs-8">
          <li className="breadcrumb-item"><Link to="/customer/home">Home</Link></li>
          <li className="breadcrumb-item"><Link to="/customer/products">Shop Products</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{product.name}</li>
        </ol>
      </nav>

      {/* Toast Notifications */}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          {errorMsg}
        </div>
      )}

      {/* Main Product Card */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
        <div className="row g-0">
          {/* Image Gallery */}
          <div className="col-12 col-md-6 bg-light p-4 d-flex align-items-center justify-content-center border-end">
            <img
              src={product.image ? getImageUrl(product.image) : 'https://via.placeholder.com/500?text=No+Image'}
              alt={product.name}
              className="img-fluid rounded-3 object-fit-cover shadow-sm"
              style={{ maxHeight: '420px', width: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/500?text=No+Image';
              }}
            />
          </div>

          {/* Product Info Column */}
          <div className="col-12 col-md-6 p-4 p-lg-5">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="badge bg-light text-primary border border-primary-subtle px-3 py-1.5 fw-semibold fs-7">
                {categoryName || 'General'}
              </span>
              <span
                className={`badge rounded-pill ${
                  product.quantity > 0 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'
                } px-3 py-1.5`}
              >
                {product.quantity > 0 ? `In Stock (${product.quantity})` : 'Out of Stock'}
              </span>
            </div>

            <h2 className="fw-bold text-dark mb-3">{product.name}</h2>

            {/* Rating Stars */}
            <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
              <div className="text-warning me-2 fs-6">
                <i className="bi bi-star-fill me-1"></i>
                <span className="fw-bold text-dark fs-6">{(product.rating || 0).toFixed(1)}</span>
                <span className="text-muted fs-7 me-2"> / 5.0</span>
              </div>
              <span className="text-muted fs-7">&bull; {product.reviewCount || 0} customer reviews</span>
            </div>

            {/* Pricing Area */}
            <div className="mb-4">
              <div className="d-flex align-items-baseline gap-3">
                <span className="display-6 fw-bold text-dark">₹{finalP.toLocaleString('en-IN')}</span>
                {hasDiscount && (
                  <span className="fs-5 text-muted text-decoration-line-through">
                    ₹{originalP.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {hasDiscount && (
                <div className="mt-2">
                  <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-3 py-1.5 fs-7">
                    Save ₹{savings.toLocaleString('en-IN')} ({product.discountType === 'fixed' ? `₹${product.discountValue} Off` : `${product.discountValue}% Off`})
                  </span>
                </div>
              )}
            </div>

            {/* Description Preview */}
            <p className="text-secondary mb-4 leading-relaxed">
              {product.description || 'No detailed description provided for this product.'}
            </p>

            {/* Quantity Selector & Actions */}
            <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
              <div className="input-group" style={{ width: '130px' }}>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isProcessing}
                >
                  -
                </button>
                <input
                  type="text"
                  className="form-control text-center fw-bold bg-white"
                  value={quantity}
                  readOnly
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.quantity || 1, q + 1))}
                  disabled={quantity >= (product.quantity || 1) || isProcessing}
                >
                  +
                </button>
              </div>

              <button
                className="btn btn-warning text-dark fw-bold px-4 py-2.5 flex-grow-1 shadow-sm d-flex align-items-center justify-content-center gap-2"
                onClick={handleAddToCart}
                disabled={product.quantity === 0 || isProcessing}
              >
                <i className="bi bi-cart-plus fs-5"></i> Add to Cart
              </button>

              <button
                className={`btn ${inWishlist ? 'btn-danger' : 'btn-outline-danger'} fw-bold px-3 py-2.5 shadow-sm d-flex align-items-center justify-content-center`}
                onClick={handleToggleWishlist}
                disabled={isProcessing}
                title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <i className={`bi ${inWishlist ? 'bi-heart-fill' : 'bi-heart'} fs-5`}></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Reviews & Ratings Section */}
      <ProductReviewsSection productId={productId} onReviewChange={fetchProductDetails} />
    </div>
  );
};

// Sub-Component: Customer Product Reviews & Ratings Section
const ProductReviewsSection = ({ productId, onReviewChange }) => {
  const { customer, isAuthenticated } = useCustomerAuth();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalCount: 0, averageRating: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [userCanReview, setUserCanReview] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Review Form States
  const [isEditing, setIsEditing] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchReviews = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await reviewService.getProductReviews(productId);
      if (res.success) {
        setReviews(res.reviews || []);
        setStats(res.stats || { totalCount: 0, averageRating: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
        setUserCanReview(res.userCanReview || false);
        setUserReview(res.userReview || null);

        if (res.userReview) {
          setRatingInput(res.userReview.rating);
          setCommentInput(res.userReview.comment);
        }
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, isAuthenticated]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) {
      setErrorMsg('Please enter a review comment.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (userReview || isEditing) {
        const targetId = userReview?._id;
        await reviewService.updateReview(targetId, { rating: ratingInput, comment: commentInput });
        setSuccessMsg('Your review has been updated!');
      } else {
        await reviewService.createReview({ productId, rating: ratingInput, comment: commentInput });
        setSuccessMsg('Thank you! Your review has been published.');
      }
      setIsEditing(false);
      fetchReviews();
      if (onReviewChange) onReviewChange();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview?._id) return;
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await reviewService.deleteReview(userReview._id);
      setSuccessMsg('Your review has been deleted.');
      setUserReview(null);
      setCommentInput('');
      setRatingInput(5);
      setIsEditing(false);
      fetchReviews();
      if (onReviewChange) onReviewChange();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete review.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`bi ${i <= count ? 'bi-star-fill text-warning' : 'bi-star text-muted opacity-50'} me-1`}
        ></i>
      );
    }
    return stars;
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 p-lg-5 mb-4">
      <h4 className="fw-bold text-dark mb-4">Ratings & Customer Reviews</h4>

      {/* Overview & Distribution Row */}
      <div className="row g-4 mb-5 align-items-center bg-light rounded-3 p-4 mx-0">
        {/* Rating Score Card */}
        <div className="col-12 col-md-4 text-center border-end-md">
          <div className="display-4 fw-bold text-dark mb-1">{stats.averageRating.toFixed(1)}</div>
          <div className="fs-5 mb-2">{renderStars(Math.round(stats.averageRating))}</div>
          <div className="text-muted fs-7 fw-semibold">Based on {stats.totalCount} ratings</div>
        </div>

        {/* Rating Star Distribution */}
        <div className="col-12 col-md-8">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution[star] || 0;
            const pct = stats.totalCount > 0 ? (count / stats.totalCount) * 100 : 0;
            return (
              <div key={star} className="d-flex align-items-center gap-2 mb-1.5">
                <span className="fs-8 text-secondary fw-bold" style={{ width: '40px' }}>{star} ★</span>
                <div className="progress flex-grow-1" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-warning"
                    role="progressbar"
                    style={{ width: `${pct}%` }}
                    aria-valuenow={pct}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <span className="fs-8 text-muted" style={{ width: '35px', textAlign: 'right' }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Write/Edit Review Section */}
      <div className="mb-5 pb-4 border-bottom">
        {!isAuthenticated ? (
          <div className="alert alert-info d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <i className="bi bi-info-circle-fill me-2"></i>
              <strong>Have you purchased this product?</strong> Log in to write a review.
            </div>
            <button
              className="btn btn-sm btn-primary fw-bold"
              onClick={() => navigate('/customer/login', { state: { from: `/customer/products/${productId}` } })}
            >
              Log In to Review
            </button>
          </div>
        ) : userReview && !isEditing ? (
          <div className="bg-light-subtle border border-primary-subtle rounded-3 p-4">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span className="badge bg-primary mb-2">Your Review</span>
                <div className="fs-6">{renderStars(userReview.rating)}</div>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setIsEditing(true)}
                  disabled={submitting}
                >
                  <i className="bi bi-pencil me-1"></i> Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={handleDeleteReview}
                  disabled={submitting}
                >
                  <i className="bi bi-trash me-1"></i> Delete
                </button>
              </div>
            </div>
            <p className="mb-1 text-dark fw-medium">{userReview.comment}</p>
            <span className="text-muted fs-8">
              Submitted on {new Date(userReview.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
            </span>
          </div>
        ) : userCanReview || isEditing ? (
          <div className="border rounded-3 p-4 bg-white shadow-sm">
            <h5 className="fw-bold mb-3">{isEditing ? 'Edit Your Review' : 'Write a Verified Review'}</h5>

            {successMsg && <div className="alert alert-success py-2 fs-7">{successMsg}</div>}
            {errorMsg && <div className="alert alert-danger py-2 fs-7">{errorMsg}</div>}

            <form onSubmit={handleSubmitReview}>
              <div className="mb-3">
                <label className="form-label fw-semibold fs-7 me-3">Your Rating:</label>
                <div className="d-inline-flex fs-4" style={{ cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i
                      key={star}
                      className={`bi ${star <= (hoverRating || ratingInput) ? 'bi-star-fill text-warning' : 'bi-star text-muted'} me-1`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRatingInput(star)}
                    ></i>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold fs-7">Your Review Comment:</label>
                <textarea
                  className="form-control fs-7"
                  rows="3"
                  placeholder="Share your experience with this product..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  maxLength={1000}
                  required
                ></textarea>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-warning fw-bold text-dark px-4" disabled={submitting}>
                  {submitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setIsEditing(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="alert alert-secondary fs-7 mb-0">
            <i className="bi bi-shield-check me-2 text-success"></i>
            Only verified buyers who have purchased this product can leave a review.
          </div>
        )}
      </div>

      {/* Review List */}
      <h5 className="fw-bold text-dark mb-3">Customer Reviews ({reviews.length})</h5>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
          <span className="ms-2 text-muted fs-7">Loading reviews...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-4 text-muted border rounded-3">
          <i className="bi bi-chat-square-text fs-2 d-block mb-1 text-secondary"></i>
          No reviews yet. Be the first verified buyer to review this product!
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {reviews.map((rev) => (
            <div key={rev._id} className="border-bottom pb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="d-flex align-items-center gap-2">
                  <strong className="text-dark fs-7">{rev.customer?.name || 'Customer'}</strong>
                  {rev.isVerifiedPurchase && (
                    <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle fs-9">
                      <i className="bi bi-patch-check-fill me-1"></i> Verified Purchase
                    </span>
                  )}
                </div>
                <span className="text-muted fs-8">
                  {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="mb-2 fs-7">{renderStars(rev.rating)}</div>
              <p className="text-secondary mb-0 fs-7">{rev.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerProductDetailPage;
