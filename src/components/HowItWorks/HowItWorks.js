import React from 'react';
import { useHistory } from 'react-router-dom'; 
import css from './HowItWorks.module.css';
import img1 from '../../media/landing/1.png';
import img2 from '../../media/landing/2.png';
import img3 from '../../media/landing/3.png';

const HowItWorks = ({isTeamBuilding}) => {
  const history = useHistory(); 

  // Navigate to /ts
  const handleNavigate = () => {
    isTeamBuilding? history.push('/ts') : history.push('/s?bounds=46.51185105%2C9.45037995%2C44.51045137%2C7.47284088');
  };

  return (
    <div className={css.container}>
      <h2 className={css.title}>Come funziona</h2>
      <div className={css.steps}>
        <div className={css.step} onClick={handleNavigate}>
          <img src={img1} alt="Step 1" className={css.image} />
          <p>esplora</p>
        </div>
        <div className={css.arrow}></div>
        <div className={css.step} onClick={handleNavigate}>
          <img src={img2} alt="Step 2" className={css.image} />
          <p>scegli</p>
        </div>
        <div className={css.arrow}></div>
        <div className={css.step}>
          <img src={img3} alt="Step 3" className={css.image} />
          <p>
            en<span style={{ color: '#0048ff' }}>joy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;



