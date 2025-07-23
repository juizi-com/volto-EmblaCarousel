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

  // Function to get image for listing items based on content type
  const getListingImageUrl = (item) => {
    // If the item itself is an Image content type, use it directly
    if (item['@type'] === 'Image') {
      return `${item['@id']}/@@images/image`;
    }
    
    // Otherwise, look for associated images
    return getImageUrl(item);
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
    isFromListing: true, // Flag to identify listing slides
  });

  // Get slides: listing results first, then manual slides if appendManualSlides is enabled
  const getSlides = () => {
    let slides = [];
    
    // Add listing results first
    if (data.useListing && searchResults?.items && searchResults.items.length > 0) {
      slides = searchResults.items.map(convertItemToSlide);
    }
    
    // Add manual slides if not using listing OR if using listing with appendManualSlides enabled
    if (!data.useListing || (data.useListing && data.appendManualSlides)) {
      const manualSlides = (data.slides || []).map(slide => ({
        ...slide,
        isFromListing: false
      }));
      slides = slides.concat(manualSlides);
    }
    
    return slides;
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
      // Base metadata we always need
      const baseOptions = {
        metadata_fields: [
          'title', 
          'description', 
          'image_field',
          'image_scales',
          'effective',
          'remoteUrl'
        ],
      };

      let searchOptions;
      let searchTerm = '';

      // Handle different query formats
      if (typeof data.query === 'object' && data.query !== null) {
        // Check if this is a querystring widget format with query array
        if (data.query.query && Array.isArray(data.query.query)) {
          // Transform querystring format to what Plone search expects
          const transformedQuery = {};
          
          data.query.query.forEach(criterion => {
            if (criterion.i === 'portal_type') {
              transformedQuery.portal_type = criterion.v;
            } else if (criterion.i === 'path') {
              transformedQuery.path = criterion.v;
            } else if (criterion.i === 'Subject') {
              transformedQuery.Subject = criterion.v;
            } else if (criterion.i === 'review_state') {
              transformedQuery.review_state = criterion.v;
            }
            // Add more mappings as needed
          });
          
          // Add sorting and other options from the querystring widget
          if (data.query.sort_on) {
            transformedQuery.sort_on = data.query.sort_on;
          }
          if (data.query.sort_order) {
            transformedQuery.sort_order = data.query.sort_order;
          }
          
          // This is the key fix - use the limit from querystring widget
          if (data.query.limit) {
            transformedQuery.b_size = parseInt(data.query.limit, 10);
          }
          
          searchOptions = { ...transformedQuery, ...baseOptions };
        } else {
          // Use the query object as-is and merge with base options
          searchOptions = { ...data.query, ...baseOptions };
          
          // Also handle limit if it's in the direct query object
          if (data.query.limit) {
            searchOptions.b_size = parseInt(data.query.limit, 10);
          }
        }
      } else if (typeof data.query === 'string') {
        searchTerm = data.query;
        searchOptions = baseOptions;
      } else {
        searchOptions = { ...baseOptions, query: data.query };
      }
      
      dispatch(searchContent(searchTerm, searchOptions, id));
    }
  }, [data.useListing, data.query, dispatch, id]);

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

  const plugins = data.autoplay ? [Autoplay({ delay: parseInt(data.autoplayDelay, 10) || 4000, stopOnInteraction: false })] : [];
  const [viewportRef, embla] = useEmblaCarousel({
    ...config,
    loop: data.loop ?? true,
    align: 'start',
    slidesToScroll: effectiveSlidesToShow,
  }, plugins);

  const getHref = (link) => {
    const item = Array.isArray(link) ? link[0] : link;
    if (!item || typeof item !== 'object') return '#';
    
    // For Link content types, check if they have a remoteUrl (external link)
    if (item['@type'] === 'Link' && item.remoteUrl) {
      return item.remoteUrl;
    }
    
    const url = item['@id'] || '';
    const isFile = item['@type'] === 'File';
    return url ? (isFile ? `${url}/@@download/file` : url) : '#';
  };

  const renderLink = (slide) => {
    const href = getHref(slide.link);
    const label = slide.buttonText?.trim();
    if (!href || !label || data.hideButtons || data.displayMode === 'image-only') return null;

    const isExternal = href.startsWith('http') && !href.includes(window.location.hostname);

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
    
    const isExternal = href.startsWith('http') && !href.includes(window.location.hostname);
    
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

  const heightClass = data.equalHeight ? 'equal-height' : '';
  const modeClass = data.mode ? `mode-${data.mode}` : '';
  const showArrows = data.hideArrows !== true && slides.length > 1;
  const showDots = data.hideDots !== true && slides.length > 0;
  const pageCount = Math.ceil(slides.length / effectiveSlidesToShow);

  const isImageOnly = data.displayMode === 'image-only';

  return (
    <div className={`embla ${heightClass} ${data.isFullWidth ? 'full-width' : ''} align-${data.alignment || 'left'} ${modeClass} type-${carouselType}`}>
      {showArrows && slides.length > 1 && (
        <>
          <button className="embla__prev" onClick={scrollPrev}>‹</button>
          <button className="embla__next" onClick={scrollNext}>›</button>
        </>
      )}

      <div className="embla__viewport" ref={viewportRef}>
        <div className="embla__container">
          {slides.map((slide, index) => {
            // Handle image URL based on slide source
            const imageUrl = slide.isFromListing
              ? getListingImageUrl(slide.link) 
              : (() => {
                  const image = Array.isArray(slide.image) ? slide.image[0] : slide.image;
                  return image?.['@id'] ? `${image['@id']}/@@images/image` : image?.download || '';
                })();
            
            const href = getHref(slide.link);
            const isClickable = data.clickableSlides && href && href !== '#';
            
            return (
              <div className="embla__slide" key={index} style={{ flex: `0 0 ${100 / effectiveSlidesToShow}%` }}>
                <div
                  className={`carousel-slide-inner ${isClickable ? 'clickable' : ''} ${isImageOnly ? 'image-only' : ''} ${slide.isFromListing ? 'listing-slide' : 'manual-slide'}`}
                  style={{ 
                    backgroundImage: !isImageOnly && imageUrl ? `url(${imageUrl})` : 'none',
                    cursor: isClickable ? 'pointer' : 'default'
                  }}
                  onClick={() => handleSlideClick(slide)}
                >
                  {isImageOnly ? (
                    imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={slide.heading || 'Slide image'} 
                      />
                    ) : (
                      <div className="image-placeholder">
                        No image
                      </div>
                    )
                  ) : (
                    <>
                      <h3>{slide.heading}</h3>
                      {!data.hideDescription && <p>{slide.content}</p>}
                      {data.showEffectiveDate && slide.effectiveDate && (
                        <p className="effective-date">{formatEffectiveDate(slide.effectiveDate)}</p>
                      )}
                      {renderLink(slide)}
                    </>
                  )}
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