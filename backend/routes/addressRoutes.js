const express = require('express');
const router = express.Router();
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/addressController');
const { protectCustomer } = require('../middleware/customerAuthMiddleware');

router.use(protectCustomer);

router.route('/')
  .get(getAddresses)
  .post(addAddress);

router.route('/:addressId')
  .put(updateAddress)
  .delete(deleteAddress);

router.patch('/:addressId/default', setDefaultAddress);

module.exports = router;
