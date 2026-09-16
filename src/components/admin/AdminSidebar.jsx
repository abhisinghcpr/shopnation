import React from 'react';
import { NavLink } from 'react-router-dom';

const AdminSidebar = ({ isOpen, closeSidebar }) => {
  const navItems = [
    {
      title: 'Dashboard',
      path: '/admin/dashboard',
      icon: 'bi-speedometer2',
      badge: null
    },
    {
      title: 'Category Management',
      path: '/admin/categories',
      icon: 'bi-grid-3x3-gap-fill',
      badge: null
    },
    {
      title: 'Product Management',
      path: '/admin/products',
      icon: 'bi-box-seam',
      badge: null
    },
    {
      title: 'Customer Orders',
      path: '/admin/orders',
      icon: 'bi-cart-check',
      badge: null
    },
    {
      title: 'Product Reviews',
      path: '/admin/reviews',
      icon: 'bi-star-half',
      badge: null
    },
    {
      title: 'Email Logs',
      path: '/admin/email-logs',
      icon: 'bi-envelope-check',
      badge: null
    },
    {
      title: 'Registered Customers',
      path: '/admin/customers',
      icon: 'bi-people-fill',
      badge: 'Soon'
    },
  ];

  return (
    <aside
      className={`admin-sidebar bg-dark text-white p-3 border-end shadow-sm ${
        isOpen ? 'show-sidebar' : ''
      }`}
      style={{
        minWidth: '250px',
        maxWidth: '250px',
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom border-secondary">
        <span className="fs-6 fw-bold text-uppercase text-light tracking-wide">
          <i className="bi bi-sliders me-2 text-primary"></i> Navigation
        </span>
        <button
          className="btn btn-sm text-white-50 d-lg-none"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        >
          <i className="bi bi-x-lg fs-5"></i>
        </button>
      </div>

      <ul className="nav nav-pills flex-column mb-auto gap-1">
        {navItems.map((item, idx) => (
          <li className="nav-item" key={idx}>
            <NavLink
              to={item.path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center justify-content-between px-3 py-2.5 rounded-3 text-white ${
                  isActive ? 'active bg-primary text-white fw-bold shadow-sm' : 'text-white-50 hover-bg-dark'
                }`
              }
            >
              <div className="d-flex align-items-center">
                <i className={`bi ${item.icon} me-3 fs-5`}></i>
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span className="badge bg-secondary text-uppercase fs-9">{item.badge}</span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4 border-top border-secondary">
        <div className="p-3 bg-secondary bg-opacity-25 rounded-3 text-center">
          <small className="text-white-50 d-block mb-1">E-Commerce Admin</small>
          <span className="badge bg-success bg-opacity-75">v1.0.0 Express API</span>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
