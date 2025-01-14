import React from 'react'
import {
  PrevButton,
  NextButton,
  usePrevNextButtons
} from './EmblaCarouselArrowButtons'
import {
  SelectedSnapDisplay,
  useSelectedSnapDisplay
} from './EmblaCarouselSelectedSnapDisplay'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import c1 from '../../media/landing/c1.jpg'
import c2 from '../../media/landing/c2.jpg'
import c3 from '../../media/landing/c3.jpg'
import c4 from '../../media/landing/c4.JPG'
import c5 from '../../media/landing/c5.JPG'

const EmblaCarousel = (props) => {
  const { slides } = props
  const options = { loop: true }
  const autoplayOptions = { delay: 2000 };
  const [emblaRef, emblaApi] = useEmblaCarousel(options, [Autoplay(autoplayOptions)])
  const images = [
    { src: c1, link: 'https://www.clubjoy.it/l/decora-un-set-da-colazione-in-ceramica/667983e5-d30a-465d-b814-8e9a62b3947b' },
    { src: c2, link: 'https://www.clubjoy.it/l/corso-di-cucina/66d6ba94-9674-42cc-9dab-106a6e39b2e0' },
    { src: c3, link: 'https://www.clubjoy.it/l/vision-dreamer-vision-boarding-manifestation/666ae80f-5339-4888-81a5-70fb13e11509' },
    { src: c4, link: 'https://www.clubjoy.it/l/vision-dreamer-vision-boarding-manifestation/666ae80f-5339-4888-81a5-70fb13e11509' },
    { src: c5, link: 'https://www.clubjoy.it/l/workshop-di-paint-n-sip/666eff24-f2cb-4d14-92f8-d60bf00684c4' }
  ]
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick
  } = usePrevNextButtons(emblaApi)

  const { selectedSnap, snapCount } = useSelectedSnapDisplay(emblaApi)

  const handleImageClick = (link) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="embla">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {images.map((image, index) => (
            <div className="embla__slide" key={index}>
              <div className="embla__parallax">
                <div className="embla__parallax__layer">
                  <img
                    className="embla__slide__img embla__parallax__img"
                    src={image.src}
                    alt={`Slide ${index + 1}`}
                    onClick={() => handleImageClick(image.link)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EmblaCarousel