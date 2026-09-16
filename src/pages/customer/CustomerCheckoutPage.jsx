import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { addressService } from '../../services/addressService';
import { orderService } from '../../services/orderService';
import { razorpayService } from '../../services/razorpayService';
import { getImageUrl } from '../../config/apiConfig';

const CustomerCheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, cartLoading, refreshCart, customer } = useCustomerAuth();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [paymentMode, setPaymentMode] = useState('COD'); // 'COD' | 'Razorpay'
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Inline Add Address state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: customer?.name || '',
    phone: customer?.phone || '',
    flatNo: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'Home',
    isDefault: true,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const showToast = (setter, msg) => {
    setter(msg);
    setTimeout(() => setter(''), 4000);
  };

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
      const defaultAddr = data.find((a) => a.isDefault) || data[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveInlineAddress = async (e) => {
    e.preventDefault();
    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.flatNo ||
      !formData.street ||
      !formData.city ||
      !formData.state ||
      !formData.pincode
    ) {
      showToast(setErrorMsg, 'Please fill in all address fields');
      return;
    }

    try {
      const res = await addressService.addAddress(formData);
      setAddresses(res.addresses);
      const newAdded = res.addresses[res.addresses.length - 1];
      if (newAdded) {
        setSelectedAddressId(newAdded._id);
      }
      setShowAddForm(false);
      showToast(setSuccessMsg, 'Address added and selected for delivery!');
    } catch (err) {
      showToast(setErrorMsg, err.message || 'Failed to add address');
    }
  };

  const handlePlaceCODOrder = async () => {
    if (!selectedAddressId) {
      showToast(setErrorMsg, 'Please select or add a delivery address.');
      return;
    }

    if (!cart || cart.length === 0) {
      showToast(setErrorMsg, 'Your cart is empty.');
      return;
    }

    setOrderPlacing(true);
    setErrorMsg('');
    try {
      const res = await orderService.placeOrder({
        addressId: selectedAddressId,
        paymentMethod: 'COD',
      });

      await refreshCart();
      navigate(`/customer/orders/${res.order._id}`, {
        state: { orderSuccess: true, message: 'COD Order Placed Successfully!' },
      });
    } catch (err) {
      showToast(setErrorMsg, err.message || 'Failed to place order.');
    } finally {
      setOrderPlacing(false);
    }
  };

  const handlePlaceRazorpayOrder = async () => {
    if (!selectedAddressId) {
      showToast(setErrorMsg, 'Please select or add a delivery address.');
      return;
    }

    if (!cart || cart.length === 0) {
      showToast(setErrorMsg, 'Your cart is empty.');
      return;
    }

    if (typeof window.Razorpay === 'undefined') {
      showToast(
        setErrorMsg,
        'Razorpay Payment Gateway failed to load. Please check your internet connection or reload.'
      );
      return;
    }

    setOrderPlacing(true);
    setErrorMsg('');

    try {
      // 1. Create Razorpay order from live backend cart
      const res = await razorpayService.createRazorpayOrder();
      const { razorpayOrder, keyId } = res;

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || keyId || 'rzp_test_TceaVsGXcXAdv8';

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'ShopNation E-Commerce',
        description: `Order Payment #${razorpayOrder.id}`,
        image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        order_id: razorpayOrder.id,
        prefill: {
          name: customer?.name || '',
          email: customer?.email || '',
          contact: customer?.phone || '',
        },
        theme: {
          color: '#2874f0',
        },
        handler: async function (response) {
          // 3. Verify Payment Signature on Backend
          try {
            const verificationRes = await razorpayService.verifyRazorpayPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              addressId: selectedAddressId,
            });

            await refreshCart();
            navigate(`/customer/orders/${verificationRes.order._id}`, {
              state: { orderSuccess: true, message: 'Online Payment Verified & Order Placed Successfully!' },
            });
          } catch (err) {
            console.error('Razorpay verification error:', err);
            showToast(setErrorMsg, err.message || 'Payment signature verification failed.');
            setOrderPlacing(false);
          }
        },
        modal: {
          onDismiss: function () {
            setOrderPlacing(false);
            showToast(setErrorMsg, 'Payment process was cancelled by the user.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error('Razorpay Payment Failed:', response.error);
        setOrderPlacing(false);
        showToast(setErrorMsg, response.error?.description || 'Online Payment Failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay initialization error:', err);
      showToast(setErrorMsg, err.message || 'Failed to initialize payment.');
      setOrderPlacing(false);
    }
  };

  // Calculations
  const rawSubtotal = cart.reduce((acc, item) => {
    const price = item.product?.price || 0;
    return acc + price * (item.quantity || 1);
  }, 0);

  const subtotal = cart.reduce((acc, item) => {
    const finalPrice = item.product?.finalPrice ?? item.product?.price ?? 0;
    return acc + finalPrice * (item.quantity || 1);
  }, 0);

  const totalDiscount = Math.max(0, rawSubtotal - subtotal);
  const deliveryCharge = subtotal > 500 || subtotal === 0 ? 0 : 40;
  const grandTotal = subtotal + deliveryCharge;

  if (cartLoading) {
    return (
      <div className="container py-5 text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading checkout...</span>
        </div>
        <p className="mt-2 text-muted fw-semibold">Loading checkout details...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container py-5">
        <div className="card border-0 shadow-sm p-5 text-center max-w-2xl mx-auto my-4 rounded-4">
          <div className="w-20 h-20 bg-light text-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4">
            <i className="bi bi-cart-x fs-1"></i>
          </div>
          <h3 className="fw-bold text-dark mb-2">Your Cart is Empty!</h3>
          <p className="text-muted mb-4">You cannot proceed to checkout with an empty cart.</p>
          <div>
            <Link to="/customer/products" className="btn btn-fk-blue text-white font-semibold px-4 py-2.5 rounded">
              <i className="bi bi-shop me-2"></i> Shop Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Toast Alerts */}
      {errorMsg && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMsg}
          <button type="button" className="btn-close" onClick={() => setErrorMsg('')}></button>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Checkout Steps */}
        <div className="col-12 col-lg-8">
          {/* Step 1: Login Status */}
          <div className="card border-0 shadow-sm rounded-3 mb-3">
            <div className="card-header bg-white py-3 px-4 d-flex align-items-center justify-content-between">
              <span className="fw-bold text-secondary fs-7 uppercase">
                1. LOGIN <i className="bi bi-check-circle-fill text-success ms-1"></i>
              </span>
              <span className="fs-7 text-dark fw-semibold">{customer?.name} ({customer?.email})</span>
            </div>
          </div>

          {/* Step 2: Delivery Address Selection */}
          <div className="card border-0 shadow-sm rounded-3 mb-3">
            <div className="card-header bg-fk-blue text-white py-3 px-4 d-flex align-items-center justify-content-between">
              <h6 className="fw-bold mb-0 text-uppercase fs-7">2. DELIVERY ADDRESS</h6>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn btn-light text-fk-blue btn-sm fw-bold px-3 py-1 fs-8"
                >
                  <i className="bi bi-plus-lg me-1"></i> Add New Address
                </button>
              )}
            </div>

            <div className="card-body p-4">
              {showAddForm ? (
                <form onSubmit={handleSaveInlineAddress} className="border p-3 rounded-3 bg-light">
                  <h6 className="fw-bold text-dark mb-3">Add Delivery Address</h6>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <input
                        type="text"
                        name="fullName"
                        className="form-control fs-7"
                        placeholder="Full Name *"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <input
                        type="tel"
                        name="phone"
                        className="form-control fs-7"
                        placeholder="Mobile Number *"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <input
                        type="text"
                        name="flatNo"
                        className="form-control fs-7"
                        placeholder="House / Flat No *"
                        value={formData.flatNo}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <input
                        type="text"
                        name="street"
                        className="form-control fs-7"
                        placeholder="Street / Area / Landmark *"
                        value={formData.street}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <input
                        type="text"
                        name="city"
                        className="form-control fs-7"
                        placeholder="City *"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <input
                        type="text"
                        name="state"
                        className="form-control fs-7"
                        placeholder="State *"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <input
                        type="text"
                        name="pincode"
                        className="form-control fs-7"
                        placeholder="Pincode *"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-3 d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-fk-orange text-white fw-bold btn-sm px-4">
                      Save & Select Address
                    </button>
                  </div>
                </form>
              ) : loadingAddresses ? (
                <div className="text-center py-3 fs-7 text-muted">Loading saved addresses...</div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted fs-7 mb-2">No shipping address found in your account.</p>
                  <button onClick={() => setShowAddForm(true)} className="btn btn-primary btn-sm fw-bold">
                    <i className="bi bi-plus-lg me-1"></i> Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`p-3 border rounded-3 cursor-pointer transition-all ${
                        selectedAddressId === addr._id ? 'border-primary bg-blue-50' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedAddressId(addr._id)}
                    >
                      <div className="d-flex items-center gap-3">
                        <input
                          type="radio"
                          name="addressRadio"
                          checked={selectedAddressId === addr._id}
                          onChange={() => setSelectedAddressId(addr._id)}
                          className="form-check-input mt-1"
                        />
                        <div className="flex-1">
                          <div className="d-flex items-center gap-2 mb-1">
                            <span className="fw-bold text-dark">{addr.fullName}</span>
                            <span className="badge bg-secondary text-uppercase fs-9">{addr.addressType}</span>
                            <span className="text-muted fs-7 me-2">{addr.phone}</span>
                          </div>
                          <p className="text-dark fs-7 mb-0">
                            {addr.flatNo}, {addr.street}, {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Order Review */}
          <div className="card border-0 shadow-sm rounded-3 mb-3">
            <div className="card-header bg-white py-3 px-4 border-bottom">
              <h6 className="fw-bold text-secondary text-uppercase fs-7 mb-0">3. ORDER SUMMARY ({cart.length} ITEMS)</h6>
            </div>
            <div className="list-group list-group-flush">
              {cart.map((item) => {
                const prod = item.product || {};
                const finalP = prod.finalPrice ?? prod.price ?? 0;
                return (
                  <div key={prod._id || prod.id} className="list-group-item p-3">
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={getImageUrl(prod.image) || 'https://via.placeholder.com/60?text=Product'}
                        alt={prod.name}
                        className="rounded border p-1 bg-light"
                        width="60"
                        height="60"
                        style={{ objectFit: 'contain' }}
                      />
                      <div className="flex-1">
                        <h6 className="fw-semibold text-dark fs-7 mb-0 line-clamp-1">{prod.name}</h6>
                        <span className="text-muted fs-8">Qty: {item.quantity}</span>
                      </div>
                      <div className="text-end">
                        <span className="fw-bold text-dark fs-7">₹{(finalP * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 4: Payment Options */}
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white py-3 px-4 border-bottom">
              <h6 className="fw-bold text-secondary text-uppercase fs-7 mb-0">4. PAYMENT OPTIONS</h6>
            </div>
            <div className="card-body p-4">
              <div className="space-y-3 mb-4">
                {/* Option A: Cash on Delivery */}
                <div
                  className={`form-check p-3 border rounded-3 cursor-pointer transition-all ${
                    paymentMode === 'COD' ? 'border-primary bg-blue-50' : 'bg-light hover:bg-gray-100'
                  }`}
                  onClick={() => setPaymentMode('COD')}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <input
                        className="form-check-input me-2"
                        type="radio"
                        name="paymentModeRadio"
                        id="codRadio"
                        checked={paymentMode === 'COD'}
                        onChange={() => setPaymentMode('COD')}
                      />
                      <label className="form-check-label fw-bold text-dark fs-6" htmlFor="codRadio">
                        Cash on Delivery (COD)
                      </label>
                      <p className="text-muted fs-8 mb-0 mt-0.5 ms-4">
                        Pay cash to the delivery executive upon arrival.
                      </p>
                    </div>
                    <i className="bi bi-cash-stack fs-2 text-success"></i>
                  </div>
                </div>

                {/* Option B: Razorpay Online Payment */}
                <div
                  className={`form-check p-3 border rounded-3 cursor-pointer transition-all ${
                    paymentMode === 'Razorpay' ? 'border-primary bg-blue-50' : 'bg-light hover:bg-gray-100'
                  }`}
                  onClick={() => setPaymentMode('Razorpay')}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <input
                        className="form-check-input me-2"
                        type="radio"
                        name="paymentModeRadio"
                        id="razorpayRadio"
                        checked={paymentMode === 'Razorpay'}
                        onChange={() => setPaymentMode('Razorpay')}
                      />
                      <label className="form-check-label fw-bold text-dark fs-6" htmlFor="razorpayRadio">
                        Online Payment (Razorpay)
                      </label>
                      <p className="text-muted fs-8 mb-0 mt-0.5 ms-4">
                        Pay instantly via UPI, Credit/Debit Cards, NetBanking, or Wallets (Test Mode).
                      </p>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <span className="badge bg-primary text-white fs-9 me-1">UPI / CARDS</span>
                      <i className="bi bi-credit-card-2-front-fill fs-2 text-primary"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 text-end">
                {paymentMode === 'COD' ? (
                  <button
                    onClick={handlePlaceCODOrder}
                    disabled={orderPlacing || !selectedAddressId}
                    className="btn btn-fk-orange text-white fw-bold px-5 py-3 text-uppercase rounded shadow-sm"
                  >
                    {orderPlacing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Placing Order...
                      </>
                    ) : (
                      <>
                        Confirm & Place COD Order <i className="bi bi-arrow-right ms-1"></i>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceRazorpayOrder}
                    disabled={orderPlacing || !selectedAddressId}
                    className="btn btn-primary text-white fw-bold px-5 py-3 text-uppercase rounded shadow-sm"
                  >
                    {orderPlacing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Initializing Razorpay Payment...
                      </>
                    ) : (
                      <>
                        Pay ₹{grandTotal.toLocaleString('en-IN')} via Razorpay <i className="bi bi-[#2874f0] bi-lock-fill ms-1"></i>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Price Details */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-3 sticky-top" style={{ top: '100px' }}>
            <div className="card-header bg-white py-3 px-4 border-bottom">
              <h6 className="fw-bold text-secondary text-uppercase fs-8 mb-0">Price Details</h6>
            </div>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between mb-3 fs-7">
                <span className="text-secondary">Price ({cart.reduce((t, i) => t + (i.quantity || 1), 0)} items)</span>
                <span className="fw-semibold">₹{rawSubtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="d-flex justify-content-between mb-3 fs-7 text-success">
                <span>Discount</span>
                <span className="fw-semibold">- ₹{totalDiscount.toLocaleString('en-IN')}</span>
              </div>

              <div className="d-flex justify-content-between mb-3 fs-7">
                <span className="text-secondary">Delivery Charges</span>
                <span className={deliveryCharge === 0 ? 'text-success fw-semibold' : 'fw-semibold'}>
                  {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                </span>
              </div>

              <hr className="my-3" />

              <div className="d-flex justify-content-between mb-2 fs-6 fw-bold text-dark">
                <span>Total Payable</span>
                <span className="fs-5 text-dark">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="alert alert-success py-2 px-3 fs-8 fw-semibold mb-0 mt-3 border-0">
                  Your Total Savings on this order: ₹{totalDiscount.toLocaleString('en-IN')}
                </div>
              )}
            </div>
            <div className="card-footer bg-light p-3 fs-8 text-muted d-flex align-items-center gap-2">
              <i className="bi bi-shield-check fs-5 text-success"></i>
              <span>100% Secure Payments via Razorpay & Cash on Delivery.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCheckoutPage;
