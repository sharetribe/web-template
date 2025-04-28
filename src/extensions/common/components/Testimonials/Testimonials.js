import React from 'react';

import Slider from "react-slick";
import { Link } from '../../../../containers/PageBuilder/Primitives/Link';
import { Quote } from 'lucide-react';

import testimonialsData from './testimonialsData.json';

import css from './Testimonials.module.css';


const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 3,
    initialSlide: 0,
    responsive: [
      
      {
        breakpoint: 900,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          initialSlide: 2
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

const Testimonials = ({section}) => {
    //console.log('section', section);
  const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  
  const parsedData = section.description?.content ? JSON.parse(section.description?.content) : false;

  const category = parsedData?.category || "general";

  const filteredTestimonialsData = testimonialsData.filter(
    testimonial => testimonial.category.includes(category)
  );

  const randomizedTestimonialsData = shuffleArray([...filteredTestimonialsData]);

  return (
    <section className={css.root}>
      <h2>{section.title.content}</h2>
      <div className={css.sliderContainer}>
        <Slider {...settings}>
          {randomizedTestimonialsData.map((testimonial, index) => (
            <div key={index} className={css.testimonial}>
              <img src={testimonial.avatar} alt={`${testimonial.name}'s avatar`} />
              <h3>{testimonial.name}</h3>
              <p>{testimonial.title}</p>
              <blockquote><Quote className={css.openQuote} />{testimonial.testimonial}<Quote className={css.closeQuote} /></blockquote>
              <Link href={`/u/${testimonial.profileID}`}>View Profile</Link>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default Testimonials;