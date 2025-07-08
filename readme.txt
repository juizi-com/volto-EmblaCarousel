These files get added to the customizations/components/Blocks folder

To register EmblaCarousel block, add to src/index.js

import sliderSVG from '@plone/volto/icons/slider.svg';
import { Edit as EmblaCarouselEdit, View as EmblaCarouselView} from './components/Blocks/EmblaCarousel';

const applyConfig = (config) => {

	//EmblaCarousel
	config.blocks.blocksConfig.EmblaCarousel = {
	    id: 'EmblaCarousel',
	    title: 'Embla Carousel',
	    icon: sliderSVG,
	    group: 'common',
	    view: EmblaCarouselView,
	    edit: EmblaCarouselEdit,
	    restricted: false,
	    mostUsed: true,
	    sidebarTab: 1,
	};

	return config;
};

export default applyConfig;