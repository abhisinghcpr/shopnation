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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount — refreshCart/refreshWishlist/refreshUnreadNotifications are stable callbacks

  // ─── Cart Action Handlers with Optimistic Updates ───────────────────────────

  /**
   * addToCart — Optimistic: immediately increment count in UI,
   * then sync with server response. Roll back on failure.
   */
  const addToCart = async (productId, quantity = 1) => {
    const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    if (!token || !customer) {
      const err = new Error('UNAUTHENTICATED');
      err.code = 'UNAUTHENTICATED';
      throw err;
    }

    // Optimistic update: add a temporary placeholder entry
    const prevCart = cart;
    const existingIndex = cart.findIndex(
      (item) => (item.product?._id || item.product?.id) === productId
    );

    if (existingIndex > -1) {
      // Optimistically increase quantity
      setCart((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    }
    // (If new item — we can't fully optimistic-add without product data, so we just let the API response set state)

    try {
      const res = await cartService.addToCart(productId, quantity);
      if (res.cart) {
        setCart(res.cart);
      } else {
        await refreshCart();
      }
      return res;
    } catch (error) {
      // Roll back optimistic update
      setCart(prevCart);
      console.error('Add to cart failed:', error);
      throw error;
    }
  };

  /**
   * updateCartQuantity — Optimistic: immediately update qty in UI,
   * sync with server, roll back on failure.
   */
  const updateCartQuantity = async (productId, quantity) => {
    const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    if (!token || !customer) {
      const err = new Error('UNAUTHENTICATED');
      err.code = 'UNAUTHENTICATED';
      throw err;
    }

    const prevCart = cart;

    // Optimistic update
    setCart((prev) =>
      prev.map((item) =>
        (item.product?._id || item.product?.id) === productId
          ? { ...item, quantity }
          : item
      )
    );

    try {
      const res = await cartService.updateCartItem(productId, quantity);
      if (res.cart) {
        setCart(res.cart);
      } else {
        await refreshCart();
      }
      return res;
    } catch (error) {
      // Roll back
      setCart(prevCart);
      console.error('Update cart item quantity failed:', error);
      throw error;
    }
  };

  /**
   * removeFromCart — Optimistic: immediately remove from UI,
   * sync with server, roll back on failure.
   */
  const removeFromCart = async (productId) => {
    const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    if (!token || !customer) return;

    const prevCart = cart;

    // Optimistic update
    setCart((prev) =>
      prev.filter((item) => (item.product?._id || item.product?.id) !== productId)
    );

    try {
      const res = await cartService.removeCartItem(productId);
      if (res.cart) {
        setCart(res.cart);
      }
      // If no cart in response, keep our optimistic state (it's already removed)
      return res;
    } catch (error) {
      // Roll back
      setCart(prevCart);
      console.error('Remove from cart failed:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    if (!token || !customer) return;

    const prevCart = cart;
    // Optimistic update
    setCart([]);

    try {
      await cartService.clearCart();
    } catch (error) {
      // Roll back
      setCart(prevCart);
      console.error('Clear cart failed:', error);
      throw error;
    }
  };

  // ─── Wishlist Action Handlers with Optimistic Updates ───────────────────────

  /**
   * toggleWishlist — Optimistic: immediately add/remove in UI,
   * sync with server response, roll back on failure.
   */
  const toggleWishlist = async (productId) => {
    const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    if (!token || !customer) {
      const err = new Error('UNAUTHENTICATED');
      err.code = 'UNAUTHENTICATED';
      throw err;
    }

    const prevWishlist = wishlist;
    const isCurrentlyInWishlist = wishlist.some(
      (item) => (item._id || item.id) === productId
    );

    // Optimistic update
    if (isCurrentlyInWishlist) {
      setWishlist((prev) => prev.filter((item) => (item._id || item.id) !== productId));
    } else {
      // Add a minimal placeholder — server will return the full populated product
      setWishlist((prev) => [...prev, { _id: productId, id: productId }]);
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
      // Roll back
      setWishlist(prevWishlist);
      console.error('Toggle wishlist failed:', error);
      throw error;
    }
  };

  /**
   * removeFromWishlist — Optimistic: immediately remove from UI,
   * sync with server, roll back on failure.
   */
  const removeFromWishlist = async (productId) => {
    const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
    if (!token || !customer) return;

    const prevWishlist = wishlist;

    // Optimistic update
    setWishlist((prev) => prev.filter((item) => (item._id || item.id) !== productId));

    try {
      const res = await wishlistService.removeFromWishlist(productId);
      if (res.wishlist) {
        setWishlist(res.wishlist);
      }
      return res;
    } catch (error) {
      // Roll back
      setWishlist(prevWishlist);
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
