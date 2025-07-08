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

import React, { useState, useEffect } from 'react';
import { SidebarPortal, BlockDataForm } from '@plone/volto/components';
import { useDispatch, useSelector } from 'react-redux';
import { searchContent } from '@plone/volto/actions';
import emblaCarouselSchema from './schema';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import './carousel-base.css';
import './carousel.css';

const getHref = (link) => {
  const item = Array.isArray(link) ? link[0] : link;
  if (!item || typeof item !== 'object') return '#';
  const url = item['@id'] || '';
  const isFile = item['@type'] === 'File';
  return url ? (isFile ? `${url}/@@download/file` : url) : '#';
};

const Edit = (props) => {
  const { data, block, onChangeBlock, selected } = props;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  
  const dispatch = useDispatch();
  const searchResults = useSelector((state) => state.search?.subrequests?.[block]);

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
        
        dispatch(searchContent('', searchOptions, block));
      } else if (typeof data.query === 'string') {
        dispatch(searchContent(data.query, searchOptions, block));
      } else {
        searchOptions.query = data.query;
        dispatch(searchContent('', searchOptions, block));
      }
    }
  }, [data.useListing, data.query, data.sortOn, data.sortOrder, data.limit, dispatch, block]);

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

  const plugins = data.autoplay ? [Autoplay({ delay: data.autoplayDelay || 4000 })] : [];
  const [emblaRef, embla] = useEmblaCarousel({
    ...config,
    align: 'start',
    loop: data.loop ?? true,
    slidesToScroll: effectiveSlidesToShow,
  }, plugins);

  useEffect(() => {
    if (!embla) return;
    setScrollSnaps(embla.scrollSnapList());
    embla.on('select', () => setSelectedIndex(embla.selectedScrollSnap()));
  }, [embla]);

  const scrollPrev = () => embla && embla.scrollPrev();
  const scrollNext = () => embla && embla.scrollNext();
  const scrollTo = (index) => embla && embla.scrollTo(index);

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

  const modeClass = data.mode ? `mode-${data.mode}` : '';
  const showArrows = data.hideArrows !== true && slides.length > 1;
  const showDots = data.hideDots !== true && slides.length > 0;
  const pageCount = Math.ceil(slides.length / effectiveSlidesToShow);

  // Generate the schema with proper props
  const schema = emblaCarouselSchema({
    ...props,
    formData: data,
  });

  const handleFieldChange = (id, value) => {
    if (id === 'slides') {
      const fixed = Array.isArray(value)
        ? value.map((slide) => ({
            ...slide,
            link: Array.isArray(slide.link)
              ? slide.link[0]
              : slide.link,
          }))
        : [];
      onChangeBlock(block, { ...data, slides: fixed });
    } else {
      onChangeBlock(block, { ...data, [id]: value });
    }
  };

  // Prepare form data for the sidebar
  const formData = {
    ...data,
    slides: Array.isArray(data.slides)
      ? data.slides.map((slide) => ({
          ...slide,
          link: Array.isArray(slide.link)
            ? slide.link
            : slide.link
            ? [slide.link]
            : [],
        }))
      : [],
  };

  return (
    <>
      <div className={`embla ${data.isFullWidth ? 'full-width' : ''} align-${data.alignment || 'left'} ${modeClass} type-${carouselType}`}>
        {showArrows && (
          <>
            <button className="embla__prev" onClick={scrollPrev}>‹</button>
            <button className="embla__next" onClick={scrollNext}>›</button>
          </>
        )}

        <div className="embla__viewport" ref={emblaRef}>
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
                className={`embla__dot ${i === selectedIndex ? 'is-selected' : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <SidebarPortal selected={selected}>
          <BlockDataForm
            key={`listing-${data.useListing ? 'on' : 'off'}`}
            schema={schema}
            title="Embla Carousel"
            onChangeField={handleFieldChange}
            onChangeBlock={onChangeBlock}
            block={block}
            formData={formData}
          />
        </SidebarPortal>
      )}
    </>
  );
};

export default Edit;