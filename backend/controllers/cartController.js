const Customer = require('../models/Customer');
const Product = require('../models/Product');

// @desc    Get customer cart
// @route   GET /api/v1/customer/cart
// @access  Private (Customer)
const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id).populate({
      path: 'cart.product',
      populate: { path: 'category', select: 'name' },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Filter out null products if any were deleted from database
    const cleanCart = customer.cart.filter((item) => item.product !== null);
    if (cleanCart.length !== customer.cart.length) {
      customer.cart = cleanCart;
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      cart: customer.cart,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching cart' });
  }
};

// @desc    Add product to cart or update quantity
// @route   POST /api/v1/customer/cart
// @access  Private (Customer)
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
    }

    if (product.quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Product is out of stock' });
    }

    const customer = await Customer.findById(req.customer._id);
    const existingIndex = customer.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    const requestedQty = Math.max(1, Number(quantity));

    if (existingIndex > -1) {
      const currentCartQty = customer.cart[existingIndex].quantity;
      const newQty = currentCartQty + requestedQty;

      if (newQty > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Available stock limit reached (${product.quantity} max)`,
        });
      }

      customer.cart[existingIndex].quantity = newQty;
    } else {
      if (requestedQty > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity exceeds available stock (${product.quantity} max)`,
        });
      }

      customer.cart.push({
        product: productId,
        quantity: requestedQty,
      });
    }

    await customer.save();

    const updatedCustomer = await Customer.findById(req.customer._id).populate({
      path: 'cart.product',
      populate: { path: 'category', select: 'name' },
    });

    return res.status(200).json({
      success: true,
      message: 'Product added to cart successfully',
      cart: updatedCustomer.cart,
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return res.status(500).json({ success: false, message: 'Server error adding to cart' });
  }
};

// @desc    Update item quantity in cart
// @route   PUT /api/v1/customer/cart/item/:productId
// @access  Private (Customer)
const updateCartItemQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const newQty = Number(quantity);
    if (isNaN(newQty) || newQty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (newQty > product.quantity) {
      return res.status(400).json({
        success: false,
        message: `Stock limit reached. Maximum available stock is ${product.quantity}`,
      });
    }

    const customer = await Customer.findById(req.customer._id);
    const itemIndex = customer.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    customer.cart[itemIndex].quantity = newQty;
    await customer.save();

    const updatedCustomer = await Customer.findById(req.customer._id).populate({
      path: 'cart.product',
      populate: { path: 'category', select: 'name' },
    });

    return res.status(200).json({
      success: true,
      message: 'Cart item quantity updated',
      cart: updatedCustomer.cart,
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return res.status(500).json({ success: false, message: 'Server error updating cart item' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/v1/customer/cart/item/:productId
// @access  Private (Customer)
const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const customer = await Customer.findById(req.customer._id);
    customer.cart = customer.cart.filter(
      (item) => item.product.toString() !== productId
    );

    await customer.save();

    const updatedCustomer = await Customer.findById(req.customer._id).populate({
      path: 'cart.product',
      populate: { path: 'category', select: 'name' },
    });

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: updatedCustomer.cart,
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return res.status(500).json({ success: false, message: 'Server error removing cart item' });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/v1/customer/cart
// @access  Private (Customer)
const clearCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    customer.cart = [];
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      cart: [],
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return res.status(500).json({ success: false, message: 'Server error clearing cart' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};
