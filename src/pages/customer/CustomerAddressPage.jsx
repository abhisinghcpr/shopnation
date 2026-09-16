import React, { useState, useEffect } from 'react';
import { addressService } from '../../services/addressService';

const CustomerAddressPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal / Form state
  const [showForm, setShowForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    flatNo: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'Home',
    isDefault: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const showToast = (setter, msg) => {
    setter(msg);
    setTimeout(() => setter(''), 3500);
  };

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error('Failed to load addresses:', err);
      showToast(setErrorMsg, err.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      flatNo: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      addressType: 'Home',
      isDefault: false,
    });
    setEditingAddressId(null);
    setShowForm(false);
  };

  const handleOpenAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEditForm = (addr) => {
    setEditingAddressId(addr._id);
    setFormData({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      flatNo: addr.flatNo || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      addressType: addr.addressType || 'Home',
      isDefault: addr.isDefault || false,
    });
    setShowForm(true);
  };

  const handleSubmitForm = async (e) => {
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
      showToast(setErrorMsg, 'Please fill in all required address fields.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      if (editingAddressId) {
        const res = await addressService.updateAddress(editingAddressId, formData);
        setAddresses(res.addresses);
        showToast(setSuccessMsg, 'Address updated successfully!');
      } else {
        const res = await addressService.addAddress(formData);
        setAddresses(res.addresses);
        showToast(setSuccessMsg, 'Address added successfully!');
      }
      resetForm();
    } catch (err) {
      showToast(setErrorMsg, err.message || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await addressService.deleteAddress(addressId);
      setAddresses(res.addresses);
      showToast(setSuccessMsg, 'Address deleted successfully!');
    } catch (err) {
      showToast(setErrorMsg, err.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const res = await addressService.setDefaultAddress(addressId);
      setAddresses(res.addresses);
      showToast(setSuccessMsg, 'Default delivery address updated!');
    } catch (err) {
      showToast(setErrorMsg, err.message || 'Failed to set default address');
    }
  };

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

      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="card-header bg-white py-3 px-4 d-flex align-items-center justify-content-between border-bottom">
          <h5 className="fw-bold text-dark mb-0">
            <i className="bi bi-geo-alt-fill text-fk-blue me-2"></i> My Saved Delivery Addresses
          </h5>
          {!showForm && (
            <button
              onClick={handleOpenAddForm}
              className="btn btn-fk-blue text-white fw-semibold btn-sm shadow-sm"
            >
              <i className="bi bi-plus-lg me-1"></i> Add New Address
            </button>
          )}
        </div>

        <div className="card-body p-4">
          {/* Add / Edit Form Drawer/Box */}
          {showForm && (
            <div className="card border p-4 mb-4 bg-light shadow-sm rounded-3">
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h6 className="fw-bold text-dark mb-0">
                  {editingAddressId ? 'Edit Address' : 'Add New Delivery Address'}
                </h6>
                <button type="button" className="btn-close" onClick={resetForm}></button>
              </div>

              <form onSubmit={handleSubmitForm}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fs-7 fw-semibold text-secondary">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      className="form-control fs-7"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fs-7 fw-semibold text-secondary">10-Digit Mobile Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control fs-7"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fs-7 fw-semibold text-secondary">House No. / Flat / Building *</label>
                    <input
                      type="text"
                      name="flatNo"
                      className="form-control fs-7"
                      placeholder="e.g. Flat 402, Green View Apartments"
                      value={formData.flatNo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fs-7 fw-semibold text-secondary">Street / Area / Landmark *</label>
                    <input
                      type="text"
                      name="street"
                      className="form-control fs-7"
                      placeholder="e.g. MG Road, Near City Mall"
                      value={formData.street}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label fs-7 fw-semibold text-secondary">City *</label>
                    <input
                      type="text"
                      name="city"
                      className="form-control fs-7"
                      placeholder="e.g. New Delhi"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label fs-7 fw-semibold text-secondary">State *</label>
                    <input
                      type="text"
                      name="state"
                      className="form-control fs-7"
                      placeholder="e.g. Delhi"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label fs-7 fw-semibold text-secondary">6-Digit Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      className="form-control fs-7"
                      placeholder="e.g. 110001"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fs-7 fw-semibold text-secondary">Address Type</label>
                    <div className="d-flex gap-4 mt-1">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="addressType"
                          id="typeHome"
                          value="Home"
                          checked={formData.addressType === 'Home'}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label fs-7" htmlFor="typeHome">
                          <i className="bi bi-house me-1"></i> Home (All day delivery)
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="addressType"
                          id="typeWork"
                          value="Work"
                          checked={formData.addressType === 'Work'}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label fs-7" htmlFor="typeWork">
                          <i className="bi bi-briefcase me-1"></i> Work (Delivery 9 AM - 6 PM)
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="form-check mt-md-4">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="isDefault"
                        id="isDefault"
                        checked={formData.isDefault}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label fs-7 fw-semibold" htmlFor="isDefault">
                        Make this my default delivery address
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-4 d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-fk-orange text-white fw-bold btn-sm px-4">
                    {submitting ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Saved Addresses */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading addresses...</span>
              </div>
              <p className="mt-2 text-muted fs-7">Loading saved addresses...</p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-geo-alt fs-1 text-secondary d-block mb-2"></i>
              <h6 className="fw-bold text-dark">No Saved Addresses Found</h6>
              <p className="text-muted fs-8 mb-3">Add a shipping address to receive your orders smoothly.</p>
              <button onClick={handleOpenAddForm} className="btn btn-primary btn-sm fw-semibold">
                <i className="bi bi-plus-lg me-1"></i> Add Address Now
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {addresses.map((addr) => (
                <div key={addr._id} className="col-12 col-md-6">
                  <div className={`card h-100 border p-3 rounded-3 position-relative ${addr.isDefault ? 'border-primary bg-blue-50' : 'bg-white'}`}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-secondary text-uppercase fs-9">{addr.addressType}</span>
                        {addr.isDefault && (
                          <span className="badge bg-success fs-9">Default</span>
                        )}
                      </div>
                      <div className="dropdown">
                        <button className="btn btn-light btn-sm border-0 p-1" type="button" data-bs-toggle="dropdown">
                          <i className="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow-sm fs-7">
                          <li>
                            <button className="dropdown-item" onClick={() => handleOpenEditForm(addr)}>
                              <i className="bi bi-pencil me-2"></i> Edit
                            </button>
                          </li>
                          {!addr.isDefault && (
                            <li>
                              <button className="dropdown-item text-success" onClick={() => handleSetDefault(addr._id)}>
                                <i className="bi bi-check2-circle me-2"></i> Set as Default
                              </button>
                            </li>
                          )}
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button className="dropdown-item text-danger" onClick={() => handleDeleteAddress(addr._id)}>
                              <i className="bi bi-trash me-2"></i> Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <h6 className="fw-bold text-dark mb-1">{addr.fullName}</h6>
                    <p className="text-muted fs-7 mb-1">{addr.phone}</p>
                    <p className="text-dark fs-7 mb-0">
                      {addr.flatNo}, {addr.street}, {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerAddressPage;
