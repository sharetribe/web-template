import React from 'react';
import css from './Testimonials.module.css';

import Slider from "react-slick";
import { Link } from '../../containers/PageBuilder/Primitives/Link';
import { Quote } from 'lucide-react';


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

const testimonialsData = [
    {
        name: "Steve Anderson",
        title: "Vending Grand Master",
        avatar: "/static/testimonials/steve.jpg",
        testimonial: "In my 45+ years of vending, I've never seen anything like this. Vending Village is a total game changer!",
        profileID: "67896702-b6eb-4b1d-bbfc-cece57dcf66e",
      },
    {
    name: "Maureen Washington",
    title: "Location Finder",
    avatar: "/static/testimonials/maureen.jpg",
    testimonial: "Vending Village has seriously transformed our business. We're way more productive and seeing great results.",
    profileID: "67587c49-837e-431f-a496-0fdddb64a05e", 
  },
  
  {
    name: "Javier Carrera",
    title: "Healthy Snaxs Vending",
    avatar: "/static/testimonials/javier.jpg",
    testimonial: "I bought a location, but it wasn't a fit. I got a full refund - no questions asked. Just bought another one and it's a great fit!",
    profileID: "66db113b-3943-4749-bc12-6d5458bbb3e5",
  },
];

const Testimonials = ({section}) => {
    //console.log('section', section);
  return (
    <section className={css.root}>
      <h2>{section.title.content}</h2>
      <div className={css.sliderContainer}>
        <Slider {...settings}>
          {testimonialsData.map((testimonial, index) => (
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