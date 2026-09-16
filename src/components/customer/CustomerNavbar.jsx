import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

const CustomerNavbar = () => {
  const { customer, isAuthenticated, logoutCustomer, cartCount, wishlistCount, unreadNotificationsCount } = useCustomerAuth();
  const [searchKeyword, setSearchKeyword] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/customer/products?search=${encodeURIComponent(searchKeyword.trim())}`);
    } else {
      navigate('/customer/products');
    }
  };

  const handleLogout = () => {
    logoutCustomer();
    navigate('/customer/home');
  };

  return (
    <header className="sticky-top shadow-sm">
      {/* Flipkart Navy Header */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-fk-blue py-2.5">
        <div className="container">
          {/* Brand Logo & Flipkart-style Plus Tagline */}
          <Link className="navbar-brand d-flex flex-column m-0 me-4 text-decoration-none" to="/customer/home">
            <span className="fw-bold fs-4 text-white italic leading-none">
              Shop<span className="text-fk-yellow">Nation</span>
            </span>
            <small className="fs-9 text-white-50 fst-italic">
              Explore <span className="text-fk-yellow fw-bold">Plus <i className="bi bi-plus-lg"></i></span>
            </small>
          </Link>

          {/* Central Flipkart Search Bar */}
          <form
            className="d-flex flex-grow-1 mx-lg-4 my-2 my-lg-0"
            style={{ maxWidth: '560px' }}
            onSubmit={handleSearchSubmit}
          >
            <div className="input-group shadow-sm">
              <input
                type="text"
                className="form-control bg-white border-0 fs-7 px-3"
                placeholder="Search for products, brands and more"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <button className="btn btn-light text-fk-blue px-3 border-0 bg-white" type="submit">
                <i className="bi bi-search fs-6"></i>
              </button>
            </div>
          </form>

          {/* Toggler for mobile */}
          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#customerNavbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="customerNavbarNav">
            {/* Account, Wishlist & Cart Actions */}
            <div className="d-flex align-items-center gap-3 ms-auto mt-2 mt-lg-0">
              {/* Account Dropdown / Login Button */}
              {isAuthenticated ? (
                <div className="dropdown">
                  <button
                    className="btn btn-light dropdown-toggle d-flex align-items-center gap-2 px-3 py-1.5 rounded-2 fw-semibold fs-7"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <img
                      src={customer?.avatar || 'https://via.placeholder.com/28'}
                      alt={customer?.name}
                      className="rounded-circle"
                      width="24"
                      height="24"
                    />
                    <span className="text-dark">{customer?.name?.split(' ')[0]}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2">
                    <li>
                      <div className="dropdown-header">
                        Logged in as <strong>{customer?.email}</strong>
                      </div>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <Link className="dropdown-item d-flex align-items-center" to="/customer/orders">
                        <i className="bi bi-box-seam me-2 text-primary"></i> My Orders
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item d-flex align-items-center" to="/customer/addresses">
                        <i className="bi bi-geo-alt me-2 text-danger"></i> Saved Addresses
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item d-flex align-items-center" to="/customer/wishlist">
                        <i className="bi bi-heart me-2 text-warning"></i> My Wishlist
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item text-danger d-flex align-items-center" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i> Logout
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <Link to="/customer/login" className="btn btn-light text-fk-blue fw-bold px-4 py-1.5 rounded-1 fs-7 shadow-sm">
                  Login
                </Link>
              )}

              {/* Notification Bell Icon */}
              {isAuthenticated && (
                <Link to="/customer/notifications" className="btn text-white position-relative px-2.5 py-1.5 d-flex align-items-center" title="Notifications">
                  <i className="bi bi-bell fs-5 me-1"></i>
                  <span className="fw-semibold fs-7 d-none d-xl-inline">Alerts</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger fs-9">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Wishlist Icon */}
              <Link to="/customer/wishlist" className="btn text-white position-relative px-2.5 py-1.5 d-flex align-items-center">
                <i className="bi bi-heart fs-5 me-1"></i>
                <span className="fw-semibold fs-7 d-none d-xl-inline">Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-fk-orange fs-9">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link to="/customer/cart" className="btn text-white position-relative px-2.5 py-1.5 d-flex align-items-center">
                <i className="bi bi-cart3 fs-5 me-1"></i>
                <span className="fw-semibold fs-7 d-none d-xl-inline">Cart</span>
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-fk-yellow text-dark fw-bold fs-9">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default CustomerNavbar;
