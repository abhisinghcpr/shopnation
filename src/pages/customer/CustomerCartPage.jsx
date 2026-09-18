import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { getImageUrl } from '../../config/apiConfig';

const CustomerCartPage = () => {
  const { cart, cartLoading, updateCartQuantity, removeFromCart, clearCart } = useCustomerAuth();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showToast = (setter, msg) => {
    setter(msg);
    setTimeout(() => setter(''), 3500);
  };

  const handleQuantityChange = async (productId, currentQty, delta, maxStock) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    if (newQty > maxStock) {
      showToast(setErrorMsg, `Cannot exceed maximum stock limit (${maxStock} items available)`);
      return;
    }

    setUpdatingId(productId);
    setErrorMsg('');
    try {
      await updateCartQuantity(productId, newQty);
    } catch (err) {
      showToast(setErrorMsg, err.message || 'Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (productId, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from your cart?`)) return;

    setUpdatingId(productId);
    setErrorMsg('');
    try {
      await removeFromCart(productId);
      showToast(setSuccessMsg, `Removed "${name}" from cart`);
    } catch (err) {
      showToast(setErrorMsg, err.message || 'Failed to remove item');
    } finally {
      setUpdatingId(null);
    }
  };

  // Calculations
  const rawSubtotal = cart.reduce((acc, item) => {
    const price = item.product?.price || 0;
    return acc + price * (item.quantity || 1);
  }, 0);

  const totalAmount = cart.reduce((acc, item) => {
    const finalPrice = item.product?.finalPrice ?? item.product?.price ?? 0;
    return acc + finalPrice * (item.quantity || 1);
  }, 0);

  const totalDiscount = Math.max(0, rawSubtotal - totalAmount);
  const deliveryCharge = totalAmount > 500 || totalAmount === 0 ? 0 : 40;
  const grandTotal = totalAmount + deliveryCharge;

  if (cartLoading) {
    return (
      <div className="container py-5 text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading cart...</span>
        </div>
        <p className="mt-2 text-muted fw-semibold">Loading your cart from MongoDB...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container py-5">
        <div className="card border-0 shadow-sm p-5 text-center max-w-2xl mx-auto my-4 rounded-4">
          <div className="w-20 h-20 bg-light text-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4">
            <i className="bi bi-cart-x fs-1"></i>
          </div>
          <h3 className="fw-bold text-dark mb-2">Your Shopping Cart is Empty!</h3>
          <p className="text-muted mb-4">
            Explore our vast range of products and add your favorite items to your cart.
          </p>
          <div>
            <Link
              to="/customer/products"
              className="btn btn-fk-blue text-white font-semibold px-4 py-2.5 rounded shadow-sm"
            >
              <i className="bi bi-shop me-2"></i> Shop Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Toast alerts */}
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

      <div className="row g-4">
        {/* Left Column: Cart Items List */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
            <div className="card-header bg-white py-3 px-4 d-flex align-items-center justify-content-between border-bottom">
              <h5 className="fw-bold text-dark mb-0">
                My Cart ({cart.reduce((t, i) => t + (i.quantity || 1), 0)})
              </h5>
              <button
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to clear your entire cart?')) return;
                  try {
                    await clearCart();
                    showToast(setSuccessMsg, 'Cart cleared successfully');
                  } catch (err) {
                    showToast(setErrorMsg, err.message || 'Failed to clear cart');
                  }
                }}
                className="btn btn-link text-danger text-decoration-none fs-8 p-0 fw-semibold"
              >
                Clear Cart
              </button>
            </div>

            <div className="list-group list-group-flush">
              {cart.map((item) => {
                const product = item.product || {};
                const productId = product._id || product.id;
                const price = product.price || 0;
                const finalPrice = product.finalPrice ?? price;
                const stockQty = product.quantity ?? 0;
                const isUpdating = updatingId === productId;

                return (
                  <div key={productId} className="list-group-item p-4">
                    <div className="row g-3 align-items-center">
                      {/* Product Thumbnail */}
                      <div className="col-4 col-sm-3 col-md-2">
                        <div className="border rounded p-1 text-center bg-light">
                          <img
                            src={getImageUrl(product.image) || 'https://via.placeholder.com/120?text=Product'}
                            alt={product.name || 'Product'}
                            className="img-fluid object-fit-contain"
                            style={{ maxHeight: '90px' }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/90?text=No+Img';
                            }}
                          />
                        </div>
                      </div>

                      {/* Details & Controls */}
                      <div className="col-8 col-sm-9 col-md-10">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="fw-bold text-dark mb-1">
                              <Link to={`/customer/products/${productId}`} className="text-dark text-decoration-none">
                                {product.name}
                              </Link>
                            </h6>
                            {product.category?.name && (
                              <span className="badge bg-light text-secondary border fs-9">
                                {product.category.name}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleRemoveItem(productId, product.name)}
                            disabled={isUpdating}
                            className="btn btn-outline-danger btn-sm border-0 fs-7"
                            title="Remove Item"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>

                        {/* Price */}
                        <div className="d-flex align-items-baseline gap-2 mt-2">
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

                        {/* Quantity controls */}
                        <div className="d-flex align-items-center justify-content-between mt-3 flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-2">
                            <span className="fs-8 text-muted">Quantity:</span>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-secondary"
                                onClick={() => handleQuantityChange(productId, item.quantity, -1, stockQty)}
                                disabled={isUpdating || item.quantity <= 1}
                              >
                                -
                              </button>
                              <button className="btn btn-light fw-bold disabled text-dark px-3">
                                {item.quantity}
                              </button>
                              <button
                                className="btn btn-outline-secondary"
                                onClick={() => handleQuantityChange(productId, item.quantity, 1, stockQty)}
                                disabled={isUpdating || item.quantity >= stockQty}
                              >
                                +
                              </button>
                            </div>
                            <span className="fs-9 text-muted ms-1">(Max {stockQty})</span>
                          </div>

                          <div className="text-end">
                            <span className="fs-8 text-muted">Subtotal: </span>
                            <span className="fw-bold text-dark">
                              ₹{(finalPrice * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions Bar */}
            <div className="card-footer bg-white p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <Link to="/customer/products" className="btn btn-outline-secondary btn-sm fw-semibold">
                <i className="bi bi-arrow-left me-1"></i> Continue Shopping
              </Link>
              <button
                onClick={() => navigate('/customer/checkout')}
                className="btn btn-fk-orange text-white fw-bold px-4 py-2 uppercase shadow-sm"
              >
                Place Order <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Order Price Details */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white py-3 px-4 border-bottom">
              <h6 className="fw-bold text-secondary text-uppercase fs-8 mb-0">Price Details</h6>
            </div>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between mb-3 fs-7">
                <span className="text-secondary">Price ({cart.reduce((t, i) => t + (i.quantity || 1), 0)} items)</span>
                <span className="fw-semibold">₹{rawSubtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="d-flex justify-content-between mb-3 fs-7 text-success">
                <span>Discount</span>
                <span className="fw-semibold">- ₹{totalDiscount.toLocaleString('en-IN')}</span>
              </div>

              <div className="d-flex justify-content-between mb-3 fs-7">
                <span className="text-secondary">Delivery Charges</span>
                <span className={deliveryCharge === 0 ? 'text-success fw-semibold' : 'fw-semibold'}>
                  {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                </span>
              </div>

              <hr className="my-3" />

              <div className="d-flex justify-content-between mb-2 fs-6 fw-bold text-dark">
                <span>Total Amount</span>
                <span className="fs-5 text-dark">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="alert alert-success py-2 px-3 fs-8 fw-semibold mb-0 mt-3 border-0">
                  You will save ₹{totalDiscount.toLocaleString('en-IN')} on this order
                </div>
              )}
            </div>
            <div className="card-footer bg-light p-3 fs-8 text-muted d-flex align-items-center gap-2">
              <i className="bi bi-shield-check fs-5 text-success"></i>
              <span>Safe and Secure Payments. 100% Authentic products.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCartPage;
