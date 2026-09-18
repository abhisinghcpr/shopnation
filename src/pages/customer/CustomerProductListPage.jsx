import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { getImageUrl } from '../../config/apiConfig';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

// ─── Skeleton Loading Card ───────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="col-6 col-sm-6 col-md-4 col-lg-3">
    <div className="skeleton-card p-0">
      <div className="skeleton-img"></div>
      <div className="p-3">
        <div className="skeleton-line short mb-2"></div>
        <div className="skeleton-line long mb-2"></div>
        <div className="skeleton-line medium"></div>
      </div>
    </div>
  </div>
);

// ─── Price Range Presets ─────────────────────────────────────────────────────
const PRICE_RANGES = [
  { label: 'Under ₹500',        min: 0,     max: 500   },
  { label: '₹500 – ₹1,000',     min: 500,   max: 1000  },
  { label: '₹1,000 – ₹5,000',   min: 1000,  max: 5000  },
  { label: '₹5,000 – ₹20,000',  min: 5000,  max: 20000 },
  { label: '₹20,000+',          min: 20000, max: Infinity },
];

const SORT_OPTIONS = [
  { value: 'DEFAULT',          label: 'Relevance'        },
  { value: 'PRICE_LOW_HIGH',   label: 'Price: Low → High' },
  { value: 'PRICE_HIGH_LOW',   label: 'Price: High → Low' },
  { value: 'RATING',           label: 'Highest Rating'   },
  { value: 'NEWEST',           label: 'Newest Arrivals'  },
];

