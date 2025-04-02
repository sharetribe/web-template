import React from 'react';
import css from './SectionFaqs.module.css';

import Faqs from '../../Faqs/Faqs';

const parseData = (content) => {
    // Parse the JSON string into a JavaScript object
    try {
        return JSON.parse(content);
    } catch (error) {
        console.error("Failed to parse JSON:", error);
        return false;
    }
}

const SectionFaqs = ({section}) => {

    const parsedData = parseData(section.description?.content);

    return (
        <section className={css.root}>
            <h2>{section.title.content}</h2>
            <Faqs audience={parsedData?.audience} category={parsedData?.category} />
        </section>
    );
};
    
export default SectionFaqs;