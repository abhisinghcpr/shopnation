const Notification = require('../models/Notification');
const Order = require('../models/Order');

/**
 * Helper function to create notification with deduplication logic
 */
const createNotificationHelper = async ({ recipient, type, title, message, order }) => {
  try {
    if (!recipient || !type || !title || !message) {
      return null;
    }

    // Deduplication check: Don't insert duplicate notification for same recipient, order, and exact message within last 1 minute
    const oneMinAgo = new Date(Date.now() - 60 * 1000);
    const existing = await Notification.findOne({
      recipient,
      type,
      title,
      order: order || null,
      createdAt: { $gte: oneMinAgo },
    });

    if (existing) {
      return existing;
    }

    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      order: order || null,
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification helper:', error);
    return null;
  }
};

/**
 * Customer: Get notification list
 * GET /api/v1/customer/notifications
 */
const getCustomerNotifications = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const notifications = await Notification.find({ recipient: customerId })
      .populate('order', 'orderNumber orderStatus totalAmount')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

/**
 * Customer: Get unread count
 * GET /api/v1/customer/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const unreadCount = await Notification.countDocuments({
      recipient: customerId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return res.status(500).json({ success: false, message: 'Server error getting unread count' });
  }
};

/**
 * Customer: Mark single notification as read
 * PATCH /api/v1/customer/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { id } = req.params;

    const notification = await Notification.findOne({ _id: id, recipient: customerId });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    console.error('Error marking notification read:', error);
    return res.status(500).json({ success: false, message: 'Server error marking read' });
  }
};

/**
 * Customer: Mark all notifications as read
 * PATCH /api/v1/customer/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    const customerId = req.customer.id;

    await Notification.updateMany(
      { recipient: customerId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all read:', error);
    return res.status(500).json({ success: false, message: 'Server error marking all read' });
  }
};

/**
 * Customer: Delete a notification
 * DELETE /api/v1/customer/notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({ _id: id, recipient: customerId });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting notification' });
  }
};

/**
 * Admin: Send manual custom notification to a customer regarding an order
 * POST /api/v1/admin/notifications/send
 */
const sendAdminNotification = async (req, res) => {
  try {
    const { orderId, title, message } = req.body;

    if (!orderId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, notification title, and message are required',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const notification = await createNotificationHelper({
      recipient: order.customer,
      type: 'ADMIN_MESSAGE',
      title: title.trim(),
      message: message.trim(),
      order: order._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Notification sent to customer successfully',
      notification,
    });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return res.status(500).json({ success: false, message: 'Server error sending notification' });
  }
};

module.exports = {
  createNotificationHelper,
  getCustomerNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendAdminNotification,
};
