import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Admin Imports
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminCategoryPage from '../pages/admin/AdminCategoryPage';
import AdminProductPage from '../pages/admin/AdminProductPage';
import AdminOrderPage from '../pages/admin/AdminOrderPage';
import AdminOrderDetailPage from '../pages/admin/AdminOrderDetailPage';
import AdminReviewPage from '../pages/admin/AdminReviewPage';
import AdminEmailLogsPage from '../pages/admin/AdminEmailLogsPage';
import AdminLayout from '../components/admin/AdminLayout';
import AdminProtectedRoute from './AdminProtectedRoute';

// Customer Imports
import CustomerLayout from '../components/customer/CustomerLayout';
import CustomerHomePage from '../pages/customer/CustomerHomePage';
import CustomerProductListPage from '../pages/customer/CustomerProductListPage';
import CustomerProductDetailPage from '../pages/customer/CustomerProductDetailPage';
import CustomerLoginPage from '../pages/customer/CustomerLoginPage';
import CustomerRegisterPage from '../pages/customer/CustomerRegisterPage';
import CustomerCartPage from '../pages/customer/CustomerCartPage';
import CustomerWishlistPage from '../pages/customer/CustomerWishlistPage';
import CustomerAddressPage from '../pages/customer/CustomerAddressPage';
import CustomerCheckoutPage from '../pages/customer/CustomerCheckoutPage';
import CustomerOrdersPage from '../pages/customer/CustomerOrdersPage';
import CustomerOrderDetailPage from '../pages/customer/CustomerOrderDetailPage';
import CustomerProtectedRoute from './CustomerProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Customer Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/customer/home" element={<CustomerHomePage />} />
        <Route path="/customer/products" element={<CustomerProductListPage />} />
        <Route path="/customer/products/:id" element={<CustomerProductDetailPage />} />
        <Route path="/customer/login" element={<CustomerLoginPage />} />
        <Route path="/customer/register" element={<CustomerRegisterPage />} />

        {/* Protected Customer Routes */}
        <Route element={<CustomerProtectedRoute />}>
          <Route path="/customer/cart" element={<CustomerCartPage />} />
          <Route path="/customer/wishlist" element={<CustomerWishlistPage />} />
          <Route path="/customer/addresses" element={<CustomerAddressPage />} />
          <Route path="/customer/checkout" element={<CustomerCheckoutPage />} />
          <Route path="/customer/orders" element={<CustomerOrdersPage />} />
          <Route path="/customer/orders/:id" element={<CustomerOrderDetailPage />} />
        </Route>
      </Route>

      {/* Admin Public Routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Admin Protected Routes */}
      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/categories" element={<AdminCategoryPage />} />
          <Route path="/admin/products" element={<AdminProductPage />} />
          <Route path="/admin/orders" element={<AdminOrderPage />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="/admin/reviews" element={<AdminReviewPage />} />
          <Route path="/admin/email-logs" element={<AdminEmailLogsPage />} />
          <Route
            path="/admin/customers"
            element={
              <div className="alert alert-info shadow-sm p-4 m-3">
                <h4><i className="bi bi-people me-2"></i>Registered Customers (Phase 3)</h4>
                <p className="mb-0">This module will display registered customer profiles and activity.</p>
              </div>
            }
          />
        </Route>
      </Route>

      {/* Root & Fallback Navigation Redirects */}
      <Route path="/" element={<Navigate to="/customer/home" replace />} />
      <Route path="/customer" element={<Navigate to="/customer/home" replace />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/customer/home" replace />} />
    </Routes>
  );
};

export default AppRoutes;
