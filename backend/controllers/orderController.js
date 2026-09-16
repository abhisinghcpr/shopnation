const crypto = require('crypto');
const Razorpay = require('razorpay');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { createNotificationHelper } = require('./notificationController');
const {
  sendOrderPlacedEmail,
  sendPaymentSuccessEmail,
  sendOrderStatusEmail,
} = require('../services/emailService');

// Initialize Razorpay SDK instance
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay API keys are not configured in environment variables');
  }

  return new Razorpay({ key_id, key_secret });
};

// Helper: Extract Shipping Address Snapshot
const getAddressSnapshot = (customer, addressId, inlineAddress) => {
  if (addressId) {
    const targetAddr = customer.addresses.id(addressId);
    if (targetAddr) {
      return {
        fullName: targetAddr.fullName,
        phone: targetAddr.phone,
        flatNo: targetAddr.flatNo,
        street: targetAddr.street,
        city: targetAddr.city,
        state: targetAddr.state,
        pincode: targetAddr.pincode,
        addressType: targetAddr.addressType || 'Home',
      };
    }
  }

  if (inlineAddress) {
    const { fullName, phone, flatNo, street, city, state, pincode, addressType } = inlineAddress;
    if (fullName && phone && flatNo && street && city && state && pincode) {
      return {
        fullName: fullName.trim(),
        phone: phone.trim(),
        flatNo: flatNo.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        addressType: addressType || 'Home',
      };
    }
  }

  return null;
};

// @desc    Place a new Order (Cash on Delivery)
// @route   POST /api/v1/customer/orders
// @access  Private (Customer)
const placeOrder = async (req, res) => {
  try {
    const { addressId, shippingAddress: inlineAddress, paymentMethod = 'COD' } = req.body;

    const customer = await Customer.findById(req.customer._id).populate({
      path: 'cart.product',
    });

    if (!customer || !customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Add products before placing an order.',
      });
    }

    const addressSnapshot = getAddressSnapshot(customer, addressId, inlineAddress);
    if (!addressSnapshot) {
      return res.status(400).json({
        success: false,
        message: 'A valid delivery shipping address is required to place the order.',
      });
    }

    // Validate Stock & Calculate Totals from Live Database Products
    const orderItems = [];
    let calculatedSubtotal = 0;

    for (const item of customer.cart) {
      const prod = item.product;
      if (!prod || prod.isActive === false) {
        return res.status(400).json({
          success: false,
          message: `Product "${prod?.name || 'Item'}" is no longer available. Please update your cart.`,
        });
      }

      if (prod.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${prod.name}". Available stock: ${prod.quantity}, requested: ${item.quantity}.`,
        });
      }

      const unitPrice = prod.finalPrice !== undefined ? Number(prod.finalPrice) : Number(prod.price);
      const itemSubtotal = unitPrice * item.quantity;
      calculatedSubtotal += itemSubtotal;

      orderItems.push({
        product: prod._id,
        name: prod.name,
        image: prod.image || '',
        price: unitPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    const deliveryCharge = calculatedSubtotal > 500 || calculatedSubtotal === 0 ? 0 : 40;
    const finalTotalAmount = Math.round((calculatedSubtotal + deliveryCharge) * 100) / 100;

    // Generate Unique Order Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    // Create Order Document
    const order = new Order({
      customer: customer._id,
      orderNumber,
      items: orderItems,
      shippingAddress: addressSnapshot,
      subtotal: calculatedSubtotal,
      deliveryCharge,
      totalAmount: finalTotalAmount,
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'Placed',
    });

    await order.save();

    // Deduct stock for ordered products
    for (const item of customer.cart) {
      const prod = await Product.findById(item.product._id);
      if (prod) {
        prod.quantity = Math.max(0, prod.quantity - item.quantity);
        await prod.save();
      }
    }

    // Clear Customer Cart
    customer.cart = [];
    await customer.save();

    // Trigger In-App Notification for Customer (blocking OK - fast DB write)
    await createNotificationHelper({
      recipient: customer._id,
      type: 'ORDER_PLACED',
      title: `Order Placed #${order.orderNumber}`,
      message: `Your order #${order.orderNumber} for ₹${order.totalAmount.toLocaleString('en-IN')} has been placed successfully.`,
      order: order._id,
    });

    // Send Order Placed Email (non-blocking - email failure must not fail the order)
    sendOrderPlacedEmail(order, { _id: customer._id, name: customer.name, email: customer.email }).catch((err) =>
      console.error('[Email] ORDER_PLACED email error:', err.message)
    );

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order,
    });
  } catch (error) {
    console.error('Error placing COD order:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while placing order. Please try again.',
    });
  }
};

