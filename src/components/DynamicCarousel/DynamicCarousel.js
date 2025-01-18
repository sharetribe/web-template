import React, { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { PrimaryButton } from '../Button/Button';
import { useHistory } from 'react-router-dom';
import css from './DynamicCarousel.module.css';
import EmblaCarousel from '../Embla/EmblaCarousel';
import '../Embla/css/base.css'
import '../Embla/css/sandbox.css'
import '../Embla/css/embla.css'


const SLIDE_COUNT = 5
const SLIDES = Array.from(Array(SLIDE_COUNT).keys())

const DynamicCarousel = ({isTeamBuilding}) => {
  const history = useHistory();
  const [images, setImages] = useState([
    'https://picsum.photos/100/200?random=1',
    'https://picsum.photos/200/300?random=2',
    'https://picsum.photos/300/400?random=3',
    'https://picsum.photos/200/300?random=4',
    'https://picsum.photos/100/200?random=5',
  ]);
  const [isMobile, setIsMobile] = useState(false);

  const handleNavigate = () => {
    isTeamBuilding? history.push('/ts') : history.push('/s?bounds=46.51185105%2C9.45037995%2C44.51045137%2C7.47284088');
  };

  return (
    <div className={css.container}>
      <h2 className={css.title}>I più amati da tutti</h2>
      <EmblaCarousel isTeamBuilding={isTeamBuilding}/>

      <div className={css.buttonContainer}>
        <PrimaryButton
          type="submit"
          className={css.button}
          onClick={handleNavigate}
        >
          Esplora tutti i team building
        </PrimaryButton>
      </div>
    </div>
  );
};

export default DynamicCarousel;
