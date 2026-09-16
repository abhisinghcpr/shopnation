import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { getImageUrl } from '../../config/apiConfig';

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    setLoading(true);
    try {
      const data = await orderService.getCustomerOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setErrorMsg(err.message || 'Failed to fetch order history.');
    } finally {
      setLoading(false);
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
      case 'Delivered':
        return <span className="badge bg-success">Delivered</span>;
      case 'Cancelled':
        return <span className="badge bg-danger">Cancelled</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading orders...</span>
        </div>
        <p className="mt-2 text-muted fw-semibold">Loading your orders from MongoDB...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="card-header bg-white py-3 px-4 d-flex align-items-center justify-content-between border-bottom">
          <h5 className="fw-bold text-dark mb-0">
            <i className="bi bi-box-seam text-fk-blue me-2"></i> My Orders ({orders.length})
          </h5>
          <Link to="/customer/products" className="btn btn-fk-blue text-white btn-sm fw-semibold">
            <i className="bi bi-shop me-1"></i> Shop More
          </Link>
        </div>

        <div className="card-body p-4">
          {errorMsg && (
            <div className="alert alert-danger mb-4">
              <i className="bi bi-exclamation-circle-fill me-2"></i> {errorMsg}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-5">
              <div className="w-20 h-20 bg-light text-secondary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3">
                <i className="bi bi-box2 fs-1"></i>
              </div>
              <h5 className="fw-bold text-dark">No Orders Placed Yet</h5>
              <p className="text-muted fs-7 mb-4">You haven't placed any orders with us yet.</p>
              <Link to="/customer/products" className="btn btn-fk-orange text-white fw-bold px-4 py-2">
                Start Shopping Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord._id} className="card border shadow-sm rounded-3 overflow-hidden hover-shadow transition">
                  {/* Order Header Strip */}
                  <div className="bg-light p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div>
                      <span className="text-muted fs-8">Order ID: </span>
                      <strong className="text-dark fs-7 me-3">{ord.orderNumber}</strong>
                      <span className="text-muted fs-8">Placed on: </span>
                      <span className="text-dark fs-8 font-mono">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {getStatusBadge(ord.orderStatus)}
                      <Link
                        to={`/customer/orders/${ord._id}`}
                        className="btn btn-outline-primary btn-sm fw-bold fs-8"
                      >
                        View Details <i className="bi bi-chevron-right ms-0.5"></i>
                      </Link>
                    </div>
                  </div>

                  {/* Items List Snapshot */}
                  <div className="p-3">
                    <div className="row g-3 align-items-center">
                      <div className="col-12 col-md-8">
                        <div className="d-flex align-items-center gap-3 overflow-auto py-1">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="d-flex align-items-center gap-2 flex-shrink-0 border rounded p-1.5 bg-white">
                              <img
                                src={getImageUrl(item.image) || 'https://via.placeholder.com/50?text=Item'}
                                alt={item.name}
                                className="rounded"
                                width="44"
                                height="44"
                                style={{ objectFit: 'contain' }}
                              />
                              <div style={{ maxWidth: '160px' }}>
                                <div className="fw-semibold text-dark fs-8 text-truncate">{item.name}</div>
                                <span className="text-muted fs-9">
                                  Qty: {item.quantity} x ₹{item.price.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="col-12 col-md-4 text-md-end border-start-md pt-2 pt-md-0">
                        <span className="text-muted fs-8 d-block">Total Amount ({ord.paymentMethod})</span>
                        <span className="fw-bold text-dark fs-5">₹{ord.totalAmount.toLocaleString('en-IN')}</span>
                        <div className="fs-9 text-muted mt-0.5">
                          Payment Status: <span className="fw-semibold text-secondary">{ord.paymentStatus}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerOrdersPage;
