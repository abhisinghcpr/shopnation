import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { categoryService } from '../../services/categoryService';
import { productService } from '../../services/productService';
import { getImageUrl } from '../../config/apiConfig';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import CustomerBannerSlider from '../../components/customer/CustomerBannerSlider';

const CustomerHomePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart, toggleWishlist, isInWishlist } = useCustomerAuth();
  const activeCategoryParam = searchParams.get('category') || '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const [fetchedCat, fetchedProd] = await Promise.all([
        categoryService.getCategories(),
        productService.getProducts(),
      ]);
      setCategories(fetchedCat.filter((c) => c.isActive !== false));
      setProducts(fetchedProd.filter((p) => p.isActive !== false));
    } catch (err) {
      console.error('Failed to load home page data:', err);
      setFetchError('Unable to load products. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/customer/products?category=${encodeURIComponent(categoryName)}`);
  };

  // Section 1: Best Deals (Highest Discount Value)
  const bestDeals = [...products]
    .filter((p) => p.discountValue > 0)
    .sort((a, b) => (b.discountValue || 0) - (a.discountValue || 0))
    .slice(0, 4);

  // Section 2: Recently Added Products
  const recentlyAdded = [...products]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  // Section 3: Featured Products
  const featuredProducts = products.slice(0, 8);

  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [actionId, setActionId] = useState(null);

  const showToast = (type, msg) => {
    setToastType(type);
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleAddToCart = async (prod, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const productId = prod._id || prod.id;
    setActionId(productId);
    try {
      await addToCart(productId, 1);
      showToast('success', `Added "${prod.name}" to cart!`);
    } catch (err) {
      if (err.code === 'UNAUTHENTICATED' || err.message?.includes('UNAUTHENTICATED')) {
        navigate('/customer/login', { state: { from: '/customer/home' } });
      } else {
        showToast('danger', err.message || 'Failed to add item to cart');
      }
    } finally {
      setActionId(null);
    }
  };

  const handleToggleWishlist = async (prod, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const productId = prod._id || prod.id;
    setActionId(productId);
    try {
      const res = await toggleWishlist(productId);
      showToast('success', res.message || 'Wishlist updated');
    } catch (err) {
      if (err.code === 'UNAUTHENTICATED' || err.message?.includes('UNAUTHENTICATED')) {
        navigate('/customer/login', { state: { from: '/customer/home' } });
      } else {
        showToast('danger', err.message || 'Failed to update wishlist');
      }
    } finally {
      setActionId(null);
    }
  };

  const renderProductCard = (prod) => {
    const productId = prod._id || prod.id;
    const categoryName = typeof prod.category === 'object' ? prod.category?.name : prod.category;
    const originalP = Number(prod.price) || 0;
    const finalP = prod.finalPrice !== undefined ? Number(prod.finalPrice) : originalP;
    const hasDiscount = prod.discountValue > 0;
    const isWishlisted = isInWishlist(productId);
    const isProcessing = actionId === productId;

    return (
      <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={productId}>
        <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden position-relative hover-shadow bg-white">
          {/* Wishlist Heart Button */}
          <button
            type="button"
            className="btn btn-light rounded-circle shadow-sm position-absolute top-0 end-0 m-2 p-1.5 z-2 d-flex align-items-center justify-content-center"
            style={{ width: '34px', height: '34px' }}
            onClick={(e) => handleToggleWishlist(prod, e)}
            disabled={isProcessing}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <i className={`bi ${isWishlisted ? 'bi-heart-fill text-danger' : 'bi-heart text-muted'} fs-6`}></i>
          </button>

          {/* Discount Tag */}
          {hasDiscount && (
            <span className="position-absolute top-0 start-0 m-2 badge bg-fk-green fs-9 fw-bold shadow-sm z-1">
              {prod.discountType === 'fixed' ? `₹${prod.discountValue} OFF` : `${prod.discountValue}% OFF`}
            </span>
          )}

          {/* Product Image */}
          <Link to={`/customer/products/${productId}`} className="text-decoration-none">
            <div className="bg-light text-center p-3">
              <img
                src={prod.image ? getImageUrl(prod.image) : 'https://via.placeholder.com/220?text=No+Image'}
                alt={prod.name}
                className="img-fluid object-fit-contain"
                style={{ height: '180px', width: '100%' }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/180?text=No+Img';
                }}
              />
            </div>
          </Link>

          <div className="card-body p-3 d-flex flex-column">
            {/* Category & Rating */}
            <div className="d-flex align-items-center justify-content-between mb-1">
              <small className="text-muted fs-8 text-truncate" style={{ maxWidth: '120px' }}>
                {categoryName || 'General'}
              </small>
              <div className="badge bg-success px-2 py-0.5 fs-9 d-flex align-items-center">
                <span>{(prod.rating || 0).toFixed(1)}</span>
                <i className="bi bi-star-fill ms-1 fs-9"></i>
              </div>
            </div>

            {/* Product Title */}
            <h6 className="fw-bold text-dark fs-7 mb-2 text-truncate">
              <Link to={`/customer/products/${productId}`} className="text-dark text-decoration-none">
                {prod.name}
              </Link>
            </h6>

            {/* Price & Discount */}
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
                className="btn btn-fk-blue text-white btn-sm fw-bold px-3 py-1 rounded-1"
                onClick={(e) => handleAddToCart(prod, e)}
                disabled={prod.quantity === 0 || isProcessing}
              >
                <i className="bi bi-cart-plus me-1"></i> Add
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-5">
      <div className="container">
        {/* API Error Alert */}
        {fetchError && !loading && (
          <div className="alert alert-danger d-flex align-items-center justify-content-between flex-wrap gap-3 shadow-sm mb-3" role="alert">
            <div>
              <i className="bi bi-wifi-off me-2"></i>
              <strong>Network Error:</strong> {fetchError}
            </div>
            <button className="btn btn-sm btn-outline-danger fw-semibold" onClick={fetchHomeData}>
              <i className="bi bi-arrow-clockwise me-2"></i>Retry
            </button>
          </div>
        )}

        {/* Toast Notification Alert */}
        {toastMsg && (
          <div className={`alert alert-${toastType} alert-dismissible fade show shadow-sm mb-3`} role="alert">
            <i className={`bi ${toastType === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'} me-2`}></i>
            {toastMsg}
          </div>
        )}

        {/* 1. Hero Banner Slider — appears FIRST */}
        <CustomerBannerSlider />

        {/* 2. Category Horizontal Strip — directly BELOW the banner */}
        <div className="home-category-strip mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="fw-bold text-dark fs-7">Shop by Category</span>
            <Link to="/customer/products" className="text-fk-blue fw-semibold fs-8 text-decoration-none">
              View All <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
          {loading ? (
            <div className="d-flex gap-3">
              {[1,2,3,4,5,6].map(n => (
                <div key={n} className="text-center flex-shrink-0">
                  <div className="skeleton-img rounded-circle mx-auto mb-1" style={{ width: '60px', height: '60px', borderRadius: '50% !important' }}></div>
                  <div className="skeleton-line short mx-auto"></div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-muted fs-8 py-2">No categories available</div>
          ) : (
            <div className="category-strip-scroll">
              {categories.map((cat) => {
                const isActive = activeCategoryParam === cat.name;
                return (
                  <div
                    key={cat._id || cat.id}
                    className={`category-circle-item${isActive ? ' active-cat' : ''}`}
                    onClick={() => handleCategoryClick(cat.name)}
                    title={cat.name}
                  >
                    <img
                      src={cat.image ? getImageUrl(cat.image) : 'https://via.placeholder.com/64?text=Category'}
                      alt={cat.name}
                      className="rounded-circle object-fit-cover shadow-sm mb-1 border border-2 border-light"
                      width="62"
                      height="62"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/62?text=Cat'; }}
                    />
                    <div className={`cat-label fw-semibold fs-8 text-truncate${isActive ? ' text-fk-blue' : ' text-dark'}`} style={{ maxWidth: '78px' }}>
                      {cat.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Top Deals / Big Discounts */}
        {bestDeals.length > 0 && (
          <section className="mb-5 bg-white p-4 rounded-3 shadow-sm border">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <div>
                <h4 className="fw-bold text-dark mb-0 d-flex align-items-center">
                  <i className="bi bi-lightning-charge-fill text-warning me-2 fs-3"></i> Top Deals & Big Discounts
                </h4>
                <small className="text-muted">Save extra on handpicked promotional products</small>
              </div>
              <Link to="/customer/products" className="btn btn-fk-blue text-white btn-sm fw-bold px-3">
                View All Deals
              </Link>
            </div>
            <div className="row g-3">{bestDeals.map(renderProductCard)}</div>
          </section>
        )}

        {/* 4. Featured Products Section */}
        <section className="mb-5 bg-white p-4 rounded-3 shadow-sm border">
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <div>
              <h4 className="fw-bold text-dark mb-0">Featured Products</h4>
              <small className="text-muted">Top quality items selected for you</small>
            </div>
            <Link to="/customer/products" className="text-fk-blue fw-bold text-decoration-none fs-7">
              Explore All <i className="bi bi-arrow-right"></i>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="alert alert-light text-center py-4 border">
              No products found in the catalog.
            </div>
          ) : (
            <div className="row g-3">{featuredProducts.map(renderProductCard)}</div>
          )}
        </section>

        {/* 5. Recently Added Products Section */}
        {recentlyAdded.length > 0 && (
          <section className="mb-4 bg-white p-4 rounded-3 shadow-sm border">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <div>
                <h4 className="fw-bold text-dark mb-0 d-flex align-items-center">
                  <i className="bi bi-stars text-primary me-2 fs-4"></i> New Arrivals
                </h4>
                <small className="text-muted">Freshly added inventory from sellers</small>
              </div>
              <Link to="/customer/products?sort=NEWEST" className="text-fk-blue fw-bold text-decoration-none fs-7">
                View All New <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
            <div className="row g-3">{recentlyAdded.map(renderProductCard)}</div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CustomerHomePage;
