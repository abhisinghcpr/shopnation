import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { getImageUrl } from '../../config/apiConfig';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

const CustomerProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCustomerAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionId, setActionId] = useState(null);

  // Filters — read initial values from URL search params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'ALL');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'DEFAULT');
  const [maxPrice, setMaxPrice] = useState(100000);

  const showToast = (setter, msg) => {
    setter(msg);
    setTimeout(() => setter(''), 3500);
  };

  const handleAddToCart = async (prod) => {
    const productId = prod._id || prod.id;
    setActionId(productId);
    setErrorMsg('');
    try {
      await addToCart(productId, 1);
      showToast(setSuccessMsg, `Added "${prod.name}" to cart!`);
    } catch (err) {
      if (err.code === 'UNAUTHENTICATED' || err.message?.includes('UNAUTHENTICATED')) {
        navigate('/customer/login', { state: { from: '/customer/products' } });
      } else {
        showToast(setErrorMsg, err.message || 'Failed to add item to cart');
      }
    } finally {
      setActionId(null);
    }
  };

  const handleToggleWishlist = async (prod) => {
    const productId = prod._id || prod.id;
    setActionId(productId);
    setErrorMsg('');
    try {
      const res = await toggleWishlist(productId);
      showToast(setSuccessMsg, res.message || 'Wishlist updated');
    } catch (err) {
      if (err.code === 'UNAUTHENTICATED' || err.message?.includes('UNAUTHENTICATED')) {
        navigate('/customer/login', { state: { from: '/customer/products' } });
      } else {
        showToast(setErrorMsg, err.message || 'Failed to update wishlist');
      }
    } finally {
      setActionId(null);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  // Sync filter state when URL params change (e.g. from Home category click)
  useEffect(() => {
    const cat = searchParams.get('category');
    const srch = searchParams.get('search');
    const sort = searchParams.get('sort');
    if (cat) setSelectedCategory(cat);
    else setSelectedCategory('ALL');
    if (srch) setSearchQuery(srch);
    if (sort) setSortBy(sort);
  }, [searchParams]);

  const fetchCatalogData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories(),
      ]);
      setProducts(fetchedProducts.filter((p) => p.isActive !== false));
      setCategories(fetchedCategories.filter((c) => c.isActive !== false));
    } catch (err) {
      console.error('Error loading product catalog:', err);
      setErrorMsg('Unable to load products. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Products
  const processedProducts = products
    .filter((prod) => {
      const categoryName = typeof prod.category === 'object' ? prod.category?.name : prod.category;
      const finalP = prod.finalPrice !== undefined ? Number(prod.finalPrice) : Number(prod.price);

      const matchesSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (categoryName && categoryName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'ALL' || categoryName === selectedCategory || prod.category?._id === selectedCategory;

      const matchesPrice = finalP <= maxPrice;

      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      const priceA = a.finalPrice !== undefined ? Number(a.finalPrice) : Number(a.price);
      const priceB = b.finalPrice !== undefined ? Number(b.finalPrice) : Number(b.price);

      if (sortBy === 'PRICE_LOW_HIGH') return priceA - priceB;
      if (sortBy === 'PRICE_HIGH_LOW') return priceB - priceA;
      if (sortBy === 'RATING') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'NEWEST') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  const handleCategorySelect = (catName) => {
    setSelectedCategory(catName);
    const newParams = new URLSearchParams(searchParams);
    if (catName === 'ALL') {
      newParams.delete('category');
    } else {
      newParams.set('category', catName);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb fs-8">
          <li className="breadcrumb-item"><Link to="/customer/home">Home</Link></li>
          <li className="breadcrumb-item active" aria-current="page">
            {selectedCategory !== 'ALL' ? selectedCategory : 'Shop Products'}
          </li>
        </ol>
      </nav>

      {/* Toast Alerts */}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
        </div>
      )}
      {errorMsg && !loading && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i> {errorMsg}
          <button type="button" className="btn-close" onClick={() => setErrorMsg('')}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Sidebar Filters */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card border-0 shadow-sm rounded-3 p-3 sticky-md-top" style={{ top: '100px' }}>
            <h5 className="fw-bold text-dark mb-3 pb-2 border-bottom">
              <i className="bi bi-funnel me-2 text-primary"></i> Filters
            </h5>

            {/* Category Filter */}
            <div className="mb-4">
              <label className="form-label fw-semibold text-secondary fs-7">Category</label>
              <div className="list-group list-group-flush fs-7">
                <button
                  type="button"
                  className={`list-group-item list-group-item-action border-0 px-2 rounded ${
                    selectedCategory === 'ALL' ? 'bg-primary text-white fw-bold' : 'text-dark'
                  }`}
                  onClick={() => handleCategorySelect('ALL')}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id || cat.id}
                    type="button"
                    className={`list-group-item list-group-item-action border-0 px-2 rounded ${
                      selectedCategory === cat.name ? 'bg-primary text-white fw-bold' : 'text-dark'
                    }`}
                    onClick={() => handleCategorySelect(cat.name)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter Slider */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label fw-semibold text-secondary fs-7 mb-0">Max Price</label>
                <span className="fw-bold text-primary fs-7">₹{maxPrice.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                className="form-range"
                min="100"
                max="100000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
            </div>

            <button
              className="btn btn-outline-secondary w-100 btn-sm fw-semibold"
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
                setMaxPrice(100000);
                setSortBy('DEFAULT');
                setSearchParams({});
              }}
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="col-12 col-md-8 col-lg-9">
          {/* Top Control Bar */}
          <div className="card border-0 shadow-sm rounded-3 mb-4 p-3">
            <div className="row g-3 align-items-center">
              {/* Search Bar */}
              <div className="col-12 col-sm-6 col-md-7">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Search product title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-outline-secondary border-start-0"
                      type="button"
                      onClick={() => setSearchQuery('')}
                      title="Clear search"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Sorting Select */}
              <div className="col-12 col-sm-6 col-md-5">
                <select
                  className="form-select fs-7"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="DEFAULT">Sort by: Default</option>
                  <option value="PRICE_LOW_HIGH">Price: Low to High</option>
                  <option value="PRICE_HIGH_LOW">Price: High to Low</option>
                  <option value="RATING">Highest Rating</option>
                  <option value="NEWEST">Newest Arrivals</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading products...</span>
              </div>
              <p className="mt-2 text-muted fs-7">Loading product catalog...</p>
            </div>
          ) : errorMsg ? (
            <div className="card border-0 shadow-sm p-5 text-center my-4">
              <i className="bi bi-wifi-off fs-1 text-danger d-block mb-3"></i>
              <h5 className="fw-bold text-dark">Unable to Load Products</h5>
              <p className="text-muted small mb-4">{errorMsg}</p>
              <button
                className="btn btn-primary fw-bold px-4 mx-auto"
                style={{ maxWidth: '200px' }}
                onClick={fetchCatalogData}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>Retry
              </button>
            </div>
          ) : processedProducts.length === 0 ? (
            <div className="card border-0 shadow-sm p-5 text-center my-4">
              <i className="bi bi-box-seam fs-1 text-secondary d-block mb-2"></i>
              <h5 className="fw-bold text-dark">No products found</h5>
              <p className="text-muted small">Try modifying your search criteria or resetting filters.</p>
              <button
                className="btn btn-outline-secondary btn-sm fw-semibold mt-2 mx-auto"
                style={{ maxWidth: '180px' }}
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                  setMaxPrice(100000);
                  setSortBy('DEFAULT');
                  setSearchParams({});
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {processedProducts.map((prod) => {
                const prodId = prod._id || prod.id;
                const categoryName = typeof prod.category === 'object' ? prod.category?.name : prod.category;
                const originalP = Number(prod.price) || 0;
                const finalP = prod.finalPrice !== undefined ? Number(prod.finalPrice) : originalP;
                const hasDiscount = prod.discountValue > 0;
                const inWishlist = isInWishlist(prodId);
                const isProcessing = actionId === prodId;

                return (
                  <div className="col-12 col-sm-6 col-lg-4" key={prodId}>
                    <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden position-relative hover-shadow transition-all">
                      {/* Discount Badge */}
                      {hasDiscount && (
                        <span className="position-absolute top-0 start-0 m-3 badge bg-danger fs-8 fw-bold shadow-sm z-1">
                          {prod.discountType === 'fixed' ? `₹${prod.discountValue} OFF` : `${prod.discountValue}% OFF`}
                        </span>
                      )}

                      {/* Wishlist Heart Button */}
                      <button
                        onClick={() => handleToggleWishlist(prod)}
                        disabled={isProcessing}
                        className="position-absolute top-0 end-0 m-3 btn btn-light rounded-circle shadow-sm z-1 border-0 d-flex align-items-center justify-content-center"
                        title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        style={{ width: '32px', height: '32px' }}
                      >
                        <i className={`bi ${inWishlist ? 'bi-heart-fill text-danger' : 'bi-heart text-secondary'}`}></i>
                      </button>

                      {/* Product Thumbnail */}
                      <Link to={`/customer/products/${prodId}`}>
                        <img
                          src={prod.image ? getImageUrl(prod.image) : 'https://via.placeholder.com/260?text=Product'}
                          alt={prod.name}
                          className="card-img-top object-fit-cover bg-light"
                          style={{ height: '220px' }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/260?text=No+Image';
                          }}
                        />
                      </Link>

                      <div className="card-body p-3 d-flex flex-column">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="badge bg-light text-primary border border-primary-subtle fs-8">
                            {categoryName || 'General'}
                          </span>
                          <span className="fs-9 text-muted">{prod.quantity > 0 ? 'In Stock' : 'Out of Stock'}</span>
                        </div>

                        <h6 className="fw-bold text-dark mt-2 mb-1 text-truncate">
                          <Link to={`/customer/products/${prodId}`} className="text-dark text-decoration-none">
                            {prod.name}
                          </Link>
                        </h6>

                        {/* Rating */}
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-star-fill text-warning fs-8 me-1"></i>
                          <span className="fw-bold fs-8 text-dark me-1">{(prod.rating || 0).toFixed(1)}</span>
                          <span className="text-muted fs-8">({prod.reviewCount || 0} reviews)</span>
                        </div>

                        {/* Pricing & Add to Cart */}
                        <div className="mt-auto pt-2 border-top d-flex align-items-center justify-content-between">
                          <div>
                            <span className="fw-bold text-dark fs-6">₹{finalP.toLocaleString('en-IN')}</span>
                            {hasDiscount && (
                              <span className="text-muted text-decoration-line-through fs-8 ms-2">
                                ₹{originalP.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>

                          <button
                            className="btn btn-outline-primary btn-sm fw-semibold"
                            onClick={() => handleAddToCart(prod)}
                            disabled={prod.quantity === 0 || isProcessing}
                          >
                            {isProcessing ? (
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                              <><i className="bi bi-cart-plus me-1"></i>Add</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerProductListPage;
