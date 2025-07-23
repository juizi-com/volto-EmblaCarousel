const emblaCarouselSchema = () => ({
  title: 'Embla Carousel',
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: [
        'slides',
        'slidesToShow',
        'displayMode',
        'autoplay',
        'autoplayDelay',
        'alignment',
        'isFullWidth',
        'loop',
        'hideArrows',
        'hideDots',
        'hideButtons',
        'clickableSlides',
        'hideDescription',
        'showEffectiveDate',
        'equalHeight',
      ],
    },
  ],
  properties: {
    slides: {
      title: 'Slides',
      widget: 'object_list',
      schema: {
        title: 'Slide',
        titleField: 'heading',
        fieldsets: [
          {
            id: 'default',
            title: 'Default',
            fields: ['heading', 'content', 'image', 'link', 'buttonText'],
          },
        ],
        properties: {
          heading: {
            title: 'Heading',
            type: 'string',
          },
          content: {
            title: 'Content',
            type: 'text',
          },
          image: {
            title: 'Image',
            widget: 'object_browser',
            mode: 'image',
            allowExternals: false,
          },
          link: {
            title: 'Link',
            widget: 'object_browser',
            mode: 'link',
            allowExternals: true,
            multi: false,
            default: null,
          },
          buttonText: {
            title: 'Button text',
            type: 'string',
          },
        },
        required: [],
      },
    },
    displayMode: {
      title: 'Display mode',
      type: 'string',
      choices: [
        ['full', 'Full (image + text)'],
        ['image-only', 'Image only'],
      ],
      default: 'full',
    },
    alignment: {
      title: 'Text alignment',
      widget: 'align',
      actions: ['left', 'center', 'right'],
      default: 'left',
    },
    isFullWidth: {
      title: 'Full width carousel',
      type: 'boolean',
      default: false,
    },
    loop: {
      title: 'Loop infinitely',
      type: 'boolean',
      default: true,
    },
    slidesToShow: {
      title: 'Slides to show',
      type: 'number',
      default: 1,
    },
    autoplay: {
      title: 'Autoplay',
      type: 'boolean',
    },
    autoplayDelay: {
      title: 'Autoplay delay (ms)',
      type: 'number',
      default: 8000,
    },
    clickableSlides: {
      title: 'Make slides clickable',
      type: 'boolean',
      default: false,
    },
    hideDescription: {
      title: 'Hide description/content',
      type: 'boolean',
      default: false,
    },
    equalHeight: {
      title: 'Make all slides equal height',
      type: 'boolean',
      default: false,
    },
    showEffectiveDate: {
      title: 'Show effective date',
      type: 'boolean',
      default: false,
    },
    hideArrows: {
      title: 'Hide arrows',
      type: 'boolean',
    },
    hideDots: {
      title: 'Hide dots',
      type: 'boolean',
    },
    hideButtons: {
      title: 'Hide buttons',
      type: 'boolean',
      default: false,
    },
    appendManualSlides: {
      title: 'Append manual slides',
      description: 'Add manual slides after the listing results',
      type: 'boolean',
      default: false,
    },
  },
  required: [],
});
export default emblaCarouselSchema;