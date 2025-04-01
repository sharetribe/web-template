import React from 'react';
import { Accordion, AccordionItem, AccordionItemHeading, AccordionItemButton, AccordionItemPanel } from 'react-accessible-accordion';
import faqsData from './faqsData.json';
//import 'react-accessible-accordion/dist/fancy-example.css'; // Import the default styles
import './Faqs.css';


const Faqs = ({ audience, category }) => {
  // Filter FAQs based on audience and category
  const filteredFaqs = faqsData.filter(faq => 
    (audience === 'all' || faq.audience === audience) &&
    (category === 'all' || faq.category.includes(category))
  );

  return (
    <Accordion allowZeroExpanded>
      {filteredFaqs.map((faq, index) => (
        <AccordionItem key={index}>
          <AccordionItemHeading>
            <AccordionItemButton>
              {faq.question}
            </AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel>
            <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
          </AccordionItemPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default Faqs;
