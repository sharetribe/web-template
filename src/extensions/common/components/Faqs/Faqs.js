import React from 'react';
import { Accordion, AccordionItem, AccordionItemHeading, AccordionItemButton, AccordionItemPanel } from 'react-accessible-accordion';
import faqsData from './faqsData.json';
//import 'react-accessible-accordion/dist/fancy-example.css'; // Import the default styles
import css from './Faqs.module.css';


const Faqs = ({ audience, category }) => {
  // Filter FAQs based on audience and category
  const filteredFaqs = faqsData.filter(faq => 
    (audience === 'all' || faq.audience === audience) &&
    (category === 'all' || faq.category.includes(category))
  );

  return (
    <div className={css.root}>
    <Accordion allowZeroExpanded className={css.accordion}>
      {filteredFaqs.map((faq, index) => (
        <AccordionItem key={index} className={css.accordionItem}>
          <AccordionItemHeading className={css.accordionHeading}>
            <AccordionItemButton className={css.accordionButton}>
              {faq.question}
            </AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel className={css.accordionPanel}>
            <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
          </AccordionItemPanel>
        </AccordionItem>
      ))}
    </Accordion>
    </div>
  );
};

export default Faqs;
