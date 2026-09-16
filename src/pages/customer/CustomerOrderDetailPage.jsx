import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { getImageUrl } from '../../config/apiConfig';
import CustomerInvoiceModal from '../../components/customer/CustomerInvoiceModal';

const CustomerOrderDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showSuccessBanner, setShowSuccessBanner] = useState(location.state?.orderSuccess || false);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [cancelling, setCancelling] = useState(false);

  // Reorder state
  const [reordering, setReordering] = useState(false);

  // Invoice modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const showToast = (setter, msg) => {
    setter(msg);
    setTimeout(() => setter(''), 4000);
  };

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const data = await orderService.getCustomerOrderById(id);
      setOrder(data);
    } catch (err) {
      console.error('Failed to load order detail:', err);
      setErrorMsg(err.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      showToast(setErrorMsg, 'Please provide a reason for cancellation.');
      return;
    }

    setCancelling(true);
    setErrorMsg('');
    try {
      const res = await orderService.cancelCustomerOrder(id, cancelReason);
      setOrder(res.order);
      setShowCancelModal(false);
      showToast(setSuccessMsg, 'Order cancelled successfully and product stock restored.');
    } catch (err) {
      showToast(setErrorMsg, err.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = async () => {
    setReordering(true);
    setErrorMsg('');
    try {
      const res = await orderService.reorderCustomerItems(id);
      showToast(setSuccessMsg, res.message);
      setTimeout(() => {
        navigate('/customer/cart');
      }, 1500);
    } catch (err) {
      showToast(setErrorMsg, err.message || 'Failed to reorder items.');
    } finally {
      setReordering(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Placed':
        return <span className="badge bg-primary px-3 py-1.5 fs-8">Placed</span>;
      case 'Processing':
        return <span className="badge bg-info text-dark px-3 py-1.5 fs-8">Processing</span>;
      case 'Shipped':
        return <span className="badge bg-warning text-dark px-3 py-1.5 fs-8">Shipped</span>;
      case 'Out for Delivery':
        return <span className="badge bg-primary px-3 py-1.5 fs-8">Out for Delivery</span>;
      case 'Delivered':
        return <span className="badge bg-success px-3 py-1.5 fs-8">Delivered</span>;
      case 'Cancelled':
        return <span className="badge bg-danger px-3 py-1.5 fs-8">Cancelled</span>;
      default:
        return <span className="badge bg-secondary px-3 py-1.5 fs-8">{status}</span>;
    }
  };

  // Tracking Steps Helper
  const trackingSteps = ['Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

  const getStepIndex = (status) => {
    return trackingSteps.indexOf(status);
  };

  if (loading) {
    return (
      <div className="container py-5 text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading order detail...</span>
        </div>
        <p className="mt-2 text-muted fw-semibold">Loading order breakdown...</p>
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-warning d-inline-block p-4 shadow-sm rounded-3">
          <i className="bi bi-exclamation-triangle fs-1 d-block text-warning mb-2"></i>
          <h5 className="fw-bold">Order Not Found</h5>
          <p className="text-muted">{errorMsg || 'The requested order details could not be found.'}</p>
          <Link to="/customer/orders" className="btn btn-primary btn-sm fw-bold">
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const { shippingAddress = {}, cancellation = {} } = order;
  const currentStepIdx = getStepIndex(order.orderStatus);
  const isCancelled = order.orderStatus === 'Cancelled';
  const canCancel = ['Placed', 'Processing'].includes(order.orderStatus);

  return (
    <div className="container py-4">
      {/* Toast Messages */}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i> {errorMsg}
          <button type="button" className="btn-close" onClick={() => setErrorMsg('')}></button>
        </div>
      )}

      {/* Success Notification Banner on Checkout redirect */}
      {showSuccessBanner && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm mb-4 p-4 rounded-3 border-0 bg-green-50 text-green-800" role="alert">
          <div className="d-flex align-items-center gap-3">
            <i className="bi bi-check-circle-fill text-success fs-1"></i>
            <div>
              <h5 className="fw-bold mb-1">Order Placed Successfully!</h5>
              <p className="mb-0 fs-7">
                Thank you for your purchase! Your order <strong>{order.orderNumber}</strong> has been logged in our system.
              </p>
            </div>
          </div>
          <button type="button" className="btn-close" onClick={() => setShowSuccessBanner(false)}></button>
        </div>
      )}

      {/* Main Order Card Header */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-white py-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom">
          <div>
            <span className="text-muted fs-8">Order ID: </span>
            <strong className="text-dark fs-6 me-3">{order.orderNumber}</strong>
            <span className="text-muted fs-8">Placed on: </span>
            <span className="text-dark fs-8">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {getStatusBadge(order.orderStatus)}

            <button
              onClick={() => setShowInvoiceModal(true)}
              className="btn btn-outline-dark btn-sm fw-semibold fs-8"
            >
              <i className="bi bi-file-earmark-pdf me-1"></i> Download Invoice
            </button>

            <button
              onClick={handleReorder}
              disabled={reordering}
              className="btn btn-fk-yellow text-dark btn-sm fw-bold fs-8"
            >
              {reordering ? 'Adding to Cart...' : 'Reorder Items'}
            </button>

            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="btn btn-outline-danger btn-sm fw-semibold fs-8"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>

        <div className="card-body p-4">
          {/* Order Tracking Progress Bar (Visible if not cancelled) */}
          {!isCancelled ? (
            <div className="mb-5 p-4 bg-light border rounded-3">
              <h6 className="fw-bold text-dark mb-4">
                <i className="bi bi-truck text-fk-blue me-2"></i> Order Tracking Timeline
              </h6>
              <div className="position-relative py-3">
                {/* Connecting Line */}
                <div
                  className="position-absolute top-50 start-0 w-100 bg-secondary-subtle"
                  style={{ height: '4px', transform: 'translateY(-50%)', zIndex: 1 }}
                ></div>
                <div
                  className="position-absolute top-50 start-0 bg-success transition-all duration-500"
                  style={{
                    height: '4px',
                    transform: 'translateY(-50%)',
                    zIndex: 2,
                    width: `${(Math.max(0, currentStepIdx) / (trackingSteps.length - 1)) * 100}%`,
                  }}
                ></div>

                {/* Step Indicators */}
                <div className="d-flex justify-content-between position-relative" style={{ zIndex: 3 }}>
                  {trackingSteps.map((step, idx) => {
                    const isCompleted = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;

                    return (
                      <div key={step} className="text-center">
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center mx-auto transition-all ${
                            isCompleted
                              ? 'bg-success text-white'
                              : 'bg-white text-secondary border border-2'
                          }`}
                          style={{
                            width: '36px',
                            height: '36px',
                            boxShadow: isCurrent ? '0 0 0 4px rgba(25, 135, 84, 0.25)' : 'none',
                          }}
                        >
                          {isCompleted ? (
                            <i className="bi bi-check-lg fs-6"></i>
                          ) : (
                            <span className="fs-8 fw-bold">{idx + 1}</span>
                          )}
                        </div>
                        <span className={`d-block fs-8 mt-2 fw-semibold ${isCompleted ? 'text-dark' : 'text-muted'}`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Cancellation Banner */
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-3">
              <div className="d-flex items-start gap-3">
                <i className="bi bi-x-circle-fill text-danger fs-2"></i>
                <div>
                  <h6 className="fw-bold text-danger mb-1">Order Cancelled</h6>
                  <p className="text-dark fs-7 mb-1">
                    Reason: <strong>{cancellation.reason || 'Requested by Customer'}</strong>
                  </p>
                  {cancellation.cancelledAt && (
                    <small className="text-muted d-block fs-8">
                      Cancelled on: {new Date(cancellation.cancelledAt).toLocaleString('en-IN')}
                    </small>
                  )}
                  {order.paymentMethod === 'Razorpay' && order.paymentStatus === 'Refund Pending' && (
                    <div className="mt-2 badge bg-warning text-dark px-3 py-1.5 fs-8">
                      <i className="bi bi-clock-history me-1"></i> Refund Status: Refund Pending (Will be processed within 3-5 working days)
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="row g-4">
            {/* Left: Shipping Address */}
            <div className="col-12 col-md-6">
              <div className="border rounded-3 p-3 bg-light h-100">
                <h6 className="fw-bold text-dark mb-2">
                  <i className="bi bi-geo-alt-fill text-fk-blue me-1"></i> Delivery Shipping Address
                </h6>
                <div className="fw-semibold text-dark fs-7 mb-1">{shippingAddress.fullName}</div>
                <div className="text-muted fs-8 mb-1">Phone: {shippingAddress.phone}</div>
                <div className="text-dark fs-7">
                  {shippingAddress.flatNo}, {shippingAddress.street}, {shippingAddress.city}, {shippingAddress.state} - <strong>{shippingAddress.pincode}</strong>
                </div>
                <span className="badge bg-secondary text-uppercase fs-9 mt-2">{shippingAddress.addressType || 'Home'}</span>
              </div>
            </div>

            {/* Right: Payment Overview */}
            <div className="col-12 col-md-6">
              <div className="border rounded-3 p-3 bg-light h-100">
                <h6 className="fw-bold text-dark mb-2">
                  <i className="bi bi-credit-card-fill text-success me-1"></i> Payment Info
                </h6>
                <div className="d-flex justify-content-between mb-1 fs-7">
                  <span className="text-muted">Payment Method:</span>
                  <span className="fw-bold text-dark">
                    {order.paymentMethod === 'Razorpay' ? 'Razorpay (Online Payment)' : 'Cash on Delivery (COD)'}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-1 fs-7">
                  <span className="text-muted">Payment Status:</span>
                  <span
                    className={`badge ${
                      order.paymentStatus === 'Paid'
                        ? 'bg-success'
                        : order.paymentStatus === 'Refund Pending'
                        ? 'bg-warning text-dark'
                        : order.paymentStatus === 'Failed' || order.paymentStatus === 'Cancelled'
                        ? 'bg-danger'
                        : 'bg-secondary'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
                {order.razorpayPaymentId && (
                  <div className="d-flex justify-content-between mb-1 fs-8">
                    <span className="text-muted">Payment ID:</span>
                    <span className="font-mono text-dark">{order.razorpayPaymentId}</span>
                  </div>
                )}
                {order.razorpayOrderId && (
                  <div className="d-flex justify-content-between mb-1 fs-8">
                    <span className="text-muted">Razorpay Order ID:</span>
                    <span className="font-mono text-dark">{order.razorpayOrderId}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between mt-3 pt-2 border-top fs-6 fw-bold text-dark">
                  <span>Grand Total:</span>
                  <span className="text-dark">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ordered Items Table */}
          <h6 className="fw-bold text-dark mt-4 mb-3">Items in this Order ({order.items.length})</h6>
          <div className="table-responsive border rounded-3 overflow-hidden mb-4">
            <table className="table table-hover align-middle mb-0 fs-7">
              <thead className="table-light">
                <tr>
                  <th scope="col">Product Item</th>
                  <th scope="col" className="text-center">Price</th>
                  <th scope="col" className="text-center">Quantity</th>
                  <th scope="col" className="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={getImageUrl(item.image) || 'https://via.placeholder.com/60?text=Item'}
                          alt={item.name}
                          className="rounded border p-1 bg-light"
                          width="54"
                          height="54"
                          style={{ objectFit: 'contain' }}
                        />
                        <div>
                          <Link to={`/customer/products/${item.product}`} className="fw-semibold text-dark text-decoration-none">
                            {item.name}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="text-center fw-semibold">₹{item.price.toLocaleString('en-IN')}</td>
                    <td className="text-center fw-bold">{item.quantity}</td>
                    <td className="text-end fw-bold text-dark">₹{item.subtotal.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary & Customer Support Footer Row */}
          <div className="row g-4 align-items-start">
            {/* Customer Support Card */}
            <div className="col-12 col-md-7">
              <div className="border rounded-3 p-3.5 bg-blue-50">
                <h6 className="fw-bold text-primary mb-2">
                  <i className="bi bi-headset me-2"></i> Need Help with this Order?
                </h6>
                <p className="text-muted fs-8 mb-3">
                  Have questions about delivery, refunds, or product issues? Reach out to our customer support team directly.
                </p>
                <div className="d-flex flex-wrap gap-3">
                  <a href="tel:8521616449" className="btn btn-outline-primary btn-sm fw-bold">
                    <i className="bi bi-telephone-fill me-1.5"></i> Call: 8521616449
                  </a>
                  <a href="mailto:abhisheksinghdev22@gmail.com" className="btn btn-outline-dark btn-sm fw-bold">
                    <i className="bi bi-envelope-fill me-1.5"></i> Email Support
                  </a>
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="col-12 col-md-5">
              <div className="border rounded-3 p-3 bg-light">
                <div className="d-flex justify-content-between mb-2 fs-7">
                  <span className="text-muted">Subtotal:</span>
                  <span className="fw-semibold">₹{order.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="d-flex justify-content-between mb-2 fs-7">
                  <span className="text-muted">Delivery Charges:</span>
                  <span className={order.deliveryCharge === 0 ? 'text-success fw-semibold' : 'fw-semibold'}>
                    {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
                  </span>
                </div>
                <hr className="my-2" />
                <div className="d-flex justify-content-between fs-6 fw-bold text-dark">
                  <span>Total Paid/Payable:</span>
                  <span className="text-dark">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <CustomerInvoiceModal order={order} onClose={() => setShowInvoiceModal(false)} />
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-danger">Cancel Order #{order.orderNumber}</h5>
                <button type="button" className="btn-close" onClick={() => setShowCancelModal(false)}></button>
              </div>
              <form onSubmit={handleCancelOrder}>
                <div className="modal-body p-4">
                  <p className="text-muted fs-7 mb-3">
                    Are you sure you want to cancel this order? Stock will be restored to inventory.
                  </p>
                  <label className="form-label fw-semibold fs-7 text-dark">Reason for Cancellation *</label>
                  <select
                    className="form-select fs-7 mb-3"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  >
                    <option value="Changed my mind">Changed my mind</option>
                    <option value="Bought by mistake">Bought by mistake</option>
                    <option value="Expected delivery time is too long">Expected delivery time is too long</option>
                    <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                    <option value="Incorrect delivery address">Incorrect delivery address</option>
                  </select>
                </div>
                <div className="modal-footer border-top bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCancelModal(false)}>
                    Back
                  </button>
                  <button type="submit" disabled={cancelling} className="btn btn-danger btn-sm fw-bold">
                    {cancelling ? 'Cancelling Order...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrderDetailPage;
