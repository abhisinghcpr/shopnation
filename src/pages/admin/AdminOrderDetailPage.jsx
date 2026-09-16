import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { getImageUrl } from '../../config/apiConfig';

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState({ type: '', text: '' });

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAdminOrderById(id);
      setOrder(data);
    } catch (err) {
      setError(err.message || 'Error fetching order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      setStatusUpdating(true);
      setUpdateMsg({ type: '', text: '' });
      const res = await orderService.updateOrderStatusAdmin(order._id, { orderStatus: newStatus });
      setOrder(res.order);
      setUpdateMsg({ type: 'success', text: `Order status updated to "${newStatus}"` });
    } catch (err) {
      setUpdateMsg({ type: 'danger', text: err.message || 'Failed to update order status.' });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePaymentStatusChange = async (newPayStatus) => {
    try {
      setStatusUpdating(true);
      setUpdateMsg({ type: '', text: '' });
      const res = await orderService.updateOrderStatusAdmin(order._id, { paymentStatus: newPayStatus });
      setOrder(res.order);
      setUpdateMsg({ type: 'success', text: `Payment status updated to "${newPayStatus}"` });
    } catch (err) {
      setUpdateMsg({ type: 'danger', text: err.message || 'Failed to update payment status.' });
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="admin-layout" style={{ minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
      <AdminNavbar />
      <div className="d-flex">
        <AdminSidebar />
        <main className="flex-grow-1 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <Link to="/admin/orders" className="btn btn-outline-secondary btn-sm mb-2">
                <i className="bi bi-arrow-left me-1"></i> Back to Orders
              </Link>

              <h2 className="fw-bold mb-0">Order Details</h2>
            </div>
          </div>

          {updateMsg.text && (
            <div className={`alert alert-${updateMsg.type} alert-dismissible fade show`} role="alert">
              {updateMsg.text}
              <button type="button" className="btn-close" onClick={() => setUpdateMsg({ type: '', text: '' })}></button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger mb-4">{error}</div>
          ) : order ? (
            <div className="row g-4">
              {/* Order Info Overview */}
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1 fw-bold">Order #{order.orderNumber || order._id}</h5>
                      <span className="text-muted small">
                        Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div>
                      <span className={`badge bg-${
                        order.orderStatus === 'Delivered' ? 'success' :
                        order.orderStatus === 'Cancelled' ? 'danger' :
                        order.orderStatus === 'Shipped' || order.orderStatus === 'Out for Delivery' ? 'info' : 'warning'
                      } fs-6 px-3 py-2`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>

                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Ordered Items ({order.items?.length || 0})</h6>
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th className="text-end">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items?.map((item, idx) => (
                            <tr key={idx}>
                              <td>
                                <div className="d-flex align-items-center">
                                  {item.image ? (
                                    <img
                                      src={getImageUrl(item.image)}
                                      alt={item.name}
                                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                                      className="me-3"
                                    />
                                  ) : (
                                    <div className="bg-light me-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', borderRadius: '4px' }}>
                                      <i className="bi bi-box-seam text-secondary"></i>
                                    </div>
                                  )}
                                  <div>
                                    <div className="fw-semibold">{item.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td>₹{item.price?.toLocaleString('en-IN')}</td>
                              <td>{item.quantity}</td>
                              <td className="text-end fw-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="3" className="text-end text-muted">Subtotal</td>
                            <td className="text-end fw-semibold">₹{(order.pricing?.itemsPrice || order.totalAmount)?.toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td colSpan="3" className="text-end text-muted">Shipping Charges</td>
                            <td className="text-end fw-semibold text-success">
                              {order.pricing?.shippingPrice === 0 ? 'FREE' : `₹${order.pricing?.shippingPrice}`}
                            </td>
                          </tr>
                          <tr className="border-top table-light">
                            <td colSpan="3" className="text-end fw-bold">Grand Total</td>
                            <td className="text-end fw-bold fs-5 text-primary">
                              ₹{(order.pricing?.finalTotal || order.totalAmount)?.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {order.cancellation && order.cancellation.reason && (
                      <div className="alert alert-warning mt-3">
                        <h6 className="fw-bold mb-1"><i className="bi bi-exclamation-triangle me-1"></i> Cancellation Details</h6>
                        <div><strong>Reason:</strong> {order.cancellation.reason}</div>
                        <div><strong>Cancelled By:</strong> {order.cancellation.cancelledBy}</div>
                        <div><strong>Date:</strong> {new Date(order.cancellation.cancelledAt).toLocaleString('en-IN')}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Management & Customer Details Sidebar */}
              <div className="col-lg-4">
                {/* Admin Status Controls */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white py-3">
                    <h5 className="mb-0 fw-bold">Manage Order Status</h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Order Status</label>
                      <select
                        className="form-select"
                        value={order.orderStatus}
                        disabled={statusUpdating || order.orderStatus === 'Cancelled' || order.orderStatus === 'Delivered'}
                        onChange={(e) => handleStatusChange(e.target.value)}
                      >
                        <option value="Placed">Placed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      {order.orderStatus === 'Cancelled' && (
                        <div className="form-text text-danger">Cancelled orders cannot change status.</div>
                      )}
                      {order.orderStatus === 'Delivered' && (
                        <div className="form-text text-success">Delivered orders are completed.</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Payment Status</label>
                      <select
                        className="form-select"
                        value={order.paymentStatus}
                        disabled={statusUpdating}
                        onChange={(e) => handlePaymentStatusChange(e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                        <option value="Refund Pending">Refund Pending</option>
                        <option value="Refunded">Refunded</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="p-3 bg-light rounded">
                      <div className="small text-muted mb-1"><strong>Payment Method:</strong> {order.paymentMethod?.toUpperCase()}</div>
                      {order.paymentInfo?.razorpayPaymentId && (
                        <div className="small text-muted mb-1"><strong>Razorpay Payment ID:</strong> {order.paymentInfo.razorpayPaymentId}</div>
                      )}
                      {order.paymentInfo?.razorpayOrderId && (
                        <div className="small text-muted"><strong>Razorpay Order ID:</strong> {order.paymentInfo.razorpayOrderId}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white py-3">
                    <h5 className="mb-0 fw-bold">Customer Info</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '42px', height: '42px', fontSize: '1.2rem' }}>
                        <i className="bi bi-person"></i>
                      </div>
                      <div>
                        <div className="fw-bold">{order.customer?.name || order.shippingAddress?.fullName || 'N/A'}</div>
                        <div className="text-muted small">{order.customer?.email || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="small text-muted mb-2">
                      <i className="bi bi-telephone me-2"></i> {order.customer?.phone || order.shippingAddress?.mobileNumber || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white py-3">
                    <h5 className="mb-0 fw-bold">Shipping Address</h5>
                  </div>
                  <div className="card-body">
                    {order.shippingAddress ? (
                      <div>
                        <div className="fw-semibold mb-1">{order.shippingAddress.fullName}</div>
                        <div className="text-muted small mb-1">
                          {order.shippingAddress.houseNo}, {order.shippingAddress.street}
                        </div>
                        <div className="text-muted small mb-1">
                          {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                        </div>
                        <div className="text-muted small mb-1">
                          Phone: {order.shippingAddress.mobileNumber}
                        </div>
                        {order.shippingAddress.addressType && (
                          <span className="badge bg-light text-dark border mt-1">
                            {order.shippingAddress.addressType}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted small">No shipping address recorded.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;
