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
    testimonial: "I bought a location, but it wasn't a fit. I got a full refund - no questions asked. Just as advertised!",
    profileID: "67ad0a4c-2b13-4c3a-86be-11b397543be8",
  },
  {
    name: "Carlisa (Cat 🐈) Williams",
    title: "Location Specialist",
    avatar: "/static/testimonials/carlisa.avif",
    testimonial: "My passion is helping vendors get started in the vending business. Vending Village makes my job easier.",
    profileID: "67965b5b-4ed2-421f-9e23-6b783342b3c3",
  },
  {
    name: "Rudy Hage",
    title: "Location Agent",
    avatar: "https://sharetribe.imgix.net/66dcc19c-aa28-414e-aba4-bd3f5bfb9298/67bb945c-e324-42eb-bca2-a11791b71356?auto=format&crop=edges&fit=crop&h=240&w=240&s=2dd5fb133d0cdaf6a7e91f747c63d05f",
    testimonial: "Vending Village connects me with vendors looking for prime locations, creating a smooth and efficient process.",
    profileID: "67bb9438-0856-4f32-ba71-97ef9974e7d8",
  }

];

const Testimonials = ({section}) => {
    //console.log('section', section);
  const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const randomizedTestimonialsData = shuffleArray([...testimonialsData]);
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