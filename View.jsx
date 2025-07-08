const getPresetConfig = (preset) => {
  switch (preset) {
    case 'loop':
      return { loop: true };
    case 'scroll':
      return { slidesToScroll: 1 };
    case 'contain':
      return { containScroll: 'trimSnaps' };
    case 'dragFree':
      return { dragFree: true };
    case 'snaps':
      return { skipSnaps: false };
    default:
      return {};
  }
};

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { searchContent } from '@plone/volto/actions';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import './carousel-base.css';
import './carousel.css';

const EmblaCarousel = ({ data, id }) => {
  const dispatch = useDispatch();
  const searchResults = useSelector((state) => state.search?.subrequests?.[id]);

  // Function to get the best image for background from Plone search results
  const getImageUrl = (item) => {
    // Check if the item has image_scales and image_field
    if (item.image_scales && item.image_field) {
      // Construct the image URL based on Plone's structure
      return `${item['@id']}/@@images/${item.image_field}`;
    }
    
    // Fallback for manual slides
    if (item.preview_image) {
      return `${item.preview_image['@id']}/@@images/image`;
    }
    if (item.lead_image) {
      return `${item.lead_image['@id']}/@@images/image`;
    }
    if (item.image) {
      const image = Array.isArray(item.image) ? item.image[0] : item.image;
      return image?.['@id'] ? `${image['@id']}/@@images/image` : image?.download || '';
    }
    
    return '';
  };

  // Function to format effective date
  const formatEffectiveDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Function to convert listing items to slide format
  const convertItemToSlide = (item) => ({
    heading: item.title || '',
    content: item.description || '',
    image: null, // We'll handle images differently for listing vs manual
    link: item,
    buttonText: data.listingButtonText || 'Read more',
    effectiveDate: item.effective || null,
  });

  // Get slides based on listing mode or manual slides
  const getSlides = () => {
    if (data.useListing && searchResults?.items && searchResults.items.length > 0) {
      return searchResults.items.map(convertItemToSlide);
    }
    return data.slides || [];
  };

  const slides = getSlides();
  const slidesToShow = parseInt(data.slidesToShow, 10) || 1;
  const [effectiveSlidesToShow, setEffectiveSlidesToShow] = useState(() => {
    const isMobileInit = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    return isMobileInit ? 1 : slidesToShow;
  });

  useEffect(() => {
    const calculateSlidesToShow = () => {
      const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
      setEffectiveSlidesToShow(isMobile ? 1 : slidesToShow);
    };
    calculateSlidesToShow();
    window.addEventListener('resize', calculateSlidesToShow);
    return () => window.removeEventListener('resize', calculateSlidesToShow);
  }, [slidesToShow]);

  // Effect to fetch listing data when using listing mode
  useEffect(() => {
    if (data.useListing && data.query) {
      const searchOptions = {
        sort_on: data.sortOn || 'sortable_title',
        sort_order: data.sortOrder || 'ascending',
        metadata_fields: [
          'title', 
          'description', 
          'image_field',
          'image_scales',
          'effective'
        ],
      };

      if (data.limit) {
        searchOptions.b_size = data.limit;
      }

      // Handle different query formats
      if (typeof data.query === 'object' && data.query !== null) {
        const { query, ...otherParams } = data.query;
        Object.assign(searchOptions, otherParams);
        
        if (query && Array.isArray(query)) {
          searchOptions.query = query;
        }
        
        dispatch(searchContent('', searchOptions, id));
      } else if (typeof data.query === 'string') {
        dispatch(searchContent(data.query, searchOptions, id));
      } else {
        searchOptions.query = data.query;
        dispatch(searchContent('', searchOptions, id));
      }
    }
  }, [data.useListing, data.query, data.sortOn, data.sortOrder, data.limit, dispatch, id]);

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
  
  const carouselType = data.carouselType || 'default';

  const configOverrides = {
    default: { align: 'start', loop: data.loop ?? true },
    centered: { align: 'center', loop: true },
    peek: { align: 'start', loop: true },
    cards: { align: 'start', loop: false, containScroll: 'trimSnaps' },
  };

  const presetConfig = getPresetConfig(data.preset);
  const baseConfig = configOverrides[carouselType] || configOverrides.default;
  const config = { ...baseConfig, ...presetConfig };

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const plugins = data.autoplay ? [Autoplay({ delay: data.autoplayDelay || 4000 })] : [];
  const [viewportRef, embla] = useEmblaCarousel({
    ...config,
    loop: data.loop ?? true,
    align: 'start',
    slidesToScroll: effectiveSlidesToShow,
  }, plugins);

  const getHref = (link) => {
    const item = Array.isArray(link) ? link[0] : link;
    if (!item || typeof item !== 'object') return '#';
    const url = item['@id'] || '';
    const isFile = item['@type'] === 'File';
    return url ? (isFile ? `${url}/@@download/file` : url) : '#';
  };

  const renderLink = (slide) => {
    const href = getHref(slide.link);
    const label = slide.buttonText?.trim();
    if (!href || !label || data.hideButtons) return null;

    const isExternal = href.startsWith('http');

    return (
      <a
        href={href}
        className="carousel-button"
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {label}
      </a>
    );
  };

  const handleSlideClick = (slide) => {
    if (!data.clickableSlides) return;
    
    const href = getHref(slide.link);
    if (!href || href === '#') return;
    
    const isExternal = href.startsWith('http');
    
    if (isExternal) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = href;
    }
  };

  useEffect(() => {
    if (!embla) return;
    setScrollSnaps(embla.scrollSnapList());
    embla.on('select', () => setSelectedIndex(embla.selectedScrollSnap()));
  }, [embla]);

  const scrollPrev = () => embla && embla.scrollPrev();
  const scrollNext = () => embla && embla.scrollNext();
  const scrollTo = (index) => embla && embla.scrollTo(index);

  const modeClass = data.mode ? `mode-${data.mode}` : '';
  const showArrows = data.hideArrows !== true && slides.length > 1;
  const showDots = data.hideDots !== true && slides.length > 0;
  const pageCount = Math.ceil(slides.length / effectiveSlidesToShow);

  return (
    <div className={`embla ${data.isFullWidth ? 'full-width' : ''} align-${data.alignment || 'left'} ${modeClass} type-${carouselType}`}>
      {showArrows && slides.length > 1 && (
        <>
          <button className="embla__prev" onClick={scrollPrev}>‹</button>
          <button className="embla__next" onClick={scrollNext}>›</button>
        </>
      )}

      <div className="embla__viewport" ref={viewportRef}>
        <div className="embla__container">
          {slides.map((slide, index) => {
            const imageUrl = (data.useListing && searchResults?.items && searchResults.items.length > 0) 
              ? getImageUrl(slide.link) 
              : (() => {
                  const image = Array.isArray(slide.image) ? slide.image[0] : slide.image;
                  return image?.['@id'] ? `${image['@id']}/@@images/image` : image?.download || '';
                })();
            
            const href = getHref(slide.link);
            const isClickable = data.clickableSlides && href && href !== '#';
            
            return (
              <div className="embla__slide" key={index} style={{ flex: `0 0 ${100 / effectiveSlidesToShow}%` }}>
                <div
                  className={`carousel-slide-inner ${isClickable ? 'clickable' : ''}`}
                  style={{ 
                    backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                    cursor: isClickable ? 'pointer' : 'default'
                  }}
                  onClick={() => handleSlideClick(slide)}
                >
                  <h3>{slide.heading}</h3>
                  <p>{slide.content}</p>
                  {data.showEffectiveDate && slide.effectiveDate && (
                    <p className="effective-date">{formatEffectiveDate(slide.effectiveDate)}</p>
                  )}
                  {renderLink(slide)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showDots && pageCount > 1 && (
        <div className="embla__nav">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`embla__dot ${selectedIndex === i ? 'is-selected' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EmblaCarousel;