import React, { useRef } from 'react';
import { H2 } from '../../containers/PageBuilder/Primitives/Heading';
import { Ingress } from '../../containers/PageBuilder/Primitives/Ingress';
import { PrimaryButton } from '../Button/Button';
import SlideContentWrapper from './SlideContentWrapper';

const PromptSlide = ({ continueToNextSlide, startInstructorLookup }) => {

  const textAreaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    startInstructorLookup(textAreaRef.current.value);
    continueToNextSlide();
  };


  return (
    <SlideContentWrapper>
      <H2>Let's Find You The Perfect Instructor!</H2>
      <Ingress style={{ maxWidth: '700px' }}>Our algorithm matches your user profile and training
        goals to suggest the best instructors for your needs.</Ingress>
      <Ingress style={{ maxWidth: '700px' }}>Before we begin, is there anything you'd like us to
        consider before suggesting matches? If so, write it in the box below!</Ingress>
      <form onSubmit={handleSubmit}
            style={{ maxWidth: '700px', textAlign: 'left', marginTop: '1.5rem' }}>
        <label style={{ paddingBottom: '2px', paddingLeft: '8px' }} htmlFor='additional-ai-context'>Additional Context</label>
        <textarea rows='5' cols='30' id='additional-ai-context' name='additional-ai-context'
                  placeholder="Write anything else you'd like us to consider here..."
                  ref={textAreaRef} />
        <PrimaryButton type='submit' style={{ margin: '20px' }}>Give me some suggestions!</PrimaryButton>
      </form>
    </SlideContentWrapper>
  );

};

export default PromptSlide;
