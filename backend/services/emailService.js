/**
 * emailService.js
 * Reusable Nodemailer email service for ShopNation
 * SMTP credentials are loaded from environment variables only.
 * Never expose credentials in logs or API responses.
 */

const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sanitize a string to prevent HTML injection in email templates */
const sanitize = (val) => {
  if (typeof val !== 'string') return String(val ?? '');
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/** Format currency */
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/** Build Nodemailer transporter from env variables */
const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null; // SMTP not configured
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });
};

// ─── HTML Template Wrapper ────────────────────────────────────────────────────

const emailWrapper = (title, bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${sanitize(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#2874f0;padding:24px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px;">
              Shop<span style="color:#ffe500;">Nation</span>
            </h1>
            <p style="margin:4px 0 0;color:#c8d9ff;font-size:13px;">Your Online Shopping Destination</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fa;padding:20px 32px;border-top:1px solid #e9ecef;">
            <p style="margin:0 0 4px;color:#6c757d;font-size:12px;">Need help? Contact our support team:</p>
            <p style="margin:0;color:#6c757d;font-size:12px;">
              📞 <a href="tel:8521616449" style="color:#2874f0;text-decoration:none;">8521616449</a>
              &nbsp;|&nbsp;
              ✉️ <a href="mailto:abhisheksinghdev22@gmail.com" style="color:#2874f0;text-decoration:none;">abhisheksinghdev22@gmail.com</a>
            </p>
            <p style="margin:8px 0 0;color:#adb5bd;font-size:11px;">© ${new Date().getFullYear()} ShopNation. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── Shared Order Summary Table ───────────────────────────────────────────────

const orderSummaryTable = (items, subtotal, shippingCharge, totalAmount) => {
  const rows = (items || [])
    .map(
      (it) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${sanitize(it.name)}</td>
      <td style="padding:8px 8px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:center;">${sanitize(String(it.quantity))}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right;">${fmt(it.price)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right;">${fmt((it.price || 0) * (it.quantity || 1))}</td>
    </tr>`
    )
    .join('');

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
    <thead>
      <tr style="background:#f8f9fa;">
        <th style="padding:10px 0;text-align:left;font-size:13px;color:#495057;">Product</th>
        <th style="padding:10px 8px;text-align:center;font-size:13px;color:#495057;">Qty</th>
        <th style="padding:10px 0;text-align:right;font-size:13px;color:#495057;">Price</th>
        <th style="padding:10px 0;text-align:right;font-size:13px;color:#495057;">Subtotal</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="padding:8px 0;text-align:right;font-size:13px;color:#6c757d;">Subtotal</td>
        <td style="padding:8px 0;text-align:right;font-size:13px;">${fmt(subtotal)}</td>
      </tr>
      <tr>
        <td colspan="3" style="padding:4px 0;text-align:right;font-size:13px;color:#6c757d;">Shipping</td>
        <td style="padding:4px 0;text-align:right;font-size:13px;color:${shippingCharge > 0 ? '#000' : '#28a745'};">${shippingCharge > 0 ? fmt(shippingCharge) : 'FREE'}</td>
      </tr>
      <tr>
        <td colspan="3" style="padding:12px 0;text-align:right;font-size:15px;font-weight:700;">Total</td>
        <td style="padding:12px 0;text-align:right;font-size:15px;font-weight:700;color:#2874f0;">${fmt(totalAmount)}</td>
      </tr>
    </tfoot>
  </table>`;
};

// ─── Address Block ────────────────────────────────────────────────────────────

const addressBlock = (addr) => {
  if (!addr) return '<p style="color:#6c757d;">No address recorded</p>';
  const parts = [
    addr.fullName || addr.full_name,
    addr.houseNo || addr.flatNo,
    addr.street,
    addr.city,
    addr.state,
    addr.pincode,
    addr.mobileNumber || addr.phone,
  ].filter(Boolean).map(sanitize);
  return `<p style="margin:0;line-height:1.7;font-size:14px;color:#495057;">${parts.join(', ')}</p>`;
};

// ─── CTA Button ───────────────────────────────────────────────────────────────

const ctaButton = (text, url) =>
  `<a href="${sanitize(url)}" style="display:inline-block;background:#2874f0;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:4px;font-weight:700;font-size:14px;margin:16px 0;">${sanitize(text)}</a>`;

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusBadge = (status) => {
  const colors = {
    Placed: '#2874f0', Processing: '#17a2b8', Shipped: '#ffc107',
    'Out for Delivery': '#fd7e14', Delivered: '#28a745', Cancelled: '#dc3545',
    Paid: '#28a745', Pending: '#ffc107', 'Refund Pending': '#fd7e14', Failed: '#dc3545',
  };
  const bg = colors[status] || '#6c757d';
  return `<span style="background:${bg};color:#fff;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:700;">${sanitize(status)}</span>`;
};

// ─── Core Send Function ───────────────────────────────────────────────────────

/**
 * sendEmail - Core send function with deduplication and logging.
 * Returns { success, messageId, skipped }. Never throws.
 */
const sendEmail = async ({ to, subject, html, text, orderId, customerId, eventType }) => {
  const result = { success: false, messageId: null, skipped: false };

  try {
    // Validate email
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      console.warn('[EmailService] Invalid email address, skipping:', to);
      return result;
    }

    // Duplicate protection: skip if already sent successfully
    if (orderId && eventType) {
      const existing = await EmailLog.findOne({
        order: orderId,
        eventType,
        status: 'Sent',
      });
      if (existing) {
        console.log(`[EmailService] Duplicate skipped: ${eventType} for order ${orderId}`);
        result.skipped = true;
        result.success = true;
        return result;
      }
    }

    // Create log entry (Pending)
    let logEntry = null;
    if (orderId || customerId) {
      logEntry = await EmailLog.create({
        order: orderId || null,
        customer: customerId || null,
        email: to,
        eventType: eventType || 'ADMIN_MESSAGE',
        status: 'Pending',
      });
    }

    const transporter = createTransporter();
    if (!transporter) {
      console.warn('[EmailService] SMTP not configured, skipping email send.');
      if (logEntry) {
        logEntry.status = 'Failed';
        logEntry.errorMessage = 'SMTP not configured';
        await logEntry.save();
      }
      return result;
    }

    const mailOptions = {
      from: process.env.MAIL_FROM || '"ShopNation" <no-reply@shopnation.com>',
      to,
      subject,
      html,
      text: text || subject,
    };

    const info = await transporter.sendMail(mailOptions);

    result.success = true;
    result.messageId = info.messageId;

    if (logEntry) {
      logEntry.status = 'Sent';
      logEntry.messageId = info.messageId;
      logEntry.sentAt = new Date();
      await logEntry.save();
    }

    console.log(`[EmailService] Sent: ${eventType || subject} -> ${to} (${info.messageId})`);
  } catch (err) {
    // Safe log - never print SMTP credentials
    console.error(`[EmailService] Failed to send email (${eventType}):`, err.message);

    // Update log entry to Failed
    try {
      if (orderId && eventType) {
        await EmailLog.findOneAndUpdate(
          { order: orderId, eventType, status: 'Pending' },
          { status: 'Failed', errorMessage: err.message },
          { sort: { createdAt: -1 } }
        );
      }
    } catch (logErr) {
      console.error('[EmailService] Failed to update email log:', logErr.message);
    }
  }

  return result;
};

// ─── Event-Specific Email Senders ────────────────────────────────────────────

const clientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

/** A. Order Placed Email */
const sendOrderPlacedEmail = async (order, customer) => {
  if (!customer?.email) return;
  const orderUrl = `${clientUrl()}/customer/orders/${order._id}`;
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' });

  const html = emailWrapper(
    'Order Placed Successfully',
    `
    <h2 style="color:#28a745;margin:0 0 8px;">✅ Order Confirmed!</h2>
    <p style="margin:0 0 4px;font-size:15px;">Hi <strong>${sanitize(customer.name)}</strong>,</p>
    <p style="font-size:14px;color:#495057;">Your order has been placed successfully. Here are your order details:</p>

    <div style="background:#f8f9fa;border-radius:6px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 6px;font-size:14px;"><strong>Order Number:</strong> ${sanitize(order.orderNumber)}</p>
      <p style="margin:0 0 6px;font-size:14px;"><strong>Order Date:</strong> ${date}</p>
      <p style="margin:0 0 6px;font-size:14px;"><strong>Payment Method:</strong> ${sanitize(order.paymentMethod)}</p>
      <p style="margin:0;font-size:14px;"><strong>Payment Status:</strong> ${statusBadge(order.paymentStatus)}</p>
    </div>

    <h3 style="font-size:15px;margin:24px 0 8px;">Order Summary</h3>
    ${orderSummaryTable(order.items, order.subtotal, order.deliveryCharge, order.totalAmount)}

    <h3 style="font-size:15px;margin:24px 0 8px;">Shipping Address</h3>
    ${addressBlock(order.shippingAddress)}

    <p style="margin:24px 0 8px;font-size:14px;">Track your order status anytime:</p>
    ${ctaButton('View Order', orderUrl)}
    `
  );

  const text = `Hi ${customer.name},\nOrder ${order.orderNumber} placed on ${date}.\nTotal: ₹${order.totalAmount}\nPayment: ${order.paymentMethod} (${order.paymentStatus})\nView: ${orderUrl}`;

  return sendEmail({
    to: customer.email,
    subject: `Order Confirmed #${order.orderNumber} - ShopNation`,
    html, text,
    orderId: order._id,
    customerId: customer._id,
    eventType: 'ORDER_PLACED',
  });
};

/** B. Payment Success Email */
const sendPaymentSuccessEmail = async (order, customer, razorpayPaymentId) => {
  if (!customer?.email) return;
  const orderUrl = `${clientUrl()}/customer/orders/${order._id}`;

  const html = emailWrapper(
    'Payment Successful',
    `
    <h2 style="color:#28a745;margin:0 0 8px;">💳 Payment Successful!</h2>
    <p style="font-size:15px;">Hi <strong>${sanitize(customer.name)}</strong>,</p>
    <p style="font-size:14px;color:#495057;">Your payment has been received and your order is confirmed.</p>

    <div style="background:#f8f9fa;border-radius:6px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 6px;font-size:14px;"><strong>Order Number:</strong> ${sanitize(order.orderNumber)}</p>
      <p style="margin:0 0 6px;font-size:14px;"><strong>Payment ID:</strong> ${sanitize(razorpayPaymentId || '')}</p>
      <p style="margin:0 0 6px;font-size:14px;"><strong>Amount Paid:</strong> ${fmt(order.totalAmount)}</p>
      <p style="margin:0 0 6px;font-size:14px;"><strong>Payment Method:</strong> Razorpay Online Payment</p>
      <p style="margin:0;font-size:14px;"><strong>Status:</strong> ${statusBadge('Paid')}</p>
    </div>

    <h3 style="font-size:15px;margin:24px 0 8px;">Order Summary</h3>
    ${orderSummaryTable(order.items, order.subtotal, order.deliveryCharge, order.totalAmount)}

    ${ctaButton('View Order Details', orderUrl)}
    `
  );

  const text = `Hi ${customer.name},\nPayment successful for Order #${order.orderNumber}.\nPayment ID: ${razorpayPaymentId}\nAmount: ₹${order.totalAmount}\nView: ${orderUrl}`;

  return sendEmail({
    to: customer.email,
    subject: `Payment Successful #${order.orderNumber} - ShopNation`,
    html, text,
    orderId: order._id,
    customerId: customer._id,
    eventType: 'PAYMENT_SUCCESS',
  });
};

/** C & D. Order Status Update Email (Shipped, Delivered, etc.) */
const sendOrderStatusEmail = async (order, customer, newStatus) => {
  if (!customer?.email) return;
  const orderUrl = `${clientUrl()}/customer/orders/${order._id}`;

  const eventMap = {
    Processing: 'ORDER_PROCESSING',
    Shipped: 'ORDER_SHIPPED',
    'Out for Delivery': 'OUT_FOR_DELIVERY',
    Delivered: 'ORDER_DELIVERED',
    Cancelled: 'ORDER_CANCELLED',
    'Refund Pending': 'REFUND_PENDING',
  };

  const eventType = eventMap[newStatus];
  if (!eventType) return;

  const headlines = {
    Processing: { icon: '⚙️', title: 'Order is Being Processed', color: '#17a2b8' },
    Shipped: { icon: '🚚', title: 'Your Order Has Been Shipped!', color: '#ffc107' },
    'Out for Delivery': { icon: '📦', title: 'Out for Delivery!', color: '#fd7e14' },
    Delivered: { icon: '🎉', title: 'Order Delivered Successfully!', color: '#28a745' },
    Cancelled: { icon: '❌', title: 'Order Cancelled', color: '#dc3545' },
    'Refund Pending': { icon: '💰', title: 'Refund Initiated', color: '#fd7e14' },
  };

  const h = headlines[newStatus] || { icon: '📋', title: `Order Status: ${newStatus}`, color: '#2874f0' };

  const extraSection = newStatus === 'Delivered'
    ? `<p style="font-size:14px;margin:16px 0 4px;">We hope you love your purchase! Please leave a review:</p>
       ${ctaButton('Write a Review', `${clientUrl()}/customer/orders/${order._id}`)}`
    : newStatus === 'Cancelled' && order.cancellation?.reason
    ? `<div style="background:#fff3cd;border-radius:6px;padding:12px;margin:16px 0;">
        <p style="margin:0;font-size:14px;"><strong>Cancellation Reason:</strong> ${sanitize(order.cancellation.reason)}</p>
        ${order.paymentStatus === 'Refund Pending' ? '<p style="margin:4px 0 0;font-size:14px;color:#856404;">Your refund is being processed and will be credited within 5-7 business days.</p>' : ''}
       </div>`
    : '';

  const html = emailWrapper(
    h.title,
    `
    <h2 style="color:${h.color};margin:0 0 8px;">${h.icon} ${h.title}</h2>
    <p style="font-size:15px;">Hi <strong>${sanitize(customer.name)}</strong>,</p>
    <p style="font-size:14px;color:#495057;">Your order status has been updated to: ${statusBadge(newStatus)}</p>

    <div style="background:#f8f9fa;border-radius:6px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 6px;font-size:14px;"><strong>Order Number:</strong> ${sanitize(order.orderNumber)}</p>
      <p style="margin:0;font-size:14px;"><strong>Total Amount:</strong> ${fmt(order.totalAmount)}</p>
    </div>

    <h3 style="font-size:15px;margin:24px 0 8px;">Order Summary</h3>
    ${orderSummaryTable(order.items, order.subtotal, order.deliveryCharge, order.totalAmount)}

    <h3 style="font-size:15px;margin:24px 0 8px;">Shipping Address</h3>
    ${addressBlock(order.shippingAddress)}

    ${extraSection}

    ${ctaButton('View Order', orderUrl)}
    `
  );

  const text = `Hi ${customer.name},\nOrder #${order.orderNumber} status updated to: ${newStatus}\nTotal: ₹${order.totalAmount}\nView: ${orderUrl}`;

  return sendEmail({
    to: customer.email,
    subject: `Order ${newStatus} #${order.orderNumber} - ShopNation`,
    html, text,
    orderId: order._id,
    customerId: customer._id,
    eventType,
  });
};

/** Retry a failed email log entry */
const retryEmailLog = async (emailLogId) => {
  const log = await EmailLog.findById(emailLogId)
    .populate('order')
    .populate('customer', 'name email');

  if (!log) throw new Error('Email log not found');
  if (log.status === 'Sent') return { success: true, skipped: true };
  if (!log.order || !log.customer) throw new Error('Associated order or customer not found');

  const { order, customer } = log;
  const email = log.email || customer.email;

  // Reset to Pending before retry
  log.status = 'Pending';
  log.errorMessage = '';
  await log.save();

  const eventHandlers = {
    ORDER_PLACED: () => sendOrderPlacedEmail(order, { ...customer.toObject(), email }),
    PAYMENT_SUCCESS: () => sendPaymentSuccessEmail(order, { ...customer.toObject(), email }, order.razorpayPaymentId),
    ORDER_SHIPPED: () => sendOrderStatusEmail(order, { ...customer.toObject(), email }, 'Shipped'),
    ORDER_DELIVERED: () => sendOrderStatusEmail(order, { ...customer.toObject(), email }, 'Delivered'),
    ORDER_PROCESSING: () => sendOrderStatusEmail(order, { ...customer.toObject(), email }, 'Processing'),
    OUT_FOR_DELIVERY: () => sendOrderStatusEmail(order, { ...customer.toObject(), email }, 'Out for Delivery'),
    ORDER_CANCELLED: () => sendOrderStatusEmail(order, { ...customer.toObject(), email }, 'Cancelled'),
    REFUND_PENDING: () => sendOrderStatusEmail(order, { ...customer.toObject(), email }, 'Refund Pending'),
  };

  const handler = eventHandlers[log.eventType];
  if (!handler) throw new Error(`No handler for event type: ${log.eventType}`);

  return handler();
};

module.exports = {
  sendEmail,
  sendOrderPlacedEmail,
  sendPaymentSuccessEmail,
  sendOrderStatusEmail,
  retryEmailLog,
};
