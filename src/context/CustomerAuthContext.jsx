import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { STORAGE_KEYS, BASE_API_URL, API_ENDPOINTS } from '../config/apiConfig';
import { cartService } from '../services/cartService';
import { wishlistService } from '../services/wishlistService';

import { notificationService } from '../services/notificationService';

const CustomerAuthContext = createContext();

export const CustomerAuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [customerToken, setCustomerToken] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Fetch Unread Notifications Count
  const refreshUnreadNotifications = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    if (!token) {
      setUnreadNotificationsCount(0);
      return;
    }
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadNotificationsCount(count);
    } catch (error) {
      console.error('Error refreshing notification count:', error);
    }
  }, []);

  // Fetch Cart from Backend API
  const refreshCart = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    if (!token) {
      setCart([]);
      return;
    }
    setCartLoading(true);
    try {
      const serverCart = await cartService.getCart();
      setCart(serverCart);
    } catch (error) {
      console.error('Error refreshing cart:', error.message);
    } finally {
      setCartLoading(false);
    }
  }, []);

  // Fetch Wishlist from Backend API
  const refreshWishlist = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    if (!token) {
      setWishlist([]);
      return;
    }
    setWishlistLoading(true);
    try {
      const serverWishlist = await wishlistService.getWishlist();
      setWishlist(serverWishlist);
    } catch (error) {
      console.error('Error refreshing wishlist:', error.message);
    } finally {
      setWishlistLoading(false);
    }
  }, []);

  // Initialize customer state and load live MongoDB cart & wishlist
  useEffect(() => {
    const initCustomer = async () => {
      try {
        const savedToken = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
        const savedUser = localStorage.getItem(STORAGE_KEYS.CUSTOMER_USER);

        if (savedToken && savedUser) {
          setCustomerToken(savedToken);
          setCustomer(JSON.parse(savedUser));
          await Promise.all([refreshCart(), refreshWishlist(), refreshUnreadNotifications()]);
        } else {
          setCart([]);
          setWishlist([]);
          setUnreadNotificationsCount(0);
        }
      } catch (error) {
        console.error('Failed to parse customer state:', error);
        localStorage.removeItem(STORAGE_KEYS.CUSTOMER_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.CUSTOMER_USER);
        setCustomer(null);
        setCustomerToken(null);
      } finally {
        setLoading(false);
      }
    };

    initCustomer();
  }, [refreshCart, refreshWishlist]);

  // Cart Action Handlers with stock validation & backend persistence
  const addToCart = async (productId, quantity = 1) => {
    const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    if (!token || !customer) {
      const err = new Error('UNAUTHENTICATED');
      err.code = 'UNAUTHENTICATED';
      throw err;
    }

    try {
      const res = await cartService.addToCart(productId, quantity);
      if (res.cart) {
        setCart(res.cart);
      } else {
        await refreshCart();
      }
      return res;
    } catch (error) {
      console.error('Add to cart failed:', error);
      throw error;
    }
  };

  const updateCartQuantity = async (productId, quantity) => {
    const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    if (!token || !customer) {
      const err = new Error('UNAUTHENTICATED');
      err.code = 'UNAUTHENTICATED';
      throw err;
    }

    try {
      const res = await cartService.updateCartItem(productId, quantity);
      if (res.cart) {
        setCart(res.cart);
      } else {
        await refreshCart();
      }
      return res;
    } catch (error) {
      console.error('Update cart item quantity failed:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId) => {
    const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    if (!token || !customer) return;

    try {
      const res = await cartService.removeCartItem(productId);
      if (res.cart) {
        setCart(res.cart);
      } else {
        await refreshCart();
      }
      return res;
    } catch (error) {
      console.error('Remove from cart failed:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    if (!token || !customer) return;

    try {
      await cartService.clearCart();
      setCart([]);
    } catch (error) {
      console.error('Clear cart failed:', error);
      throw error;
    }
  };

  // Wishlist Action Handlers
  const toggleWishlist = async (productId) => {
    const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    if (!token || !customer) {
      const err = new Error('UNAUTHENTICATED');
      err.code = 'UNAUTHENTICATED';
      throw err;
    }

    try {
      const res = await wishlistService.toggleWishlist(productId);
      if (res.wishlist) {
        setWishlist(res.wishlist);
      } else {
        await refreshWishlist();
      }
      return res;
    } catch (error) {
      console.error('Toggle wishlist failed:', error);
      throw error;
    }
  };

  const removeFromWishlist = async (productId) => {
    const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    if (!token || !customer) return;

    try {
      const res = await wishlistService.removeFromWishlist(productId);
      if (res.wishlist) {
        setWishlist(res.wishlist);
      } else {
        await refreshWishlist();
      }
      return res;
    } catch (error) {
      console.error('Remove from wishlist failed:', error);
      throw error;
    }
  };

  const isInWishlist = (productId) => {
    if (!productId) return false;
    return wishlist.some((item) => (item._id || item.id) === productId);
  };

  /**
   * Register Customer
   */
  const registerCustomer = async (name, email, password, phone = '') => {
    try {
      const response = await axios.post(`${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.AUTH.REGISTER}`, {
        name,
        email: email.trim(),
        password,
        phone,
      });

      if (response.data && response.data.token) {
        const customerData = response.data.customer;
        const jwtToken = response.data.token;

        localStorage.setItem(STORAGE_KEYS.CUSTOMER_TOKEN, jwtToken);
        localStorage.setItem(STORAGE_KEYS.CUSTOMER_USER, JSON.stringify(customerData));

        setCustomerToken(jwtToken);
        setCustomer(customerData);

        await Promise.all([refreshCart(), refreshWishlist()]);
        return customerData;
      }
    } catch (error) {
      const message = error.response?.data?.message || (error.message === 'Network Error' ? 'Network Error: Cannot connect to server.' : error.message) || 'Registration failed. Please try again.';
      throw new Error(message);
    }
  };

  /**
   * Login Customer
   */
  const loginCustomer = async (email, password) => {
    try {
      const response = await axios.post(`${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.AUTH.LOGIN}`, {
        email: email.trim(),
        password,
      });

      if (response.data && response.data.token) {
        const customerData = response.data.customer;
        const jwtToken = response.data.token;

        localStorage.setItem(STORAGE_KEYS.CUSTOMER_TOKEN, jwtToken);
        localStorage.setItem(STORAGE_KEYS.CUSTOMER_USER, JSON.stringify(customerData));

        setCustomerToken(jwtToken);
        setCustomer(customerData);

        await Promise.all([refreshCart(), refreshWishlist()]);
        return customerData;
      }
    } catch (error) {
      const message = error.response?.data?.message || (error.message === 'Network Error' ? 'Network Error: Cannot connect to server.' : error.message) || 'Login failed. Please check your credentials.';
      throw new Error(message);
    }
  };

  /**
   * Logout Customer
   */
  const logoutCustomer = () => {
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER_USER);
    setCustomerToken(null);
    setCustomer(null);
    setCart([]);
    setWishlist([]);
  };

  const value = {
    customer,
    customerToken,
    cart,
    cartLoading,
    cartCount: cart.reduce((total, item) => total + (item.quantity || 1), 0),
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    wishlist,
    wishlistLoading,
    wishlistCount: wishlist.length,
    toggleWishlist,
    removeFromWishlist,
    refreshWishlist,
    isInWishlist,
    unreadNotificationsCount,
    refreshUnreadNotifications,
    loginCustomer,
    registerCustomer,
    logoutCustomer,
    isAuthenticated: !!customerToken && !!customer,
    loading,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