// @desc    Create Razorpay Order from Live Cart
// @route   POST /api/v1/customer/payment/razorpay-order
// @access  Private (Customer)
const createRazorpayOrder = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id).populate({
      path: 'cart.product',
    });

    if (!customer || !customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty.',
      });
    }

    let calculatedSubtotal = 0;
    for (const item of customer.cart) {
      const prod = item.product;
      if (!prod || prod.isActive === false) {
        return res.status(400).json({
          success: false,
          message: `Product "${prod?.name || 'Item'}" is unavailable.`,
        });
      }
      if (prod.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${prod.name}". Available stock: ${prod.quantity}.`,
        });
      }
      const unitPrice = prod.finalPrice !== undefined ? Number(prod.finalPrice) : Number(prod.price);
      calculatedSubtotal += unitPrice * item.quantity;
    }

    const deliveryCharge = calculatedSubtotal > 500 || calculatedSubtotal === 0 ? 0 : 40;
    const finalTotalAmount = Math.round((calculatedSubtotal + deliveryCharge) * 100) / 100;
    const amountInPaise = Math.round(finalTotalAmount * 100);

    const razorpay = getRazorpayInstance();
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      razorpayOrder,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: finalTotalAmount,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to initialize Razorpay payment',
    });
  }
};

// @desc    Verify Razorpay Payment Signature & Finalize Order
// @route   POST /api/v1/customer/payment/verify-razorpay
// @access  Private (Customer)
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      addressId,
      shippingAddress: inlineAddress,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Razorpay payment verification parameters',
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: 'Razorpay secret key not configured' });
    }

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Payment verification failed.',
      });
    }

    const existingOrder = await Order.findOne({ razorpayPaymentId });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: 'Payment already processed and order placed.',
        order: existingOrder,
      });
    }

    const customer = await Customer.findById(req.customer._id).populate({
      path: 'cart.product',
    });

    if (!customer || !customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Order could not be created.',
      });
    }

    const addressSnapshot = getAddressSnapshot(customer, addressId, inlineAddress);
    if (!addressSnapshot) {
      return res.status(400).json({
        success: false,
        message: 'Delivery shipping address is required.',
      });
    }

    const orderItems = [];
    let calculatedSubtotal = 0;

    for (const item of customer.cart) {
      const prod = item.product;
      if (!prod || prod.isActive === false) {
        return res.status(400).json({
          success: false,
          message: `Product "${prod?.name || 'Item'}" is no longer available.`,
        });
      }

      if (prod.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock ran out for "${prod.name}". Available stock: ${prod.quantity}.`,
        });
      }

      const unitPrice = prod.finalPrice !== undefined ? Number(prod.finalPrice) : Number(prod.price);
      const itemSubtotal = unitPrice * item.quantity;
      calculatedSubtotal += itemSubtotal;

      orderItems.push({
        product: prod._id,
        name: prod.name,
        image: prod.image || '',
        price: unitPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    const deliveryCharge = calculatedSubtotal > 500 || calculatedSubtotal === 0 ? 0 : 40;
    const finalTotalAmount = Math.round((calculatedSubtotal + deliveryCharge) * 100) / 100;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    const order = new Order({
      customer: customer._id,
      orderNumber,
      items: orderItems,
      shippingAddress: addressSnapshot,
      subtotal: calculatedSubtotal,
      deliveryCharge,
      totalAmount: finalTotalAmount,
      paymentMethod: 'Razorpay',
      paymentStatus: 'Paid',
      orderStatus: 'Placed',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    await order.save();

    for (const item of customer.cart) {
      const prod = await Product.findById(item.product._id);
      if (prod) {
        prod.quantity = Math.max(0, prod.quantity - item.quantity);
        await prod.save();
      }
    }

    customer.cart = [];
    await customer.save();

    // Trigger In-App Notification for Customer
    await createNotificationHelper({
      recipient: customer._id,
      type: 'PAYMENT_UPDATE',
      title: `Payment Received #${order.orderNumber}`,
      message: `Your Razorpay online payment of ₹${order.totalAmount.toLocaleString('en-IN')} for order #${order.orderNumber} was successful.`,
      order: order._id,
    });

    // Send Payment Success Email (non-blocking)
    sendPaymentSuccessEmail(
      order,
      { _id: customer._id, name: customer.name, email: customer.email },
      razorpayPaymentId
    ).catch((err) => console.error('[Email] PAYMENT_SUCCESS email error:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Razorpay payment verified and order placed successfully!',
      order,
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error verifying Razorpay payment.',
    });
  }
};

