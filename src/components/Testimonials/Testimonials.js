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
    name: "Maureen Washington",
    title: "Location Finder",
    avatar: "/static/testimonials/maureen.jpg",
    testimonial: "This service has transformed our business. The team is fantastic and the results speak for themselves.",
    profileID: "1234567890", 
  },
  {
    name: "Borat",
    title: "Vending Operator",
    avatar: "https://sharetribe.imgix.net/665d2413-bb2c-4976-a79b-92874b1868bb/670928a7-01df-4103-b240-4283024f7c50?auto=format&crop=edges&fit=crop&h=480&w=480&s=e172d685e66109da3bdfa49ec0f9be13",
    testimonial: "An amazing experience! The platform is user-friendly and the support team is always there to help.",
    profileID: "1234567890",
  },
  {
    name: "Alice Johnson",
    title: "Product Designer",
    avatar: "https://sharetribe.imgix.net/66d9f518-0df9-4dba-b7b8-76ee987917da/6761d443-eeb7-4cc7-bca8-71fa1356c3d9?auto=format&crop=edges&fit=crop&h=480&w=480&s=0264f1f71e40746f7843f92b95c99b1c",
    testimonial: "I love the intuitive design and the seamless integration with our existing tools. Highly recommend!",
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