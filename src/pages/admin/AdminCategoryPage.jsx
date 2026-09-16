import React, { useState, useEffect } from 'react';
import { categoryService } from '../../services/categoryService';
import { getImageUrl } from '../../config/apiConfig';

const AdminCategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ADD'); // 'ADD' or 'EDIT'
  const [currentCatId, setCurrentCatId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
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
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setErrorMsg('Unable to load data');
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

  // Filter categories by search query & status
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cat.slug && cat.slug.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'ACTIVE' && cat.isActive) ||
      (selectedStatus === 'INACTIVE' && !cat.isActive);

    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setModalMode('ADD');
    setCurrentCatId(null);
    setFormData({ name: '', description: '', isActive: true });
    setImageFile(null);
    setImagePreview('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setModalMode('EDIT');
    setCurrentCatId(cat._id || cat.id);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      isActive: cat.isActive !== undefined ? cat.isActive : true,
    });
    setImageFile(null);
    setImagePreview(cat.image ? getImageUrl(cat.image) : '');
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
        setFormErrors((prev) => ({ ...prev, image: 'Only JPEG, PNG, WEBP, and GIF images are allowed' }));
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
      errors.name = 'Category Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Category Name must be at least 2 characters';
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
      payload.append('description', formData.description.trim());
      payload.append('isActive', formData.isActive);

      if (imageFile) {
        payload.append('image', imageFile);
      }

      if (modalMode === 'ADD') {
        await categoryService.createCategory(payload);
        showAlert('success', 'Category saved successfully!');
      } else {
        await categoryService.updateCategory(currentCatId, payload);
        showAlert('success', 'Category updated successfully!');
      }

      setIsModalOpen(false);
      await loadCategories();
    } catch (err) {
      console.error('Submit category error:', err);
      showAlert('danger', err.message || 'Error processing category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setSubmitting(true);
    try {
      const targetId = deleteTarget._id || deleteTarget.id;
      await categoryService.deleteCategory(targetId);
      showAlert('success', `Category "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      await loadCategories();
    } catch (err) {
      console.error('Delete category error:', err);
      showAlert('danger', err.message || 'Failed to delete category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 pb-2 border-bottom">
        <div>
          <h3 className="fw-bold text-dark mb-1">Category Management</h3>
          <p className="text-muted mb-0 small">Manage product categories, slugs, and status</p>
        </div>
        <div className="mt-3 mt-sm-0">
          <button
            className="btn btn-primary fw-semibold d-flex align-items-center shadow-sm"
            onClick={handleOpenAddModal}
          >
            <i className="bi bi-plus-circle me-2 fs-6"></i> Add Category
          </button>
        </div>
      </div>

      {/* Global Alert / Toast */}
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
          <button className="btn btn-sm btn-outline-danger" onClick={loadCategories}>
            Retry
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
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
                  placeholder="Search categories by name, slug or description..."
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

            {/* Status Filter */}
            <div className="col-12 col-md-4 col-lg-3">
              <select
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Count Badge */}
            <div className="col-12 col-md-2 col-lg-2 text-md-end">
              <span className="badge bg-secondary py-2 px-3 fs-7">
                Total: {filteredCategories.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Table */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th scope="col" className="ps-4" style={{ width: '80px' }}>Image</th>
                  <th scope="col">Category Name</th>
                  <th scope="col">Slug</th>
                  <th scope="col">Description</th>
                  <th scope="col" className="text-center">Status</th>
                  <th scope="col" className="text-center">Products</th>
                  <th scope="col">Created Date</th>
                  <th scope="col" className="text-center pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading categories...</span>
                      </div>
                      <p className="mt-2 text-muted mb-0 fs-7">Loading categories...</p>
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      <i className="bi bi-folder-x fs-1 text-secondary d-block mb-2"></i>
                      <strong className="fs-6">No categories found</strong>
                      <p className="small mb-0">Try adding a new category or clearing filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat._id || cat.id}>
                      {/* Image Thumbnail */}
                      <td className="ps-4 py-3">
                        <img
                          src={cat.image ? getImageUrl(cat.image) : 'https://via.placeholder.com/54?text=No+Image'}
                          alt={cat.name}
                          className="rounded-3 border border-light object-fit-cover shadow-sm"
                          width="50"
                          height="50"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/50?text=No+Img';
                          }}
                        />
                      </td>

                      {/* Name */}
                      <td>
                        <div className="fw-bold text-dark fs-7">{cat.name}</div>
                      </td>

                      {/* Slug */}
                      <td>
                        <code className="bg-light text-primary px-2 py-1 rounded fs-8">{cat.slug || '-'}</code>
                      </td>

                      {/* Description */}
                      <td className="text-secondary fs-7 text-truncate" style={{ maxWidth: '220px' }}>
                        {cat.description || <span className="text-muted fst-italic">No description</span>}
                      </td>

                      {/* Status */}
                      <td className="text-center">
                        <span
                          className={`badge rounded-pill ${
                            cat.isActive
                              ? 'bg-success bg-opacity-10 text-success'
                              : 'bg-secondary bg-opacity-10 text-secondary'
                          } px-3 py-1.5`}
                        >
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Product Count from MongoDB */}
                      <td className="text-center fw-bold text-dark">{cat.productCount ?? 0}</td>

                      {/* Created Date from MongoDB */}
                      <td className="text-muted fs-8">
                        {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString('en-US') : '-'}
                      </td>

                      {/* Actions */}
                      <td className="text-center pe-4">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleOpenEditModal(cat)}
                            title="Edit Category"
                          >
                            <i className="bi bi-pencil-square"></i> Edit
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => setDeleteTarget(cat)}
                            title="Delete Category"
                          >
                            <i className="bi bi-trash"></i> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {modalMode === 'ADD' ? (
                    <>
                      <i className="bi bi-plus-circle me-2"></i> Add Category
                    </>
                  ) : (
                    <>
                      <i className="bi bi-pencil-square me-2"></i> Edit Category
                    </>
                  )}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close"
                ></button>
              </div>

              <form onSubmit={handleFormSubmit} noValidate>
                <div className="modal-body p-4">
                  {/* Category Name */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary">
                      Category Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                      placeholder="e.g. Electronics, Footwear"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Brief summary of category..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>

                  {/* Image Upload & Preview */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary">Category Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className={`form-control ${formErrors.image ? 'is-invalid' : ''}`}
                      onChange={handleFileChange}
                    />
                    {formErrors.image && <div className="invalid-feedback d-block">{formErrors.image}</div>}

                    {/* Image Preview Box */}
                    {imagePreview && (
                      <div className="mt-3 text-center p-2 bg-light border rounded">
                        <small className="text-muted d-block mb-1">Image Preview</small>
                        <img
                          src={imagePreview}
                          alt="Category Preview"
                          className="rounded object-fit-cover shadow-sm"
                          style={{ maxWidth: '120px', maxHeight: '120px' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary">Status</label>
                    <select
                      className="form-select"
                      value={formData.isActive ? 'Active' : 'Inactive'}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'Active' })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
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
                      'Save Category'
                    ) : (
                      'Update Category'
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
                  <i className="bi bi-exclamation-triangle-fill me-2"></i> Delete Category
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
                <small className="text-muted">This action will remove the category from MongoDB.</small>
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

export default AdminCategoryPage;