// @desc    Cancel Customer Order (Before shipping only, restores stock safely)
// @route   POST /api/v1/customer/orders/:id/cancel
// @access  Private (Customer)
const cancelCustomerOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: id,
      customer: req.customer._id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.orderStatus.toLowerCase()}.`,
      });
    }

    // Safely restore stock in MongoDB only once
    const isStockAlreadyRestored = order.cancellation?.stockRestored;

    if (!isStockAlreadyRestored) {
      for (const item of order.items) {
        const prod = await Product.findById(item.product);
        if (prod) {
          prod.quantity += item.quantity;
          await prod.save(); // Triggers pre-save stock status update
        }
      }
    }

    order.orderStatus = 'Cancelled';
    order.cancellation = {
      reason: reason ? reason.trim() : 'Customer requested cancellation',
      cancelledAt: new Date(),
      cancelledBy: 'Customer',
      stockRestored: true,
    };

    if (order.paymentMethod === 'Razorpay' && order.paymentStatus === 'Paid') {
      order.paymentStatus = 'Refund Pending';
    } else if (order.paymentMethod === 'COD') {
      order.paymentStatus = 'Cancelled';
    }

    await order.save();

    // Trigger In-App Notification for Customer
    await createNotificationHelper({
      recipient: order.customer,
      type: 'ORDER_CANCELLED',
      title: `Order Cancelled #${order.orderNumber}`,
      message: `Your order #${order.orderNumber} has been cancelled. ${order.paymentStatus === 'Refund Pending' ? 'Refund process initiated.' : ''}`,
      order: order._id,
    });

    // Send Cancellation Email (non-blocking)
    const cancelledCustomer = await Customer.findById(order.customer).select('name email').lean();
    if (cancelledCustomer) {
      const cancelStatus = order.paymentStatus === 'Refund Pending' ? 'Refund Pending' : 'Cancelled';
      sendOrderStatusEmail(order, cancelledCustomer, cancelStatus).catch((err) =>
        console.error('[Email] ORDER_CANCELLED email error:', err.message)
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and product stock restored.',
      order,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ success: false, message: 'Server error cancelling order' });
  }
};

// @desc    Reorder Customer Items (Adds available products to cart at current live prices)
// @route   POST /api/v1/customer/orders/:id/reorder
// @access  Private (Customer)
const reorderCustomerItems = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      customer: req.customer._id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const customer = await Customer.findById(req.customer._id);
    let addedCount = 0;
    let unavailableCount = 0;

    for (const item of order.items) {
      const prod = await Product.findById(item.product);
      if (prod && prod.isActive !== false && prod.quantity > 0) {
        const existingIndex = customer.cart.findIndex(
          (cItem) => cItem.product.toString() === prod._id.toString()
        );
        const qtyToAdd = Math.min(item.quantity, prod.quantity);

        if (existingIndex > -1) {
          customer.cart[existingIndex].quantity = Math.min(
            customer.cart[existingIndex].quantity + qtyToAdd,
            prod.quantity
          );
        } else {
          customer.cart.push({ product: prod._id, quantity: qtyToAdd });
        }
        addedCount++;
      } else {
        unavailableCount++;
      }
    }

    await customer.save();

    const updatedCustomer = await Customer.findById(req.customer._id).populate({
      path: 'cart.product',
      populate: { path: 'category', select: 'name' },
    });

    let msg = `Added ${addedCount} available item(s) to your cart with current live prices!`;
    if (unavailableCount > 0) {
      msg += ` (${unavailableCount} item(s) were out of stock or unavailable).`;
    }

    return res.status(200).json({
      success: true,
      message: msg,
      cart: updatedCustomer.cart,
    });
  } catch (error) {
    console.error('Error reordering items:', error);
    return res.status(500).json({ success: false, message: 'Server error reordering items' });
  }
};

// @desc    Get customer order history
// @route   GET /api/v1/customer/orders
// @access  Private (Customer)
const getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.customer._id })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
};

