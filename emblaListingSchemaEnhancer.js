export function emblaListingSchemaEnhancer(schema, formData = {}, intl) {
  const useListing = formData?.useListing;
  console.log('✅ enhancer called, useListing =', useListing);

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

  // Add showEffectiveDate field if not already present
  if (!schema.fieldsets[0].fields.includes('showEffectiveDate')) {
    schema.fieldsets[0].fields.push('showEffectiveDate');
  }

  schema.properties.showEffectiveDate = {
    title: 'Show effective date',
    type: 'boolean',
    default: false,
  };

  if (useListing) {
    // Add listing-specific fields
    const listingFields = ['query', 'sortOn', 'sortOrder', 'limit'];
    listingFields.forEach(field => {
      if (!schema.fieldsets[0].fields.includes(field)) {
        schema.fieldsets[0].fields.push(field);
      }
    });

    schema.properties.query = {
      title: 'Query',
      widget: 'querystring',
    };
    schema.properties.sortOn = {
      title: 'Sort on',
      type: 'string',
      default: 'sortable_title',
    };
    schema.properties.sortOrder = {
      title: 'Sort order',
      type: 'string',
      choices: [
        ['ascending', 'Ascending'],
        ['descending', 'Descending'],
      ],
      default: 'ascending',
    };
    schema.properties.limit = {
      title: 'Limit',
      type: 'number',
      default: 5,
    };

    // Remove slides field when using listing
    schema.fieldsets[0].fields = schema.fieldsets[0].fields.filter(
      (field) => field !== 'slides'
    );
  } else {
    // Remove listing fields when not using listing
    const listingFields = ['query', 'sortOn', 'sortOrder', 'limit'];
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