// ─── Main Component ──────────────────────────────────────────────────────────
const CustomerProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCustomerAuth();

  // ── Server data ──
  const [allProducts, setAllProducts]   = useState([]);
  const [categories,  setCategories]    = useState([]);
  const [loading,     setLoading]       = useState(true);
  const [fetchError,  setFetchError]    = useState('');

  // ── UI feedback ──
  const [successMsg,  setSuccessMsg]    = useState('');
  const [errorMsg,    setErrorMsg]      = useState('');
  const [actionId,    setActionId]      = useState(null);

  // ── Mobile filter/sort drawer state ──
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // ─── Filter state (all read from URL on mount) ───────────────────────────
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'ALL');
  const [searchQuery,      setSearchQuery]       = useState(searchParams.get('search')   || '');
  const [sortBy,           setSortBy]            = useState(searchParams.get('sort')     || 'DEFAULT');
  const [priceRangeIdx,    setPriceRangeIdx]     = useState(-1);          // -1 = any price
  const [minRating,        setMinRating]         = useState(0);           // 0 = any rating
  const [minDiscount,      setMinDiscount]       = useState(0);           // 0 = no filter
  const [inStockOnly,      setInStockOnly]       = useState(false);

  // ─── Sync URL → filter state on URL change (e.g. browser back) ──────────
  useEffect(() => {
    const cat  = searchParams.get('category');
    const srch = searchParams.get('search');
    const sort = searchParams.get('sort');
    setSelectedCategory(cat  || 'ALL');
    setSearchQuery(srch || '');
    setSortBy(sort || 'DEFAULT');
  }, [searchParams]);

  // ─── Fetch catalog on mount (once) ──────────────────────────────────────
  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const [prods, cats] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories(),
      ]);
      setAllProducts(prods.filter(p => p.isActive !== false));
      setCategories(cats.filter(c => c.isActive !== false));
    } catch (err) {
      console.error('Failed to load product catalog:', err);
      setFetchError('Unable to load products. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Update URL when filters change ─────────────────────────────────────
  const updateUrl = useCallback((updates) => {
    const p = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v && v !== 'ALL' && v !== 'DEFAULT' && v !== '') {
        p.set(k, v);
      } else {
        p.delete(k);
      }
    });
    setSearchParams(p, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleCategorySelect = (catName) => {
    setSelectedCategory(catName);
    updateUrl({ category: catName === 'ALL' ? '' : catName });
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    updateUrl({ search: val });
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    updateUrl({ sort: val });
  };

  // ─── Active filter count (for badge) ────────────────────────────────────
  const activeFilterCount = [
    selectedCategory !== 'ALL',
    priceRangeIdx >= 0,
    minRating > 0,
    minDiscount > 0,
    inStockOnly,
  ].filter(Boolean).length;

  // ─── Client-side filter + sort (memoized — no re-fetch) ─────────────────
  const processedProducts = useMemo(() => {
    let result = allProducts.filter(prod => {
      const catName = typeof prod.category === 'object' ? prod.category?.name : prod.category;
      const finalP  = prod.finalPrice !== undefined ? Number(prod.finalPrice) : Number(prod.price) || 0;
      const origP   = Number(prod.price) || 0;
      const discPct = origP > 0 ? Math.round(((origP - finalP) / origP) * 100) : (prod.discountValue || 0);

      // Category
      const matchesCat = selectedCategory === 'ALL' ||
        catName === selectedCategory ||
        prod.category?._id === selectedCategory;

      // Search
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        prod.name.toLowerCase().includes(q) ||
        (catName && catName.toLowerCase().includes(q)) ||
        (prod.description && prod.description.toLowerCase().includes(q));

      // Price range
      let matchesPrice = true;
      if (priceRangeIdx >= 0) {
        const range = PRICE_RANGES[priceRangeIdx];
        matchesPrice = finalP >= range.min && finalP < (range.max === Infinity ? 999999999 : range.max + 1);
      }

      // Rating
      const matchesRating = minRating === 0 || (prod.rating || 0) >= minRating;

      // Discount
      const matchesDiscount = minDiscount === 0 || discPct >= minDiscount;

      // Availability
      const matchesStock = !inStockOnly || (prod.quantity || 0) > 0;

      return matchesCat && matchesSearch && matchesPrice && matchesRating && matchesDiscount && matchesStock;
    });

    // Sort
    result = [...result].sort((a, b) => {
      const fpA = a.finalPrice !== undefined ? Number(a.finalPrice) : Number(a.price) || 0;
      const fpB = b.finalPrice !== undefined ? Number(b.finalPrice) : Number(b.price) || 0;
      if (sortBy === 'PRICE_LOW_HIGH')  return fpA - fpB;
      if (sortBy === 'PRICE_HIGH_LOW')  return fpB - fpA;
      if (sortBy === 'RATING')          return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'NEWEST')          return new Date(b.createdAt) - new Date(a.createdAt);
      return 0; // DEFAULT / Relevance
    });

    return result;
  }, [allProducts, selectedCategory, searchQuery, priceRangeIdx, minRating, minDiscount, inStockOnly, sortBy]);

  // ─── Toast helpers ───────────────────────────────────────────────────────
  const showToast = (setter, msg) => {
    setter(msg);
    setTimeout(() => setter(''), 3500);
  };

  // ─── Cart / Wishlist handlers ────────────────────────────────────────────
  const handleAddToCart = async (prod, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const productId = prod._id || prod.id;
    setActionId(`cart_${productId}`);
    try {
      await addToCart(productId, 1);
      showToast(setSuccessMsg, `"${prod.name}" added to cart!`);
    } catch (err) {
      if (err.code === 'UNAUTHENTICATED' || err.message?.includes('UNAUTHENTICATED')) {
        navigate('/customer/login', { state: { from: '/customer/products' } });
      } else {
        showToast(setErrorMsg, err.message || 'Failed to add to cart');
      }
    } finally {
      setActionId(null);
    }
  };

  const handleToggleWishlist = async (prod, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const productId = prod._id || prod.id;
    setActionId(`wish_${productId}`);
    try {
      await toggleWishlist(productId);
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

  // ─── Reset all filters ───────────────────────────────────────────────────
  const resetFilters = () => {
    setSelectedCategory('ALL');
    setPriceRangeIdx(-1);
    setMinRating(0);
    setMinDiscount(0);
    setInStockOnly(false);
    setSearchQuery('');
    setSortBy('DEFAULT');
    setSearchParams({}, { replace: true });
  };

  // ─── Filter panel JSX (reused in both sidebar and mobile drawer) ─────────
  const FilterPanel = () => (
    <div>
      {/* CATEGORY */}
      <div className="mb-4">
        <div className="filter-section-title">Category</div>
        <label className="filter-option">
          <input type="radio" name="cat" checked={selectedCategory === 'ALL'}
            onChange={() => handleCategorySelect('ALL')} />
          All Categories
        </label>
        {categories.map(cat => (
          <label key={cat._id} className="filter-option">
            <input type="radio" name="cat"
              checked={selectedCategory === cat.name}
              onChange={() => handleCategorySelect(cat.name)} />
            {cat.name}
          </label>
        ))}
      </div>

      {/* PRICE */}
      <div className="mb-4">
        <div className="filter-section-title">Price</div>
        <label className="filter-option">
          <input type="radio" name="price" checked={priceRangeIdx === -1}
            onChange={() => setPriceRangeIdx(-1)} />
          Any Price
        </label>
        {PRICE_RANGES.map((range, idx) => (
          <label key={idx} className="filter-option">
            <input type="radio" name="price" checked={priceRangeIdx === idx}
              onChange={() => setPriceRangeIdx(idx)} />
            {range.label}
          </label>
        ))}
      </div>

      {/* RATING */}
      <div className="mb-4">
        <div className="filter-section-title">Rating</div>
        {[4, 3, 2].map(r => (
          <label key={r} className="filter-option">
            <input type="radio" name="rating" checked={minRating === r}
              onChange={() => setMinRating(minRating === r ? 0 : r)} />
            {r}★ &amp; above
          </label>
        ))}
        <label className="filter-option">
          <input type="radio" name="rating" checked={minRating === 0}
            onChange={() => setMinRating(0)} />
          Any Rating
        </label>
      </div>

      {/* DISCOUNT */}
      <div className="mb-4">
        <div className="filter-section-title">Discount</div>
        {[10, 20, 30, 50].map(d => (
          <label key={d} className="filter-option">
            <input type="checkbox"
              checked={minDiscount === d}
              onChange={() => setMinDiscount(minDiscount === d ? 0 : d)} />
            {d}% or more
          </label>
        ))}
      </div>

      {/* AVAILABILITY */}
      <div className="mb-4">
        <div className="filter-section-title">Availability</div>
        <label className="filter-option">
          <input type="checkbox" checked={inStockOnly}
            onChange={e => setInStockOnly(e.target.checked)} />
          In Stock only
        </label>
      </div>

      {activeFilterCount > 0 && (
        <button className="btn btn-outline-secondary btn-sm w-100 fw-semibold" onClick={resetFilters}>
          <i className="bi bi-x-circle me-1"></i> Reset Filters
        </button>
      )}
    </div>
  );

  // ─── Product card ────────────────────────────────────────────────────────
  const renderProductCard = (prod) => {
    const productId  = prod._id || prod.id;
    const catName    = typeof prod.category === 'object' ? prod.category?.name : prod.category;
    const origP      = Number(prod.price) || 0;
    const finalP     = prod.finalPrice !== undefined ? Number(prod.finalPrice) : origP;
    const hasDiscount = prod.discountValue > 0;
    const discLabel  = hasDiscount
      ? (prod.discountType === 'fixed' ? `₹${prod.discountValue} OFF` : `${prod.discountValue}% OFF`)
      : null;
    const inWishlist   = isInWishlist(productId);
    const cartBusy     = actionId === `cart_${productId}`;
    const wishlistBusy = actionId === `wish_${productId}`;

    return (
      <div className="col-6 col-sm-6 col-md-4 col-xl-3" key={productId}>
        <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden position-relative product-card-hover bg-white">

          {/* Discount badge */}
          {hasDiscount && (
            <span className="position-absolute top-0 start-0 m-2 badge bg-danger fs-9 fw-bold shadow-sm" style={{ zIndex: 2 }}>
              {discLabel}
            </span>
          )}

          {/* Wishlist button */}
          <button
            type="button"
            className="btn btn-light rounded-circle shadow-sm position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center border-0"
            style={{ width: '32px', height: '32px', zIndex: 2 }}
            onClick={(e) => handleToggleWishlist(prod, e)}
            disabled={wishlistBusy}
            title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            {wishlistBusy
              ? <span className="spinner-border spinner-border-sm text-danger" role="status"></span>
              : <i className={`bi ${inWishlist ? 'bi-heart-fill text-danger' : 'bi-heart text-muted'}`}></i>
            }
          </button>

          {/* Product image */}
          <Link to={`/customer/products/${productId}`} className="text-decoration-none">
            <div className="bg-light text-center" style={{ height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
              <img
                src={prod.image ? getImageUrl(prod.image) : 'https://via.placeholder.com/220?text=No+Image'}
                alt={prod.name}
                className="img-fluid object-fit-contain"
                style={{ maxHeight: '166px', maxWidth: '100%' }}
                onError={e => { e.target.src = 'https://via.placeholder.com/180?text=No+Img'; }}
              />
            </div>
          </Link>

          {/* Card body */}
          <div className="card-body p-3 d-flex flex-column">
            {/* Category & Rating row */}
            <div className="d-flex align-items-center justify-content-between mb-1">
              <small className="text-muted fs-9 text-truncate" style={{ maxWidth: '110px' }}>
                {catName || 'General'}
              </small>
              <span className="badge bg-success fs-9 px-1.5 py-0.5 d-flex align-items-center gap-1">
                <span>{(prod.rating || 0).toFixed(1)}</span>
                <i className="bi bi-star-fill" style={{ fontSize: '9px' }}></i>
              </span>
            </div>

            {/* Title */}
            <h6 className="fw-bold text-dark fs-8 mb-2 text-truncate">
              <Link to={`/customer/products/${productId}`} className="text-dark text-decoration-none">
                {prod.name}
              </Link>
            </h6>

            {/* Price + Add to Cart */}
            <div className="mt-auto pt-2 border-top d-flex align-items-center justify-content-between">
              <div>
                <span className="fw-bold text-dark fs-6">₹{finalP.toLocaleString('en-IN')}</span>
                {hasDiscount && (
                  <span className="text-muted text-decoration-line-through fs-9 ms-1">
                    ₹{origP.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <button
                className="btn btn-fk-blue text-white btn-sm fw-bold px-2 rounded-1 d-flex align-items-center gap-1"
                onClick={(e) => handleAddToCart(prod, e)}
                disabled={prod.quantity === 0 || cartBusy}
                style={{ fontSize: '0.75rem' }}
              >
                {cartBusy
                  ? <span className="spinner-border spinner-border-sm" role="status"></span>
                  : <><i className="bi bi-cart-plus"></i> Add</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Applied filter tags ─────────────────────────────────────────────────
  const FilterTags = () => (
    <div className="d-flex flex-wrap gap-2 mb-3">
      {selectedCategory !== 'ALL' && (
        <span className="filter-tag" onClick={() => handleCategorySelect('ALL')}>
          {selectedCategory} <span className="close-x">×</span>
        </span>
      )}
      {priceRangeIdx >= 0 && (
        <span className="filter-tag" onClick={() => setPriceRangeIdx(-1)}>
          {PRICE_RANGES[priceRangeIdx].label} <span className="close-x">×</span>
        </span>
      )}
      {minRating > 0 && (
        <span className="filter-tag" onClick={() => setMinRating(0)}>
          {minRating}★ &amp; above <span className="close-x">×</span>
        </span>
      )}
      {minDiscount > 0 && (
        <span className="filter-tag" onClick={() => setMinDiscount(0)}>
          {minDiscount}%+ Off <span className="close-x">×</span>
        </span>
      )}
      {inStockOnly && (
        <span className="filter-tag" onClick={() => setInStockOnly(false)}>
          In Stock <span className="close-x">×</span>
        </span>
      )}
      {activeFilterCount > 0 && (
        <button className="btn btn-link text-danger fw-semibold p-0 fs-8 text-decoration-none" onClick={resetFilters}>
          Clear All
        </button>
      )}
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid px-3 px-md-4 py-3">

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb fs-8 mb-0">
          <li className="breadcrumb-item"><Link to="/customer/home">Home</Link></li>
          <li className="breadcrumb-item active" aria-current="page">
            {selectedCategory !== 'ALL' ? selectedCategory : 'All Products'}
          </li>
        </ol>
      </nav>

      {/* Toast Alerts */}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm py-2 px-3 mb-3 fs-8" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>{successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm py-2 px-3 mb-3 fs-8" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i>{errorMsg}
          <button type="button" className="btn-close" onClick={() => setErrorMsg('')}></button>
        </div>
      )}

      {/* ── Mobile: top bar with search + filter + sort ── */}
      <div className="d-lg-none mb-3">
        {/* Search bar */}
        <div className="input-group mb-2 shadow-sm">
          <span className="input-group-text bg-white border-end-0 text-muted">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0 ps-0 fs-7"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className="btn btn-outline-secondary border-start-0" type="button"
              onClick={() => handleSearchChange('')}>
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>

        {/* Filter + Sort row */}
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-semibold fs-8"
            onClick={() => setShowFilterDrawer(true)}
          >
            <i className="bi bi-sliders"></i>
            Filters
            {activeFilterCount > 0 && (
              <span className="active-filter-badge">{activeFilterCount}</span>
            )}
          </button>

          <select
            className="form-select sort-select-mobile flex-grow-1"
            value={sortBy}
            onChange={e => handleSortChange(e.target.value)}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Layout: sidebar + product grid ── */}
      <div className="row g-3">

        {/* ── LEFT: Filter Sidebar (Desktop only) ── */}
        <div className="col-lg-2 d-none d-lg-block">
          <div className="card border-0 shadow-sm rounded-3 p-3 filter-sidebar">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="fw-bold text-dark fs-7 d-flex align-items-center gap-2">
                <i className="bi bi-sliders text-primary"></i> Filters
                {activeFilterCount > 0 && (
                  <span className="active-filter-badge">{activeFilterCount}</span>
                )}
              </span>
              {activeFilterCount > 0 && (
                <button className="btn btn-link text-primary p-0 fs-8 text-decoration-none fw-semibold" onClick={resetFilters}>
                  Reset
                </button>
              )}
            </div>
            <FilterPanel />
          </div>
        </div>

        {/* ── RIGHT: Product Grid ── */}
        <div className="col-12 col-lg-10">

          {/* Desktop top controls: search + sort */}
          <div className="card border-0 shadow-sm rounded-3 p-3 mb-3 d-none d-lg-block">
            <div className="row g-2 align-items-center">
              <div className="col-8">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-search"></i></span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0 fs-7"
                    placeholder="Search for products, brands and more..."
                    value={searchQuery}
                    onChange={e => handleSearchChange(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="btn btn-outline-secondary border-start-0" type="button"
                      onClick={() => handleSearchChange('')}>
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="col-4">
                <select
                  className="form-select fs-7"
                  value={sortBy}
                  onChange={e => handleSortChange(e.target.value)}
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Result count + applied filter tags */}
          {!loading && (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
              <span className="fs-8 text-muted fw-semibold">
                {processedProducts.length} product{processedProducts.length !== 1 ? 's' : ''} found
              </span>
              <FilterTags />
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {loading ? (
            <div className="row g-3">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>

          /* ── Fetch error ── */
          ) : fetchError ? (
            <div className="card border-0 shadow-sm p-5 text-center">
              <div className="empty-state-icon mb-3">
                <i className="bi bi-wifi-off fs-1 text-danger"></i>
              </div>
              <h5 className="fw-bold">Unable to Load Products</h5>
              <p className="text-muted fs-7 mb-4">{fetchError}</p>
              <button className="btn btn-primary fw-bold px-4 mx-auto" style={{ maxWidth: '200px' }} onClick={fetchCatalog}>
                <i className="bi bi-arrow-clockwise me-2"></i>Retry
              </button>
            </div>

          /* ── No results ── */
          ) : processedProducts.length === 0 ? (
            <div className="card border-0 shadow-sm p-5 text-center">
              <div className="empty-state-icon mb-3">
                <i className="bi bi-search fs-1 text-secondary"></i>
              </div>
              <h5 className="fw-bold text-dark">No Products Found</h5>
              <p className="text-muted fs-7 mb-4">
                {activeFilterCount > 0 || searchQuery
                  ? 'Try adjusting your filters or search query.'
                  : 'No products are available in this category yet.'}
              </p>
              {(activeFilterCount > 0 || searchQuery) && (
                <button className="btn btn-outline-secondary fw-semibold mx-auto" style={{ maxWidth: '200px' }} onClick={resetFilters}>
                  <i className="bi bi-x-circle me-2"></i>Clear All Filters
                </button>
              )}
            </div>

          /* ── Product grid ── */
          ) : (
            <div className="row g-3">
              {processedProducts.map(renderProductCard)}
            </div>
          )}
        </div>
      </div>

      {/* ════ Mobile Filter Offcanvas Drawer ════ */}
      {showFilterDrawer && (
        <>
          {/* Backdrop */}
          <div
            className="offcanvas-backdrop fade show"
            onClick={() => setShowFilterDrawer(false)}
          ></div>

          {/* Drawer */}
          <div
            className="offcanvas offcanvas-filter offcanvas-start show"
            style={{ visibility: 'visible', width: '300px' }}
          >
            <div className="offcanvas-header">
              <h6 className="offcanvas-title fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-sliders"></i> Filters
                {activeFilterCount > 0 && <span className="active-filter-badge">{activeFilterCount}</span>}
              </h6>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowFilterDrawer(false)}></button>
            </div>
            <div className="offcanvas-body p-3">
              <FilterPanel />
            </div>
            <div className="p-3 border-top bg-light">
              <button
                className="btn btn-fk-blue text-white fw-bold w-100"
                onClick={() => setShowFilterDrawer(false)}
              >
                Show {processedProducts.length} Result{processedProducts.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerProductListPage;
