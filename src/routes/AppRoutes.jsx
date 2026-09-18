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
import CustomerErrorBoundary from '../components/customer/CustomerErrorBoundary';
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
import CustomerNotificationsPage from '../pages/customer/CustomerNotificationsPage';
import CustomerProtectedRoute from './CustomerProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Customer Routes */}
      <Route element={<CustomerLayout />}>
        <Route
          path="/customer/home"
          element={
            <CustomerErrorBoundary>
              <CustomerHomePage />
            </CustomerErrorBoundary>
          }
        />
        <Route
          path="/customer/products"
          element={
            <CustomerErrorBoundary>
              <CustomerProductListPage />
            </CustomerErrorBoundary>
          }
        />
        <Route
          path="/customer/products/:id"
          element={
            <CustomerErrorBoundary>
              <CustomerProductDetailPage />
            </CustomerErrorBoundary>
          }
        />
        <Route path="/customer/login" element={<CustomerLoginPage />} />
        <Route path="/customer/register" element={<CustomerRegisterPage />} />

        {/* Protected Customer Routes */}
        <Route element={<CustomerProtectedRoute />}>
          <Route
            path="/customer/cart"
            element={
              <CustomerErrorBoundary>
                <CustomerCartPage />
              </CustomerErrorBoundary>
            }
          />
          <Route
            path="/customer/wishlist"
            element={
              <CustomerErrorBoundary>
                <CustomerWishlistPage />
              </CustomerErrorBoundary>
            }
          />
          <Route
            path="/customer/addresses"
            element={
              <CustomerErrorBoundary>
                <CustomerAddressPage />
              </CustomerErrorBoundary>
            }
          />
          <Route
            path="/customer/checkout"
            element={
              <CustomerErrorBoundary>
                <CustomerCheckoutPage />
              </CustomerErrorBoundary>
            }
          />
          <Route
            path="/customer/orders"
            element={
              <CustomerErrorBoundary>
                <CustomerOrdersPage />
              </CustomerErrorBoundary>
            }
          />
          <Route
            path="/customer/orders/:id"
            element={
              <CustomerErrorBoundary>
                <CustomerOrderDetailPage />
              </CustomerErrorBoundary>
            }
          />
          <Route
            path="/customer/notifications"
            element={
              <CustomerErrorBoundary>
                <CustomerNotificationsPage />
              </CustomerErrorBoundary>
            }
          />
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
