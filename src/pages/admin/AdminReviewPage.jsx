import React, { useState, useEffect } from 'react';
import { reviewService } from '../../services/reviewService';
import { productService } from '../../services/productService';

const AdminReviewPage = () => {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [selectedProduct, selectedRating, searchTerm]);

  const showToast = (setter, msg) => {
    setter(msg);
    setTimeout(() => setter(''), 3500);
  };

  const fetchProducts = async () => {
    try {
      const data = await productService.getProducts();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to fetch products list:', err);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedProduct) params.product = selectedProduct;
      if (selectedRating) params.rating = selectedRating;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await reviewService.getAllReviewsAdmin(params);
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch admin reviews:', err);
      showToast(setErrorMsg, err.message || 'Failed to fetch customer reviews.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this customer review?')) return;
    setDeletingId(reviewId);
    setErrorMsg('');
    try {
      await reviewService.deleteReviewAdmin(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      showToast(setSuccessMsg, 'Review deleted successfully by Admin.');
    } catch (err) {
      showToast(setErrorMsg, err.message || 'Failed to delete review.');
    } finally {
      setDeletingId(null);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`bi ${i <= rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'} fs-8 me-0.5`}
        ></i>
      );
    }
    return stars;
  };

  return (
    <div className="container-fluid py-4">
      {/* Title & Controls */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">
            <i className="bi bi-star-half me-2 text-warning"></i> Customer Reviews & Ratings
          </h3>
          <p className="text-muted mb-0 fs-7">
            Moderate, filter, and delete customer product reviews.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Search Box */}
          <div className="input-group input-group-sm" style={{ width: '220px' }}>
            <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search Review, Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter by Product */}
          <select
            className="form-select form-select-sm fs-7 w-auto"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Filter by Rating */}
          <select
            className="form-select form-select-sm fs-7 w-auto"
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars ★★★★★</option>
            <option value="4">4 Stars ★★★★☆</option>
            <option value="3">3 Stars ★★★☆☆</option>
            <option value="2">2 Stars ★★☆☆☆</option>
            <option value="1">1 Star ★☆☆☆☆</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMsg}
          <button type="button" className="btn-close" onClick={() => setErrorMsg('')}></button>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
        </div>
      )}

      {/* Reviews Moderation Table */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading reviews...</span>
              </div>
              <p className="mt-2 text-muted fs-7">Loading product reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-chat-left-dots fs-1 text-secondary d-block mb-2"></i>
              <h6 className="fw-bold text-dark">No Reviews Found</h6>
              <p className="text-muted fs-8">No customer reviews match your filter parameters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-7">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-4">Product</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Rating</th>
                    <th scope="col" style={{ maxWidth: '350px' }}>Review Comment</th>
                    <th scope="col">Verified Purchase</th>
                    <th scope="col">Date</th>
                    <th scope="col" className="pe-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((rev) => {
                    const isDeleting = deletingId === rev._id;
                    const cust = rev.customer || {};
                    const prod = rev.product || {};

                    return (
                      <tr key={rev._id}>
                        <td className="ps-4">
                          <div className="fw-bold text-dark">{prod.name || 'N/A'}</div>
                        </td>

                        <td>
                          <div className="fw-bold text-dark">{cust.name || 'Customer'}</div>
                          <div className="text-muted fs-8">{cust.email || 'N/A'}</div>
                        </td>

                        <td>
                          <div>{renderStars(rev.rating)}</div>
                          <span className="fw-bold fs-8">{rev.rating} / 5</span>
                        </td>

                        <td style={{ maxWidth: '350px' }}>
                          <p className="mb-0 text-secondary text-truncate" title={rev.comment}>
                            {rev.comment}
                          </p>
                        </td>

                        <td>
                          {rev.isVerifiedPurchase ? (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle">
                              <i className="bi bi-patch-check-fill me-1"></i> Verified
                            </span>
                          ) : (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border">Unverified</span>
                          )}
                        </td>

                        <td className="text-muted fs-8">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="pe-4 text-end">
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteReview(rev._id)}
                            disabled={isDeleting}
                          >
                            <i className="bi bi-trash me-1"></i> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviewPage;
