import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { getImageUrl } from '../../config/apiConfig';

const AdminProductPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ADD'); // 'ADD' or 'EDIT'
  const [currentProductId, setCurrentProductId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    discountType: 'percentage',
    discountValue: '0',
    quantity: '10',
    rating: '0',
    reviewCount: '0',
    description: '',
    isActive: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories(),
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
    } catch (err) {
      console.error('Failed to load product data:', err);
      setErrorMsg('Unable to load product catalog');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg({ type: '', text: '' });
    }, 4000);
  };

  // Real-time calculation of Final Price for the form
  const calculateFinalPrice = () => {
    const priceNum = Number(formData.price) || 0;
    const discVal = Number(formData.discountValue) || 0;

    if (priceNum <= 0) return 0;

    let finalP = priceNum;
    if (formData.discountType === 'percentage') {
      const validPercent = Math.min(Math.max(discVal, 0), 100);
      finalP = priceNum - (priceNum * validPercent) / 100;
    } else if (formData.discountType === 'fixed') {
      const validFixed = Math.min(Math.max(discVal, 0), priceNum);
      finalP = priceNum - validFixed;
    }

    return Math.max(0, Math.round(finalP * 100) / 100);
  };

  const calculateDiscountAmount = () => {
    const priceNum = Number(formData.price) || 0;
    const finalP = calculateFinalPrice();
    return Math.max(0, Math.round((priceNum - finalP) * 100) / 100);
  };

  // Filter products by search query and category dropdown
  const filteredProducts = products.filter((prod) => {
    const categoryName = typeof prod.category === 'object' ? prod.category?.name : prod.category;
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (categoryName && categoryName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' || categoryName === selectedCategory || prod.category?._id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleOpenAddModal = () => {
    setModalMode('ADD');
    setCurrentProductId(null);
    setFormData({
      name: '',
      category: categories.length > 0 ? categories[0]._id : '',
      price: '',
      discountType: 'percentage',
      discountValue: '0',
      quantity: '10',
      rating: '0',
      reviewCount: '0',
      description: '',
      isActive: true,
    });
    setImageFile(null);
    setImagePreview('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setModalMode('EDIT');
    setCurrentProductId(prod._id || prod.id);
    setFormData({
      name: prod.name,
      category: typeof prod.category === 'object' ? prod.category?._id : prod.category,
      price: prod.price !== undefined ? prod.price.toString() : '',
      discountType: prod.discountType || 'percentage',
      discountValue: prod.discountValue !== undefined ? prod.discountValue.toString() : '0',
      quantity: prod.quantity !== undefined ? prod.quantity.toString() : '0',
      rating: prod.rating !== undefined ? prod.rating.toString() : '0',
      reviewCount: prod.reviewCount !== undefined ? prod.reviewCount.toString() : '0',
      description: prod.description || '',
      isActive: prod.isActive !== undefined ? prod.isActive : true,
    });
    setImageFile(null);
    setImagePreview(prod.image ? getImageUrl(prod.image) : '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({ ...prev, image: 'File size must be less than 5MB' }));
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        setFormErrors((prev) => ({ ...prev, image: 'Only image files are allowed' }));
        return;
      }

      setImageFile(file);
      setFormErrors((prev) => ({ ...prev, image: '' }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Product Name is required';
    }

    if (!formData.category) {
      errors.category = 'Category selection is required';
    }

    const priceNum = Number(formData.price);
    if (!formData.price && formData.price !== '0') {
      errors.price = 'Original Price is required';
    } else if (isNaN(priceNum) || priceNum < 0) {
      errors.price = 'Original Price must be a non-negative number';
    }

    const discVal = Number(formData.discountValue);
    if (isNaN(discVal) || discVal < 0) {
      errors.discountValue = 'Discount Value cannot be negative';
    } else if (formData.discountType === 'percentage' && discVal > 100) {
      errors.discountValue = 'Percentage discount cannot exceed 100%';
    } else if (formData.discountType === 'fixed' && priceNum >= 0 && discVal > priceNum) {
      errors.discountValue = 'Fixed discount cannot exceed Original Price';
    }

    const qtyNum = Number(formData.quantity);
    if (!formData.quantity && formData.quantity !== '0') {
      errors.quantity = 'Quantity is required';
    } else if (isNaN(qtyNum) || qtyNum < 0) {
      errors.quantity = 'Quantity cannot be negative';
    }

    const ratingNum = Number(formData.rating);
    if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      errors.rating = 'Rating must be a number between 0 and 5';
    }

    const reviewNum = Number(formData.reviewCount);
    if (isNaN(reviewNum) || reviewNum < 0) {
      errors.reviewCount = 'Review Count cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('category', formData.category);
      payload.append('price', formData.price);
      payload.append('discountType', formData.discountType);
      payload.append('discountValue', formData.discountValue);
      payload.append('quantity', formData.quantity);
      payload.append('rating', formData.rating);
      payload.append('reviewCount', formData.reviewCount);
      payload.append('description', formData.description.trim());
      payload.append('isActive', formData.isActive);

      if (imageFile) {
        payload.append('image', imageFile);
      }

      if (modalMode === 'ADD') {
        await productService.createProduct(payload);
        showAlert('success', 'Product saved successfully!');
      } else {
        await productService.updateProduct(currentProductId, payload);
        showAlert('success', 'Product updated successfully!');
      }

      setIsModalOpen(false);
      await loadInitialData();
    } catch (err) {
      console.error('Submit product error:', err);
      showAlert('danger', err.message || 'Error processing product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setSubmitting(true);
    try {
      const targetId = deleteTarget._id || deleteTarget.id;
      await productService.deleteProduct(targetId);
      showAlert('success', `Product "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      await loadInitialData();
    } catch (err) {
      console.error('Delete product error:', err);
      showAlert('danger', err.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  const getStockBadge = (quantity, stock) => {
    if (quantity === 0 || stock === 'Out of Stock') {
      return <span className="badge bg-danger bg-opacity-10 text-danger px-2.5 py-1.5"><i className="bi bi-x-circle me-1"></i>Out of Stock</span>;
    }
    if (quantity <= 5 || stock === 'Low Stock') {
      return <span className="badge bg-warning bg-opacity-10 text-dark px-2.5 py-1.5"><i className="bi bi-exclamation-triangle me-1"></i>Low Stock ({quantity})</span>;
    }
    return <span className="badge bg-success bg-opacity-10 text-success px-2.5 py-1.5"><i className="bi bi-check-circle me-1"></i>In Stock ({quantity})</span>;
  };

  const formatDiscountDisplay = (prod) => {
    const val = prod.discountValue || 0;
    if (val === 0) return <span className="text-muted fs-8">No Discount</span>;
    if (prod.discountType === 'fixed') {
      return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle">₹{val} OFF</span>;
    }
    return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle">{val}% OFF</span>;
  };

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 pb-2 border-bottom">
        <div>
          <h3 className="fw-bold text-dark mb-1">Product Management</h3>
          <p className="text-muted mb-0 small">Manage catalog, original prices, discounts, ratings, and stock status</p>
        </div>
        <div className="mt-3 mt-sm-0">
          <button
            className="btn btn-primary fw-semibold d-flex align-items-center shadow-sm"
            onClick={handleOpenAddModal}
          >
            <i className="bi bi-plus-circle me-2 fs-6"></i> Add Product
          </button>
        </div>
      </div>

      {/* Global Toast */}
      {alertMsg.text && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show shadow-sm mb-4`} role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          {alertMsg.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlertMsg({ type: '', text: '' })}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="alert alert-danger shadow-sm mb-4 d-flex align-items-center justify-content-between">
          <div>
            <i className="bi bi-exclamation-octagon-fill me-2"></i>
            {errorMsg}
          </div>
          <button className="btn btn-sm btn-outline-danger" onClick={loadInitialData}>
            Retry
          </button>
        </div>
      )}

      {/* Search & Category Filter Section */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-6 col-lg-7">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search products by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Category Filter Dropdown */}
            <div className="col-12 col-md-4 col-lg-3">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option value={cat.name} key={cat._id || cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Total Count Badge */}
            <div className="col-12 col-md-2 col-lg-2 text-md-end">
              <span className="badge bg-secondary py-2 px-3 fs-7">
                Total: {filteredProducts.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Listing Table */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th scope="col" className="ps-4" style={{ width: '75px' }}>Image</th>
                  <th scope="col">Product Info</th>
                  <th scope="col">Category</th>
                  <th scope="col">Original Price</th>
                  <th scope="col">Discount</th>
                  <th scope="col">Final Price</th>
                  <th scope="col" className="text-center">Quantity</th>
                  <th scope="col" className="text-center">Rating & Reviews</th>
                  <th scope="col" className="text-center">Stock Status</th>
                  <th scope="col" className="text-center pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading products...</span>
                      </div>
                      <p className="mt-2 text-muted mb-0 fs-7">Loading products...</p>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5 text-muted">
                      <i className="bi bi-box-seam fs-1 text-secondary d-block mb-2"></i>
                      <strong className="fs-6">No products found</strong>
                      <p className="small mb-0">Try adding a new product or clear filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const categoryName = typeof prod.category === 'object' ? prod.category?.name : prod.category;
                    const originalP = Number(prod.price) || 0;
                    const finalP = prod.finalPrice !== undefined ? Number(prod.finalPrice) : originalP;

                    return (
                      <tr key={prod._id || prod.id}>
                        {/* Image */}
                        <td className="ps-4 py-3">
                          <img
                            src={prod.image ? getImageUrl(prod.image) : 'https://via.placeholder.com/50?text=No+Image'}
                            alt={prod.name}
                            className="rounded-3 border border-light object-fit-cover shadow-sm"
                            width="50"
                            height="50"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/50?text=No+Img';
                            }}
                          />
                        </td>

                        {/* Name & Description */}
                        <td>
                          <div className="fw-bold text-dark fs-7 mb-0.5">{prod.name}</div>
                          <p
                            className="text-muted fs-8 mb-0 text-truncate"
                            style={{ maxWidth: '200px' }}
                            title={prod.description}
                          >
                            {prod.description || <span className="fst-italic">No description</span>}
                          </p>
                        </td>

                        {/* Category Badge */}
                        <td>
                          <span className="badge bg-light text-primary border border-primary-subtle px-2.5 py-1.5 fw-semibold fs-8">
                            {categoryName || 'Uncategorized'}
                          </span>
                        </td>

                        {/* Original Price */}
                        <td>
                          <span className={prod.discountValue > 0 ? 'text-decoration-line-through text-muted fs-8' : 'fw-bold text-dark'}>
                            ₹{originalP.toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Discount */}
                        <td>{formatDiscountDisplay(prod)}</td>

                        {/* Final Price */}
                        <td>
                          <span className="fw-bold text-success fs-7">₹{finalP.toLocaleString('en-IN')}</span>
                        </td>

                        {/* Quantity */}
                        <td className="text-center">
                          <span className="fw-semibold text-secondary">{prod.quantity}</span>
                        </td>

                        {/* Rating & Reviews */}
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center">
                            <i className="bi bi-star-fill text-warning me-1 fs-8"></i>
                            <span className="fw-bold text-dark fs-8">{(prod.rating || 0).toFixed(1)}</span>
                            <span className="text-muted fs-8 ms-1">/ 5</span>
                          </div>
                          <small className="text-muted fs-9 d-block">
                            {prod.reviewCount || 0} {prod.reviewCount === 1 ? 'review' : 'reviews'}
                          </small>
                        </td>

                        {/* Stock Status */}
                        <td className="text-center">{getStockBadge(prod.quantity, prod.stock)}</td>

                        {/* Actions */}
                        <td className="text-center pe-4">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleOpenEditModal(prod)}
                              title="Edit Product"
                            >
                              <i className="bi bi-pencil-square"></i> Edit
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => setDeleteTarget(prod)}
                              title="Delete Product"
                            >
                              <i className="bi bi-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {modalMode === 'ADD' ? (
                    <>
                      <i className="bi bi-plus-circle me-2"></i> Add Product
                    </>
                  ) : (
                    <>
                      <i className="bi bi-pencil-square me-2"></i> Edit Product
                    </>
                  )}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>

              <form onSubmit={handleFormSubmit} noValidate>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Product Name */}
                    <div className="col-12 col-md-8">
                      <label className="form-label fw-semibold text-secondary">
                        Product Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                        placeholder="e.g. Wireless Bluetooth Headphones"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                      {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                    </div>

                    {/* Category Dropdown */}
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold text-secondary">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${formErrors.category ? 'is-invalid' : ''}`}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat._id || cat.id} value={cat._id || cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.category && (
                        <div className="invalid-feedback">{formErrors.category}</div>
                      )}
                    </div>

                    {/* Original Price */}
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold text-secondary">
                        Original Price (₹) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light">₹</span>
                        <input
                          type="number"
                          className={`form-control ${formErrors.price ? 'is-invalid' : ''}`}
                          placeholder="1000"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                        {formErrors.price && <div className="invalid-feedback">{formErrors.price}</div>}
                      </div>
                    </div>

                    {/* Discount Type */}
                    <div className="col-12 col-sm-6 col-md-4">
                      <label className="form-label fw-semibold text-secondary">Discount Type</label>
                      <select
                        className="form-select"
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                      </select>
                    </div>

                    {/* Discount Value */}
                    <div className="col-12 col-sm-6 col-md-4">
                      <label className="form-label fw-semibold text-secondary">
                        Discount Value ({formData.discountType === 'percentage' ? '%' : '₹'})
                      </label>
                      <input
                        type="number"
                        className={`form-control ${formErrors.discountValue ? 'is-invalid' : ''}`}
                        placeholder="0"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      />
                      {formErrors.discountValue && (
                        <div className="invalid-feedback">{formErrors.discountValue}</div>
                      )}
                    </div>

                    {/* Final Price Preview Box */}
                    <div className="col-12">
                      <div className="p-3 bg-light rounded border border-primary border-opacity-25 d-flex align-items-center justify-content-between">
                        <div>
                          <small className="text-muted fw-semibold text-uppercase d-block fs-8">Calculated Final Price</small>
                          <span className="fw-bold text-success fs-4">₹{calculateFinalPrice().toLocaleString('en-IN')}</span>
                        </div>
                        {calculateDiscountAmount() > 0 && (
                          <div className="text-end">
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-3 py-2 fs-7">
                              Save ₹{calculateDiscountAmount().toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold text-secondary">
                        Quantity in Stock <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className={`form-control ${formErrors.quantity ? 'is-invalid' : ''}`}
                        placeholder="10"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      />
                      {formErrors.quantity && (
                        <div className="invalid-feedback">{formErrors.quantity}</div>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="col-12 col-sm-6 col-md-4">
                      <label className="form-label fw-semibold text-secondary">Rating (0 - 5)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        className={`form-control ${formErrors.rating ? 'is-invalid' : ''}`}
                        placeholder="0.0"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      />
                      {formErrors.rating && <div className="invalid-feedback">{formErrors.rating}</div>}
                    </div>

                    {/* Review Count */}
                    <div className="col-12 col-sm-6 col-md-4">
                      <label className="form-label fw-semibold text-secondary">Review Count</label>
                      <input
                        type="number"
                        min="0"
                        className={`form-control ${formErrors.reviewCount ? 'is-invalid' : ''}`}
                        placeholder="0"
                        value={formData.reviewCount}
                        onChange={(e) => setFormData({ ...formData, reviewCount: e.target.value })}
                      />
                      {formErrors.reviewCount && (
                        <div className="invalid-feedback">{formErrors.reviewCount}</div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <label className="form-label fw-semibold text-secondary">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Product specifications and features..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      ></textarea>
                    </div>

                    {/* Image File Upload */}
                    <div className="col-12">
                      <label className="form-label fw-semibold text-secondary">Product Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        className={`form-control ${formErrors.image ? 'is-invalid' : ''}`}
                        onChange={handleFileChange}
                      />
                      {formErrors.image && <div className="invalid-feedback d-block">{formErrors.image}</div>}

                      {/* Preview Box */}
                      {imagePreview && (
                        <div className="mt-3 text-center p-2 bg-light border rounded">
                          <small className="text-muted d-block mb-1">Image Preview</small>
                          <img
                            src={imagePreview}
                            alt="Product Preview"
                            className="rounded object-fit-cover shadow-sm"
                            style={{ maxWidth: '120px', maxHeight: '120px' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-0 px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold px-4" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : modalMode === 'ADD' ? (
                      'Save Product'
                    ) : (
                      'Update Product'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i> Confirm Delete
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDeleteTarget(null)}
                ></button>
              </div>

              <div className="modal-body p-4 text-center">
                <p className="fs-6 mb-1">
                  Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?
                </p>
                <small className="text-muted">This product will be permanently removed from MongoDB.</small>
              </div>

              <div className="modal-footer bg-light border-0 justify-content-center p-3">
                <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger fw-bold px-4"
                  onClick={handleDeleteConfirm}
                  disabled={submitting}
                >
                  {submitting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductPage;
