import React from 'react';

import { Star } from 'lucide-react';
import { FormattedMessage } from '../../../../../../util/reactIntl';

import css from './SocialProofReviews.module.css';

const faces = [
    "https://sharetribe.imgix.net/66dcc19c-aa28-414e-aba4-bd3f5bfb9298/67e6e2f6-7f2e-4578-8676-28d655f60555?auto=format&crop=edges&fit=crop&h=240&w=240&s=1a0974209b8ea3807b05c4344ea28620",
    "/static/testimonials/maureen.jpg",
    "https://sharetribe.imgix.net/66dcc19c-aa28-414e-aba4-bd3f5bfb9298/67bb945c-e324-42eb-bca2-a11791b71356?auto=format&crop=edges&fit=crop&h=240&w=240&s=2dd5fb133d0cdaf6a7e91f747c63d05f",
    "https://sharetribe.imgix.net/66dcc19c-aa28-414e-aba4-bd3f5bfb9298/67e6fcf6-a50f-48a7-8062-c927be9dc538?auto=format&crop=edges&fit=crop&h=240&w=240&s=d3d1cc26e1cbc752fbc12d41752d435a",
    "https://sharetribe.imgix.net/66dcc19c-aa28-414e-aba4-bd3f5bfb9298/67fa08dc-b2ff-43fd-8773-034967610cdd?auto=format&crop=edges&fit=crop&h=240&w=240&s=73ea93298bdb6452d3c8cc1be756034b",
    "/static/testimonials/steve.jpg",
];
const SocialProofReviews = () => {
    return (
        <div className={css.root}>
            <div className={css.faces}>
            {faces.map((face, index) => (
                <img key={index} src={face} alt={`User face ${index + 1}`} className={css.face} />
            ))}
            </div>
            <div className={css.stars}><Star/><Star/><Star/><Star/><Star/></div>
            <div className={css.title}><FormattedMessage id="SocialProofReviews.title" /></div>
            <div className={css.caption}><FormattedMessage id="SocialProofReviews.caption" /></div>
        </div>
    )
}

export default SocialProofReviews;