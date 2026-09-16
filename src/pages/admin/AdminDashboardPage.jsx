import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { statsService } from '../../services/statsService';

const AdminDashboardPage = () => {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalProducts: 0,
    totalOrders: null,
    totalCustomers: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await statsService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Unable to load dashboard metrics from server.');
    } finally {
      setLoading(false);
    }
  };

  const overviewCards = [
    {
      title: 'Total Categories',
      value: loading ? '...' : stats.totalCategories,
      icon: 'bi-grid-3x3-gap-fill',
      color: 'primary',
      link: '/admin/categories',
      linkText: 'Manage Categories',
      isLive: true,
    },
    {
      title: 'Total Products',
      value: loading ? '...' : stats.totalProducts,
      icon: 'bi-box-seam-fill',
      color: 'success',
      link: '/admin/products',
      linkText: 'Manage Products',
      isLive: true,
    },
    {
      title: 'Total Orders',
      value: 'Not Available',
      icon: 'bi-cart-check-fill',
      color: 'warning',
      link: '/admin/orders',
      linkText: 'Coming Soon',
      isLive: false,
    },
    {
      title: 'Total Customers',
      value: 'Not Available',
      icon: 'bi-people-fill',
      color: 'info',
      link: '/admin/customers',
      linkText: 'Coming Soon',
      isLive: false,
    },
  ];

  return (
    <div className="container-fluid p-0">
      {/* Welcome Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            Welcome back, {admin?.name || 'Admin'} <span className="fs-4">👋</span>
          </h2>
          <p className="text-muted mb-0">Live Overview & Performance Metrics from MongoDB</p>
        </div>
        <div className="mt-3 mt-md-0">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchDashboardMetrics} disabled={loading}>
            <i className={`bi bi-arrow-repeat me-1 ${loading ? 'spin' : ''}`}></i> Refresh Stats
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger shadow-sm mb-4">
          <i className="bi bi-exclamation-octagon-fill me-2"></i>
          {error}
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="row g-3 mb-4">
        {overviewCards.map((card, idx) => (
          <div className="col-12 col-sm-6 col-xl-3" key={idx}>
            <div className="card border-0 shadow-sm rounded-3 h-100 position-relative overflow-hidden">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <span className="text-muted text-uppercase fw-semibold fs-8 tracking-wider">{card.title}</span>
                    <h3 className="fw-bold text-dark mt-1 mb-0">
                      {card.isLive ? card.value : <span className="fs-6 text-muted font-monospace">{card.value}</span>}
                    </h3>
                  </div>
                  <div className={`p-3 bg-${card.color} bg-opacity-10 text-${card.color} rounded-3`}>
                    <i className={`bi ${card.icon} fs-2`}></i>
                  </div>
                </div>

                <div className="pt-2 border-top">
                  {card.isLive ? (
                    <Link
                      to={card.link}
                      className={`text-${card.color} fw-semibold text-decoration-none fs-7 d-flex align-items-center justify-content-between`}
                    >
                      <span>{card.linkText}</span>
                      <i className="bi bi-arrow-right"></i>
                    </Link>
                  ) : (
                    <span className="text-muted fs-8 fw-semibold d-flex align-items-center justify-content-between">
                      <span>{card.linkText}</span>
                      <span className="badge bg-secondary bg-opacity-25 text-secondary">Phase 3</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Status Row */}
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-lightning-charge-fill text-warning me-2"></i> Navigation Shortcuts
              </h5>
            </div>
            <div className="card-body p-3">
              <div className="list-group list-group-flush">
                <Link
                  to="/admin/categories"
                  className="list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 rounded-2 mb-1"
                >
                  <div className="d-flex align-items-center">
                    <div className="p-2 bg-primary bg-opacity-10 text-primary rounded me-3">
                      <i className="bi bi-grid-3x3-gap-fill fs-5"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">Category Management</h6>
                      <small className="text-muted">Manage real categories & Multer image uploads</small>
                    </div>
                  </div>
                  <span className="badge bg-primary">Live API</span>
                </Link>

                <Link
                  to="/admin/products"
                  className="list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 rounded-2 mb-1"
                >
                  <div className="d-flex align-items-center">
                    <div className="p-2 bg-success bg-opacity-10 text-success rounded me-3">
                      <i className="bi bi-box-seam-fill fs-5"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">Product Management</h6>
                      <small className="text-muted">Manage product catalog & stock levels</small>
                    </div>
                  </div>
                  <span className="badge bg-success">Live API</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-database-check text-primary me-2"></i> Express & MongoDB Status
              </h5>
            </div>
            <div className="card-body p-4">
              <ul className="list-unstyled mb-0">
                <li className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                  <span className="fw-semibold text-secondary">Database:</span>
                  <span className="badge bg-success">MongoDB (ecommerce_db)</span>
                </li>
                <li className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                  <span className="fw-semibold text-secondary">File Storage:</span>
                  <span className="badge bg-success">Multer Local (/uploads)</span>
                </li>
                <li className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                  <span className="fw-semibold text-secondary">Authentication:</span>
                  <span className="badge bg-primary">Express JWT & bcryptjs</span>
                </li>
                <li className="d-flex align-items-center justify-content-between">
                  <span className="fw-semibold text-secondary">Mock Data:</span>
                  <span className="badge bg-danger">Completely Removed</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
