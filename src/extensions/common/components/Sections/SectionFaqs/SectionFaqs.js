import React from 'react';
import css from './SectionFaqs.module.css';

import Faqs from '../../Faqs/Faqs';

const SectionFaqs = ({section}) => {

    // Parse the JSON string into a JavaScript object
    let parsedData;
    try {
        parsedData = JSON.parse(section.description?.content);
    } catch (error) {
        console.error("Failed to parse JSON:", error);
    }

    return (
        <section className={css.root}>
            <h2>{section.title.content}</h2>
            <Faqs audience={parsedData.audience} category={parsedData.category} />
        </section>
    );
};
    
export default SectionFaqs;