// @desc    Get single customer order detail
// @route   GET /api/v1/customer/orders/:id
// @access  Private (Customer)
const getCustomerOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      customer: req.customer._id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching order detail' });
  }
};

// @desc    Admin: Get all orders across customers with search and filters
// @route   GET /api/v1/admin/orders
// @access  Private (Admin)
const getAllOrdersAdmin = async (req, res) => {
  try {
    const { search, orderStatus, status, paymentStatus, date } = req.query;

    let filter = {};

    const activeOrderStatus = orderStatus || status;
    if (activeOrderStatus && activeOrderStatus !== 'ALL') {
      filter.orderStatus = activeOrderStatus;
    }
    if (paymentStatus && paymentStatus !== 'ALL') {
      filter.paymentStatus = paymentStatus;
    }
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: startDate, $lte: endDate };
    }

    let orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      orders = orders.filter((ord) => {
        const orderNoMatch = ord.orderNumber?.toLowerCase().includes(q);
        const custNameMatch = ord.customer?.name?.toLowerCase().includes(q);
        const custEmailMatch = ord.customer?.email?.toLowerCase().includes(q);
        const phoneMatch = ord.shippingAddress?.phone?.includes(q);
        return orderNoMatch || custNameMatch || custEmailMatch || phoneMatch;
      });
    }

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching admin orders' });
  }
};

// @desc    Admin: Get single order by ID
// @route   GET /api/v1/admin/orders/:id
// @access  Private (Admin)
const getAdminOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate('customer', 'name email phone avatar');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error fetching admin order by id:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching admin order detail' });
  }
};

// @desc    Admin: Update order status & payment status
// @route   PUT /api/v1/admin/orders/:id/status
// @access  Private (Admin)
const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Handle cancellation by admin -> restore stock if not already restored
    if (orderStatus === 'Cancelled' && order.orderStatus !== 'Cancelled') {
      if (!order.cancellation?.stockRestored) {
        for (const item of order.items) {
          const prod = await Product.findById(item.product);
          if (prod) {
            prod.quantity += item.quantity;
            await prod.save();
          }
        }
      }
      order.cancellation = {
        reason: 'Cancelled by Store Admin',
        cancelledAt: new Date(),
        cancelledBy: 'Admin',
        stockRestored: true,
      };
      if (order.paymentMethod === 'Razorpay' && order.paymentStatus === 'Paid') {
        order.paymentStatus = 'Refund Pending';
      }
    }

    const oldStatus = order.orderStatus;
    const oldPaymentStatus = order.paymentStatus;

    if (orderStatus) {
      order.orderStatus = orderStatus;
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    // Trigger In-App Notification for Customer if status changed
    if (orderStatus && orderStatus !== oldStatus) {
      await createNotificationHelper({
        recipient: order.customer,
        type: orderStatus === 'Cancelled' ? 'ORDER_CANCELLED' : 'ORDER_STATUS_UPDATE',
        title: `Order Status: ${orderStatus} #${order.orderNumber}`,
        message: `Your order #${order.orderNumber} status has been updated to "${orderStatus}".`,
        order: order._id,
      });

      // Send Order Status Email (non-blocking)
      const statusCustomer = await Customer.findById(order.customer).select('name email').lean();
      if (statusCustomer) {
        const emailStatus = orderStatus === 'Cancelled' && order.paymentStatus === 'Refund Pending'
          ? 'Refund Pending'
          : orderStatus;
        sendOrderStatusEmail(order, statusCustomer, emailStatus).catch((err) =>
          console.error(`[Email] ${orderStatus} email error:`, err.message)
        );
      }
    } else if (paymentStatus && paymentStatus !== oldPaymentStatus) {
      await createNotificationHelper({
        recipient: order.customer,
        type: 'PAYMENT_UPDATE',
        title: `Payment Status: ${paymentStatus} #${order.orderNumber}`,
        message: `Payment status for your order #${order.orderNumber} has been updated to "${paymentStatus}".`,
        order: order._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ success: false, message: 'Server error updating order status' });
  }
};

module.exports = {
  placeOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  cancelCustomerOrder,
  reorderCustomerItems,
  getCustomerOrders,
  getCustomerOrderById,
  getAllOrdersAdmin,
  getAdminOrderById,
  updateOrderStatusAdmin,
};
