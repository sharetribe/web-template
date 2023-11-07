import React, { useState } from 'react';
import CustomListingCard from '../CustomListingCard/CustomListingCard';
import css from './SectionFeaturedExperience.module.css';

const SectionFeaturedExperience = () => { 
    return (
        <div className={css.sectionbody}>
            <div className={css.sectiontitle}>
                <div className={css.sectiontitletext}>Any team experience, on a single platform.</div>
                <div className={css.sectiontitleaction}>
                    <div className={css.sectiontitleallbtn}>See all</div>
                    <div className={css.sectiontitlebtn}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="16" viewBox="0 0 10 16" fill="none">
                            <path d="M0.293359 7.29609C-0.0972652 7.68672 -0.0972652 8.32109 0.293359 8.71172L6.29336 14.7117C6.68398 15.1023 7.31836 15.1023 7.70898 14.7117C8.09961 14.3211 8.09961 13.6867 7.70898 13.2961L2.41523 8.00234L7.70586 2.70859C8.09648 2.31797 8.09648 1.68359 7.70586 1.29297C7.31523 0.902344 6.68086 0.902344 6.29023 1.29297L0.290234 7.29297L0.293359 7.29609Z" fill="black"/>
                        </svg>
                    </div>
                    <div className={css.sectiontitlebtn}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="16" viewBox="0 0 10 16" fill="none">
                            <path d="M9.70664 7.29609C10.0973 7.68672 10.0973 8.32109 9.70664 8.71172L3.70664 14.7117C3.31602 15.1023 2.68164 15.1023 2.29102 14.7117C1.90039 14.3211 1.90039 13.6867 2.29102 13.2961L7.58477 8.00234L2.29414 2.70859C1.90352 2.31797 1.90352 1.68359 2.29414 1.29297C2.68477 0.902344 3.31914 0.902344 3.70977 1.29297L9.70977 7.29297L9.70664 7.29609Z" fill="black"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div className={css.sectioncontent}>
                <CustomListingCard title={'SoHo Skyline Venue'} location={'location'} isFavourite={true} hotel={'X Arlo Hotel'} background={'../../assets/images/home/feature1.png'} price={'From $3,000 / person'} />
                <CustomListingCard title={'SoHo Skyline Venue'} location={'location'} isFavourite={true} hotel={'X Arlo Hotel'} background={'../../assets/images/home/feature2.png'} price={'From $3,000 / person'} />
                <CustomListingCard title={'SoHo Skyline Venue'} location={'location'} isFavourite={true} hotel={'X Arlo Hotel'} background={'../../assets/images/home/feature3.png'} price={'From $3,000 / person'} />
                <CustomListingCard title={'SoHo Skyline Venue'} location={'location'} isFavourite={true} hotel={'X Arlo Hotel'} background={'../../assets/images/home/feature4.png'} price={'From $3,000 / person'} />
            </div>
        </div>
    )
}

export default SectionFeaturedExperience;