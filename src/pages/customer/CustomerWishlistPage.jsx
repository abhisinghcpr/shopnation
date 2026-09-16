import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { getImageUrl } from '../../config/apiConfig';

const CustomerWishlistPage = () => {
  const { wishlist, wishlistLoading, removeFromWishlist, addToCart } = useCustomerAuth();
  const [actionId, setActionId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showToast = (setter, msg) => {
    setter(msg);
    setTimeout(() => setter(''), 3500);
  };

  const handleRemove = async (productId, name) => {
    setActionId(productId);
    setErrorMsg('');
    try {
      await removeFromWishlist(productId);
      showToast(setSuccessMsg, `Removed "${name}" from Wishlist`);
    } catch (err) {
      showToast(setErrorMsg, err.message || 'Failed to remove from wishlist');
    } finally {
      setActionId(null);
    }
  };

  const handleMoveToCart = async (product) => {
    const productId = product._id || product.id;
    setActionId(productId);
    setErrorMsg('');
    try {
      await addToCart(productId, 1);
      await removeFromWishlist(productId);
      showToast(setSuccessMsg, `Moved "${product.name}" to Cart!`);
    } catch (err) {
      showToast(setErrorMsg, err.message || 'Failed to move product to cart');
    } finally {
      setActionId(null);
    }
  };

  if (wishlistLoading) {
    return (
      <div className="container py-5 text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading wishlist...</span>
        </div>
        <p className="mt-2 text-muted fw-semibold">Loading your wishlist from MongoDB...</p>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="container py-5">
        <div className="card border-0 shadow-sm p-5 text-center max-w-2xl mx-auto my-4 rounded-4">
          <div className="w-20 h-20 bg-light text-danger rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4">
            <i className="bi bi-heart fs-1 text-danger"></i>
          </div>
          <h3 className="fw-bold text-dark mb-2">Your Wishlist is Empty!</h3>
          <p className="text-muted mb-4">
            You have no saved items. Explore products and tap the heart icon to save items for later.
          </p>
          <div>
            <Link
              to="/customer/products"
              className="btn btn-fk-blue text-white font-semibold px-4 py-2.5 rounded shadow-sm"
            >
              <i className="bi bi-shop me-2"></i> Explore Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Toast Notifications */}
      {errorMsg && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errorMsg}
          <button type="button" className="btn-close" onClick={() => setErrorMsg('')}></button>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
        </div>
      )}

      {/* Wishlist Card */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="card-header bg-white py-3 px-4 d-flex align-items-center justify-content-between border-bottom">
          <h5 className="fw-bold text-dark mb-0">
            My Wishlist ({wishlist.length})
          </h5>
          <Link to="/customer/products" className="btn btn-link text-primary text-decoration-none fs-8 p-0 fw-semibold">
            <i className="bi bi-arrow-left me-1"></i> Back to Shop
          </Link>
        </div>

        <div className="list-group list-group-flush">
          {wishlist.map((product) => {
            const productId = product._id || product.id;
            const price = product.price || 0;
            const finalPrice = product.finalPrice ?? price;
            const stockQty = product.quantity ?? 0;
            const isOut = stockQty === 0 || product.stock === 'Out of Stock';
            const isProcessing = actionId === productId;

            return (
              <div key={productId} className="list-group-item p-4">
                <div className="row g-3 align-items-center">
                  {/* Image */}
                  <div className="col-4 col-sm-3 col-md-2">
                    <div className="border rounded p-1 text-center bg-light">
                      <img
                        src={getImageUrl(product.image) || 'https://via.placeholder.com/120?text=Product'}
                        alt={product.name || 'Product'}
                        className="img-fluid object-fit-contain"
                        style={{ maxHeight: '100px' }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100?text=No+Img';
                        }}
                      />
                    </div>
                  </div>

                  {/* Product info */}
                  <div className="col-8 col-sm-6 col-md-7">
                    <h6 className="fw-bold text-dark mb-1">
                      <Link to={`/customer/products/${productId}`} className="text-dark text-decoration-none">
                        {product.name}
                      </Link>
                    </h6>

                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-success fs-9">
                        {(product.rating || 4.2).toFixed(1)} <i className="bi bi-star-fill"></i>
                      </span>
                      <span className="fs-9 text-muted">({product.reviewCount || 10} reviews)</span>
                    </div>

                    <div className="d-flex align-items-baseline gap-2">
                      <span className="fw-bold text-dark fs-6">₹{finalPrice.toLocaleString('en-IN')}</span>
                      {price > finalPrice && (
                        <>
                          <span className="text-muted text-decoration-line-through fs-8">
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-success fw-bold fs-8">
                            {product.discountType === 'percentage'
                              ? `${product.discountValue}% OFF`
                              : `₹${product.discountValue} OFF`}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mt-1">
                      {isOut ? (
                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle fs-9">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle fs-9">
                          In Stock ({stockQty})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-12 col-sm-3 col-md-3 text-sm-end d-flex flex-sm-column gap-2 justify-content-between">
                    <button
                      onClick={() => handleMoveToCart(product)}
                      disabled={isOut || isProcessing}
                      className="btn btn-fk-yellow text-dark font-semibold btn-sm shadow-sm flex-grow-1 flex-sm-grow-0"
                    >
                      <i className="bi bi-cart-plus me-1"></i> Move to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(productId, product.name)}
                      disabled={isProcessing}
                      className="btn btn-outline-danger btn-sm border-0 fs-8"
                    >
                      <i className="bi bi-trash me-1"></i> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CustomerWishlistPage;
