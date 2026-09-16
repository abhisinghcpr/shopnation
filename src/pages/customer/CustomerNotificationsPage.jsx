import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

const CustomerNotificationsPage = () => {
  const navigate = useNavigate();
  const { refreshUnreadNotifications } = useCustomerAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const showToast = (type, text) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg({ type: '', text: '' }), 3500);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setErrorMsg(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      refreshUnreadNotifications();
    } catch (err) {
      showToast('danger', err.message || 'Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refreshUnreadNotifications();
      showToast('success', 'All notifications marked as read');
    } catch (err) {
      showToast('danger', err.message || 'Failed to mark all as read');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      refreshUnreadNotifications();
      showToast('success', 'Notification deleted');
    } catch (err) {
      showToast('danger', err.message || 'Failed to delete notification');
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif._id);
    }

    if (notif.order?._id || notif.order) {
      const orderId = notif.order?._id || notif.order;
      navigate(`/customer/orders/${orderId}`);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'ORDER_PLACED':
        return <span className="badge bg-primary"><i className="bi bi-box-seam me-1"></i> Placed</span>;
      case 'ORDER_STATUS_UPDATE':
        return <span className="badge bg-info text-dark"><i className="bi bi-arrow-repeat me-1"></i> Update</span>;
      case 'PAYMENT_UPDATE':
        return <span className="badge bg-success"><i className="bi bi-currency-rupee me-1"></i> Payment</span>;
      case 'ORDER_CANCELLED':
        return <span className="badge bg-danger"><i className="bi bi-x-circle me-1"></i> Cancelled</span>;
      case 'ADMIN_MESSAGE':
        return <span className="badge bg-warning text-dark"><i className="bi bi-megaphone me-1"></i> Notice</span>;
      default:
        return <span className="badge bg-secondary">Alert</span>;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="container py-4" style={{ maxWidth: '850px' }}>
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb fs-8">
          <li className="breadcrumb-item"><Link to="/customer/home">Home</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Notifications</li>
        </ol>
      </nav>

      {/* Header & Controls */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">
            <i className="bi bi-bell me-2 text-fk-blue"></i> Customer Notifications
          </h3>
          <p className="text-muted mb-0 fs-7">
            Stay updated with your order statuses, payment alerts, and store messages.
          </p>
        </div>

        {notifications.length > 0 && unreadCount > 0 && (
          <button
            className="btn btn-sm btn-outline-primary fw-bold px-3 py-1.5"
            onClick={handleMarkAllAsRead}
          >
            <i className="bi bi-check2-all me-1"></i> Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Action Toast */}
      {actionMsg.text && (
        <div className={`alert alert-${actionMsg.type} alert-dismissible fade show shadow-sm mb-4`} role="alert">
          {actionMsg.text}
          <button type="button" className="btn-close" onClick={() => setActionMsg({ type: '', text: '' })}></button>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger shadow-sm mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMsg}
        </div>
      )}

      {/* Notifications List Card */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading notifications...</span>
              </div>
              <p className="mt-2 text-muted fs-7">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-bell-slash fs-1 text-secondary d-block mb-2"></i>
              <h5 className="fw-bold text-dark">No Notifications Yet</h5>
              <p className="text-muted fs-7 mb-3">You will receive updates here when you place orders or receive status updates.</p>
              <Link to="/customer/products" className="btn btn-primary btn-sm fw-bold">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`list-group-item list-group-item-action p-4 border-bottom ${
                    !notif.isRead ? 'bg-primary bg-opacity-10' : ''
                  }`}
                  style={{ cursor: notif.order ? 'pointer' : 'default', transition: 'background-color 0.2s' }}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div className="d-flex align-items-start gap-3">
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1 ${
                          !notif.isRead ? 'bg-primary text-white' : 'bg-light text-secondary'
                        }`}
                        style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}
                      >
                        <i className={`bi ${notif.isRead ? 'bi-bell' : 'bi-bell-fill'}`}></i>
                      </div>

                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <h6 className="fw-bold text-dark mb-0">{notif.title}</h6>
                          {getTypeBadge(notif.type)}
                          {!notif.isRead && (
                            <span className="badge bg-danger rounded-pill fs-9">New</span>
                          )}
                        </div>

                        <p className="text-secondary mb-2 fs-7">{notif.message}</p>

                        <div className="d-flex align-items-center gap-3 fs-8 text-muted">
                          <span>
                            <i className="bi bi-clock me-1"></i>
                            {new Date(notif.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>

                          {notif.order && (
                            <span className="text-primary fw-semibold">
                              <i className="bi bi-box-arrow-up-right me-1"></i> View Order Details
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {!notif.isRead && (
                        <button
                          className="btn btn-sm btn-light text-primary border"
                          title="Mark as Read"
                          onClick={(e) => handleMarkAsRead(notif._id, e)}
                        >
                          <i className="bi bi-check2"></i>
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-light text-danger border"
                        title="Delete Notification"
                        onClick={(e) => handleDelete(notif._id, e)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
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

export default CustomerNotificationsPage;
