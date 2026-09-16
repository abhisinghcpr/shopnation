const Customer = require('../models/Customer');

// @desc    Get customer addresses
// @route   GET /api/v1/customer/addresses
// @access  Private (Customer)
const getAddresses = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    return res.status(200).json({
      success: true,
      addresses: customer.addresses || [],
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching addresses' });
  }
};

// @desc    Add new address
// @route   POST /api/v1/customer/addresses
// @access  Private (Customer)
const addAddress = async (req, res) => {
  try {
    const { fullName, phone, flatNo, street, city, state, pincode, addressType, isDefault } = req.body;

    if (!fullName || !phone || !flatNo || !street || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'All address fields are required (Full name, phone, flat number, street, city, state, pincode)',
      });
    }

    const customer = await Customer.findById(req.customer._id);

    const isFirstAddress = customer.addresses.length === 0;
    const makeDefault = isDefault || isFirstAddress;

    if (makeDefault) {
      customer.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      flatNo: flatNo.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      addressType: addressType || 'Home',
      isDefault: makeDefault,
    };

    customer.addresses.push(newAddress);
    await customer.save();

    return res.status(201).json({
      success: true,
      message: 'Address added successfully',
      addresses: customer.addresses,
    });
  } catch (error) {
    console.error('Error adding address:', error);
    return res.status(500).json({ success: false, message: 'Server error adding address' });
  }
};

// @desc    Update existing address
// @route   PUT /api/v1/customer/addresses/:addressId
// @access  Private (Customer)
const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { fullName, phone, flatNo, street, city, state, pincode, addressType, isDefault } = req.body;

    const customer = await Customer.findById(req.customer._id);
    const address = customer.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (isDefault) {
      customer.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    if (fullName) address.fullName = fullName.trim();
    if (phone) address.phone = phone.trim();
    if (flatNo) address.flatNo = flatNo.trim();
    if (street) address.street = street.trim();
    if (city) address.city = city.trim();
    if (state) address.state = state.trim();
    if (pincode) address.pincode = pincode.trim();
    if (addressType) address.addressType = addressType;
    if (typeof isDefault === 'boolean') address.isDefault = isDefault;

    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      addresses: customer.addresses,
    });
  } catch (error) {
    console.error('Error updating address:', error);
    return res.status(500).json({ success: false, message: 'Server error updating address' });
  }
};

// @desc    Delete address
// @route   DELETE /api/v1/customer/addresses/:addressId
// @access  Private (Customer)
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const customer = await Customer.findById(req.customer._id);
    const addressIndex = customer.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const wasDefault = customer.addresses[addressIndex].isDefault;
    customer.addresses.splice(addressIndex, 1);

    if (wasDefault && customer.addresses.length > 0) {
      customer.addresses[0].isDefault = true;
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      addresses: customer.addresses,
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting address' });
  }
};

// @desc    Set default address
// @route   PATCH /api/v1/customer/addresses/:addressId/default
// @access  Private (Customer)
const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const customer = await Customer.findById(req.customer._id);
    const targetAddress = customer.addresses.id(addressId);

    if (!targetAddress) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    customer.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressId;
    });

    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Default address updated',
      addresses: customer.addresses,
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    return res.status(500).json({ success: false, message: 'Server error setting default address' });
  }
};

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
