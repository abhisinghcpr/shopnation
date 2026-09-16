import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { getImageUrl } from '../../config/apiConfig';

const AdminOrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchAdminOrders();
  }, [statusFilter, paymentFilter, dateFilter, searchTerm]);

  const showToast = (setter, msg) => {
    setter(msg);
    setTimeout(() => setter(''), 3500);
  };

  const fetchAdminOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (paymentFilter !== 'ALL') params.paymentStatus = paymentFilter;
      if (dateFilter) params.date = dateFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await orderService.getAllOrdersAdmin(params);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
      showToast(setErrorMsg, err.message || 'Failed to fetch admin orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newOrderStatus, newPaymentStatus) => {
    setUpdatingId(orderId);
    setErrorMsg('');
    try {
      const payload = {};
      if (newOrderStatus) payload.orderStatus = newOrderStatus;
      if (newPaymentStatus) payload.paymentStatus = newPaymentStatus;

      const res = await orderService.updateOrderStatusAdmin(orderId, payload);
      setOrders((prev) =>
        prev.map((ord) => (ord._id === orderId ? { ...ord, ...res.order } : ord))
      );
      showToast(setSuccessMsg, 'Order status updated successfully!');
    } catch (err) {
      showToast(setErrorMsg, err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Placed':
        return <span className="badge bg-primary">Placed</span>;
      case 'Processing':
        return <span className="badge bg-info text-dark">Processing</span>;
      case 'Shipped':
        return <span className="badge bg-warning text-dark">Shipped</span>;
      case 'Out for Delivery':
        return <span className="badge bg-secondary">Out for Delivery</span>;
      case 'Delivered':
        return <span className="badge bg-success">Delivered</span>;
      case 'Cancelled':
        return <span className="badge bg-danger">Cancelled</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Page Title & Controls */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">
            <i className="bi bi-receipt me-2 text-primary"></i> Customer Orders Management
          </h3>
          <p className="text-muted mb-0 fs-7">
            Manage customer order processing, shipping status, and payment updates.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Search Box */}
          <div className="input-group input-group-sm" style={{ width: '240px' }}>
            <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search Order #, Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Date Filter */}
          <input
            type="date"
            className="form-control form-control-sm fs-7 w-auto"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            title="Filter by Order Date"
          />

          {/* Payment Status Filter */}
          <select
            className="form-select form-select-sm fs-7 w-auto"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="ALL">All Payments</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Failed">Failed</option>
            <option value="Refund Pending">Refund Pending</option>
            <option value="Refunded">Refunded</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Order Status Filter */}
          <select
            className="form-select form-select-sm fs-7 w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses ({orders.length})</option>
            <option value="Placed">Placed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Toast Messages */}
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

      {/* Orders Table */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading admin orders...</span>
              </div>
              <p className="mt-2 text-muted fs-7">Loading customer orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox fs-1 text-secondary d-block mb-2"></i>
              <h6 className="fw-bold text-dark">No Orders Found</h6>
              <p className="text-muted fs-8">No customer orders match the selected criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-7">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-4">Order ID & Date</th>
                    <th scope="col">Customer Details</th>
                    <th scope="col">Items Ordered</th>
                    <th scope="col">Total Price</th>
                    <th scope="col">Payment Status</th>
                    <th scope="col">Order Status</th>
                    <th scope="col" className="pe-4 text-end">Actions & Update</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => {
                    const isUpdating = updatingId === ord._id;
                    const cust = ord.customer || {};

                    return (
                      <tr key={ord._id}>
                        <td className="ps-4">
                          <strong className="text-dark d-block">{ord.orderNumber}</strong>
                          <span className="text-muted fs-8">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </td>

                        <td>
                          <div className="fw-bold text-dark">{cust.name || ord.shippingAddress?.fullName || 'Customer'}</div>
                          <div className="text-muted fs-8">{cust.email || 'N/A'}</div>
                          <div className="text-muted fs-8">{cust.phone || ord.shippingAddress?.mobileNumber}</div>
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-1.5 overflow-auto py-1">
                            {ord.items.map((it, i) => (
                              <img
                                key={i}
                                src={getImageUrl(it.image) || 'https://via.placeholder.com/40?text=Item'}
                                alt={it.name}
                                className="rounded border bg-light"
                                width="36"
                                height="36"
                                title={`${it.name} (Qty: ${it.quantity})`}
                                style={{ objectFit: 'contain' }}
                              />
                            ))}
                            <span className="badge bg-light text-dark border fs-9">
                              {ord.items.length} item(s)
                            </span>
                          </div>
                        </td>

                        <td>
                          <strong className="text-dark fs-6">₹{(ord.pricing?.finalTotal || ord.totalAmount)?.toLocaleString('en-IN')}</strong>
                          <span className="text-muted fs-8 d-block">({ord.paymentMethod})</span>
                        </td>

                        <td>
                          <select
                            className="form-select form-select-sm fs-8 w-auto border-secondary-subtle"
                            value={ord.paymentStatus}
                            onChange={(e) => handleUpdateStatus(ord._id, null, e.target.value)}
                            disabled={isUpdating}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Failed">Failed</option>
                            <option value="Refund Pending">Refund Pending</option>
                            <option value="Refunded">Refunded</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>

                        <td>{getStatusBadge(ord.orderStatus)}</td>

                        <td className="pe-4 text-end">
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <Link to={`/admin/orders/${ord._id}`} className="btn btn-sm btn-outline-primary fs-8">
                              <i className="bi bi-eye"></i> View
                            </Link>

                            <select
                              className="form-select form-select-sm fs-8 w-auto fw-bold"
                              value={ord.orderStatus}
                              onChange={(e) => handleUpdateStatus(ord._id, e.target.value, null)}
                              disabled={isUpdating || ord.orderStatus === 'Cancelled' || ord.orderStatus === 'Delivered'}
                            >
                              <option value="Placed">Placed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
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

export default AdminOrderPage;
