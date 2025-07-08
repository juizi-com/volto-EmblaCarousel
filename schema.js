import emblaCarouselBaseSchema from './schema-base';
import { emblaListingSchemaEnhancer } from './emblaListingSchemaEnhancer';

const emblaCarouselSchema = (props = {}) => {
  const base = emblaCarouselBaseSchema(props);
  const formData = props?.formData || {};
  const intl = props?.intl;

  return emblaListingSchemaEnhancer({ ...base }, formData, intl);
};

export default emblaCarouselSchema;
