export function emblaListingSchemaEnhancer(schema, formData = {}, intl) {
  const useListing = formData?.useListing;
  const appendManualSlides = formData?.appendManualSlides;
  console.log('✅ enhancer called, useListing =', useListing, 'appendManualSlides =', appendManualSlides);

  // Make sure we have fieldsets
  if (!schema.fieldsets || !schema.fieldsets[0]) {
    console.warn('Schema missing fieldsets');
    return schema;
  }

  // Add useListing field if not already present
  if (!schema.fieldsets[0].fields.includes('useListing')) {
    schema.fieldsets[0].fields.push('useListing');
  }

  schema.properties.useListing = {
    title: 'Use listing source',
    type: 'boolean',
    default: false,
  };

  if (useListing) {
    // Add listing-specific fields
    const listingFields = ['query', 'appendManualSlides'];
    
    listingFields.forEach(field => {
      if (!schema.fieldsets[0].fields.includes(field)) {
        schema.fieldsets[0].fields.push(field);
      }
    });

    schema.properties.query = {
      title: 'Search criteria',
      widget: 'querystring',
    };

    schema.properties.appendManualSlides = {
      title: 'Append manual slides',
      description: 'Add manual slides after the listing results',
      type: 'boolean',
      default: false,
    };

    // Only show slides field if appendManualSlides is enabled
    if (appendManualSlides) {
      if (!schema.fieldsets[0].fields.includes('slides')) {
        schema.fieldsets[0].fields.push('slides');
      }
    } else {
      // Remove slides field when not appending manual slides
      schema.fieldsets[0].fields = schema.fieldsets[0].fields.filter(
        (field) => field !== 'slides'
      );
    }
  } else {
    // Remove listing fields when not using listing
    const listingFields = ['query', 'appendManualSlides'];
    schema.fieldsets[0].fields = schema.fieldsets[0].fields.filter(
      (field) => !listingFields.includes(field)
    );
    
    // Make sure slides field is present when not using listing
    if (!schema.fieldsets[0].fields.includes('slides')) {
      // Insert slides at the beginning of the fields array
      schema.fieldsets[0].fields.unshift('slides');
    }
  }

  return schema;
}