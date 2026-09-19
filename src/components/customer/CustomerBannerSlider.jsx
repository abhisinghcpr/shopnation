import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CustomerBannerSlider = () => {
  const navigate = useNavigate();

  const slides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80',
      title: 'Big Savings Days — Up to 50% Off',
      subtitle: 'Top deals on Electronics, Smartphones & Headphones',
      link: '/customer/products?category=Electronics',
      badge: 'Electronics Fest'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      title: 'Fashion Season Sale',
      subtitle: 'Trendy Apparel, Footwear & Accessories',
      link: '/customer/products?category=Fashion%20%26%20Apparel',
      badge: 'Fashion Trends'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&auto=format&fit=crop&q=80',
      title: 'Home & Kitchen Makeover',
      subtitle: 'Premium Cookware, Appliances & Decor',
      link: '/customer/products?category=Home%20%26%20Kitchen',
      badge: 'Home Essentials'
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto slide timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const goToPrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  const handleSlideClick = (link) => {
    navigate(link);
  };

  return (
    <div className="position-relative overflow-hidden rounded-3 shadow-sm mt-3 mb-4 bg-dark">
      {/* Slide Item */}
      <div
        className="cursor-pointer position-relative text-white"
        onClick={() => handleSlideClick(slides[currentIndex].link)}
      >
        <img
          src={slides[currentIndex].image}
          alt={slides[currentIndex].title}
          className="banner-slide-img"
        />
        <div
          className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center p-4 p-md-5"
          style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 65%, transparent 100%)' }}
        >
          <span className="badge bg-fk-yellow text-dark fw-bold text-uppercase px-3 py-1.5 fs-8 mb-2 align-self-start">
            {slides[currentIndex].badge}
          </span>
          <h2 className="display-6 fw-bold mb-2 text-white">{slides[currentIndex].title}</h2>
          <p className="lead fs-7 text-white-50 mb-3 d-none d-sm-block">{slides[currentIndex].subtitle}</p>
          <button className="btn btn-fk-orange text-white fw-bold px-4 py-2 rounded-2 align-self-start shadow-sm">
            Shop Now <i className="bi bi-arrow-right ms-1"></i>
          </button>
        </div>
      </div>

      {/* Previous Arrow */}
      <button
        type="button"
        className="position-absolute top-50 start-0 translate-middle-y btn btn-light rounded-circle shadow-lg m-2 border-0 p-2 d-flex align-items-center justify-content-center"
        style={{ width: '40px', height: '40px', zIndex: 10 }}
        onClick={goToPrev}
        aria-label="Previous Slide"
      >
        <i className="bi bi-chevron-left fs-5 text-dark"></i>
      </button>

      {/* Next Arrow */}
      <button
        type="button"
        className="position-absolute top-50 end-0 translate-middle-y btn btn-light rounded-circle shadow-lg m-2 border-0 p-2 d-flex align-items-center justify-content-center"
        style={{ width: '40px', height: '40px', zIndex: 10 }}
        onClick={goToNext}
        aria-label="Next Slide"
      >
        <i className="bi bi-chevron-right fs-5 text-dark"></i>
      </button>

      {/* Dots Indicator */}
      <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-2" style={{ zIndex: 10 }}>
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`rounded-circle border-0 transition-all ${
              index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
            }`}
            style={{ width: index === currentIndex ? '24px' : '10px', height: '10px', borderRadius: '5px' }}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(index);
            }}
            aria-label={`Go to slide ${index + 1}`}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default CustomerBannerSlider;
