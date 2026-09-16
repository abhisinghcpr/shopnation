import React from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';

const AdminNavbar = ({ toggleSidebar }) => {
  const { admin, logoutAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  return (
    <nav className="navbar navbar-expand-lg sticky-top bg-white border-bottom shadow-sm px-3">
      <div className="container-fluid p-0">
        <div className="d-flex align-items-center">
          <button
            className="btn btn-outline-secondary me-3 d-lg-none"
            type="button"
            onClick={toggleSidebar}
            aria-label="Toggle Navigation Sidebar"
          >
            <i className="bi bi-list fs-5"></i>
          </button>
          
          <a className="navbar-brand d-flex align-items-center fw-bold text-primary m-0" href="/admin/dashboard">
            <i className="bi bi-shield-lock-fill me-2 fs-4 text-primary"></i>
            <span>Admin Portal</span>
          </a>
        </div>

        <div className="d-flex align-items-center ms-auto">
          {/* Admin Profile Dropdown */}
          <div className="dropdown me-2">
            <div
              className="d-flex align-items-center cursor-pointer dropdown-toggle"
              id="adminProfileDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ cursor: 'pointer' }}
            >
              <img
                src={admin?.avatar || 'https://via.placeholder.com/40'}
                alt={admin?.name || 'Admin'}
                className="rounded-circle me-2 border border-2 border-primary"
                width="38"
                height="38"
              />
              <div className="d-none d-md-block text-start me-2">
                <div className="fw-semibold text-dark fs-7 leading-tight">{admin?.name || 'Admin User'}</div>
                <small className="text-muted fs-8">{admin?.email || 'admin@ecommerce.com'}</small>
              </div>
            </div>

            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2" aria-labelledby="adminProfileDropdown">
              <li>
                <div className="dropdown-header">
                  <strong>Role:</strong> <span className="badge bg-primary ms-1">{admin?.role || 'Admin'}</span>
                </div>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item text-danger d-flex align-items-center" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </div>

          <button
            className="btn btn-outline-danger btn-sm d-flex align-items-center ms-2"
            onClick={handleLogout}
            title="Logout"
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            <span className="d-none d-sm-inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
