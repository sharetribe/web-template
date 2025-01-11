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
  const images = [c1, c2, c3, c4, c5]
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick
  } = usePrevNextButtons(emblaApi)

  const { selectedSnap, snapCount } = useSelectedSnapDisplay(emblaApi)
  

  return (
    <div className="embla">
    <div className="embla__viewport" ref={emblaRef}>
      <div className="embla__container">
      {images.map((src, index) => (
            <div className="embla__slide" key={index}>
              <div className="embla__parallax">
                <div className="embla__parallax__layer">
                  <img
                    className="embla__slide__img embla__parallax__img"
                    src={src}
                    alt={`Slide ${index + 1}`}
                  />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

      {/*<div className="embla__controls">
        <div className="embla__buttons">
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>

        <SelectedSnapDisplay
          selectedSnap={selectedSnap}
          snapCount={snapCount}
        />
      </div>*/}
      </div>
  )
}

export default EmblaCarousel
