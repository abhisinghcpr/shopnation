import React from 'react';
import { Link } from 'react-router-dom'; // Fix: react-router-dom

const CustomerFooter = () => {
  return (
    <footer className="bg-dark text-white pt-5 pb-4 mt-auto border-top border-secondary">
      <div className="container">
        <div className="row g-4 mb-4">
          {/* Brand Info */}
          <div className="col-12 col-md-4">
            <h5 className="fw-bold text-primary mb-3">
              <i className="bi bi-cart-dash-fill me-2"></i>ShopNation
            </h5>
            <p className="text-white-50 fs-7 pe-md-3">
              India's trusted online shopping destination for authentic electronics, apparel, appliances, and footwear at unbeatable prices.
            </p>
            <div className="d-flex gap-3 text-white-50 fs-5 mt-3">
              <a href="#facebook" className="text-white-50 hover-text-white" aria-label="Facebook"><i className="bi bi-facebook"></i></a>
              <a href="#twitter" className="text-white-50 hover-text-white" aria-label="Twitter"><i className="bi bi-twitter-x"></i></a>
              <a href="#instagram" className="text-white-50 hover-text-white" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
              <a href="#linkedin" className="text-white-50 hover-text-white" aria-label="LinkedIn"><i className="bi bi-linkedin"></i></a>
            </div>
          </div>

          {/* Customer Navigation */}
          <div className="col-6 col-md-2">
            <h6 className="fw-bold text-white text-uppercase tracking-wider fs-8 mb-3">Shop Pages</h6>
            <ul className="list-unstyled fs-7 d-flex flex-column gap-2 mb-0">
              <li><Link to="/customer/home" className="text-white-50 text-decoration-none">Home</Link></li>
              <li><Link to="/customer/products" className="text-white-50 text-decoration-none">All Products</Link></li>
              <li><Link to="/customer/login" className="text-white-50 text-decoration-none">Customer Sign In</Link></li>
              <li><Link to="/customer/register" className="text-white-50 text-decoration-none">Register Account</Link></li>
            </ul>
          </div>

          {/* Customer Help */}
          <div className="col-6 col-md-3">
            <h6 className="fw-bold text-white text-uppercase tracking-wider fs-8 mb-3">Customer Service</h6>
            <ul className="list-unstyled fs-7 d-flex flex-column gap-2 mb-0">
              <li><a href="#faq" className="text-white-50 text-decoration-none">Help & FAQ</a></li>
              <li><a href="#returns" className="text-white-50 text-decoration-none">Returns & Replacement Policy</a></li>
              <li><a href="#shipping" className="text-white-50 text-decoration-none">Free Shipping Information</a></li>
              <li><a href="#terms" className="text-white-50 text-decoration-none">Terms & Conditions</a></li>
            </ul>
          </div>

          {/* Direct Contact Details */}
          <div className="col-12 col-md-3">
            <h6 className="fw-bold text-white text-uppercase tracking-wider fs-8 mb-3">Contact Support</h6>
            <p className="text-white-50 fs-7 mb-2">
              <i className="bi bi-telephone-fill me-2 text-primary"></i>
              <strong>Phone:</strong> <a href="tel:8521616449" className="text-white text-decoration-none">8521616449</a>
            </p>
            <p className="text-white-50 fs-7 mb-2">
              <i className="bi bi-envelope-fill me-2 text-primary"></i>
              <strong>Email:</strong> <a href="mailto:abhisheksinghdev22@gmail.com" className="text-white text-decoration-none">abhisheksinghdev22@gmail.com</a>
            </p>
            <p className="text-white-50 fs-7 mb-0">
              <i className="bi bi-clock-fill me-2 text-primary"></i>
              <strong>Support Hours:</strong> 24/7 Toll Free
            </p>
          </div>
        </div>

        <div className="border-top border-secondary pt-4 mt-3 d-flex flex-column flex-sm-row align-items-center justify-content-between text-white-50 fs-8">
          <div>&copy; {new Date().getFullYear()} ShopNation E-Commerce. All rights reserved.</div>
          <div className="mt-2 mt-sm-0">
            Secure Payments &bull; Fast Delivery
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CustomerFooter;
