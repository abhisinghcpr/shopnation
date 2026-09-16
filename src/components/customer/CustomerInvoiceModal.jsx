import React from 'react';
import { getImageUrl } from '../../config/apiConfig';

const CustomerInvoiceModal = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const { shippingAddress = {} } = order;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1055 }}
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Top Modal Header Bar (Hidden during print) */}
          <div className="modal-header bg-dark text-white d-print-none py-3 px-4">
            <h5 className="modal-title fw-bold fs-6">
              <i className="bi bi-file-earmark-pdf text-danger me-2"></i> Tax Invoice #{order.orderNumber}
            </h5>
            <div className="d-flex align-items-center gap-2">
              <button onClick={handlePrint} className="btn btn-warning btn-sm fw-bold px-3">
                <i className="bi bi-printer me-1"></i> Print / Download PDF
              </button>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
          </div>

          {/* Printable Invoice Container */}
          <div className="modal-body p-4 sm:p-5 bg-white text-dark printable-invoice">
            {/* Invoice Header */}
            <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
              <div>
                <h2 className="fw-bold text-dark italic leading-none mb-1">
                  Shop<span className="text-primary">Nation</span>
                </h2>
                <p className="text-muted fs-8 mb-0">ShopNation E-Commerce Pvt Ltd.</p>
                <p className="text-muted fs-8 mb-0">Support: abhisheksinghdev22@gmail.com | +91 8521616449</p>
              </div>
              <div className="text-end">
                <span className="badge bg-primary text-uppercase px-3 py-1.5 fs-8 mb-1">TAX INVOICE</span>
                <h6 className="fw-bold text-dark mb-0 fs-7">Invoice #: {order.orderNumber}</h6>
                <p className="text-muted fs-8 mb-0">
                  Date:{' '}
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Customer & Order Metadata Grid */}
            <div className="row g-4 mb-4 pb-3 border-bottom fs-7">
              <div className="col-6">
                <h6 className="fw-bold text-secondary text-uppercase fs-8 mb-2">Billed & Shipped To:</h6>
                <div className="fw-bold text-dark">{shippingAddress.fullName}</div>
                <div>{shippingAddress.flatNo}, {shippingAddress.street}</div>
                <div>{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}</div>
                <div className="text-muted fs-8 mt-1">Phone: {shippingAddress.phone}</div>
              </div>
              <div className="col-6 text-end">
                <h6 className="fw-bold text-secondary text-uppercase fs-8 mb-2">Payment Details:</h6>
                <div>Method: <strong>{order.paymentMethod === 'Razorpay' ? 'Razorpay Online' : 'Cash on Delivery'}</strong></div>
                <div>Status: <span className="fw-bold text-success">{order.paymentStatus}</span></div>
                {order.razorpayPaymentId && (
                  <div className="text-muted fs-8 mt-1 font-mono">Payment ID: {order.razorpayPaymentId}</div>
                )}
              </div>
            </div>

            {/* Itemized Table */}
            <h6 className="fw-bold text-dark mb-2 fs-7">Order Summary</h6>
            <div className="table-responsive border rounded mb-4">
              <table className="table align-middle mb-0 fs-7">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Product Description</th>
                    <th className="text-center">Unit Price</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <div className="fw-bold text-dark">{item.name}</div>
                      </td>
                      <td className="text-center">₹{item.price.toLocaleString('en-IN')}</td>
                      <td className="text-center fw-semibold">{item.quantity}</td>
                      <td className="text-end fw-bold">₹{item.subtotal.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="row justify-content-end mb-4">
              <div className="col-6">
                <div className="p-3 border rounded bg-light fs-7">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Subtotal:</span>
                    <span className="fw-semibold">₹{order.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Delivery Charges:</span>
                    <span>{order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between font-bold fs-6 text-dark">
                    <span>Total Amount Paid/Payable:</span>
                    <span className="text-primary">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Footer / Declaration */}
            <div className="border-top pt-3 text-center text-muted fs-8">
              <p className="mb-1">This is a computer-generated tax invoice. No signature is required.</p>
              <p className="mb-0">Thank you for shopping with ShopNation!</p>
            </div>
          </div>

          {/* Modal Bottom Footer (Hidden during print) */}
          <div className="modal-footer bg-light d-print-none py-2 px-4">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary btn-sm fw-semibold" onClick={handlePrint}>
              <i className="bi bi-printer me-1"></i> Print Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInvoiceModal;
