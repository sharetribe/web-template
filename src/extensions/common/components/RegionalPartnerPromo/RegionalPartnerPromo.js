import React, { useState, useEffect } from 'react';
import { Phone, FilePenLine } from 'lucide-react';
import classNames from 'classnames';
import { FormattedMessage } from '../../../../util/reactIntl';
import ModalIframeButton from '../ModalIframeButton/ModalIframeButton';

import css from './RegionalPartnerPromo.module.css';

// Create a mapping of icon names to components
const iconMap = {
    Phone: Phone,
    FilePenLine: FilePenLine,
    // Add more icons as needed
};

const RegionalPartnerPromo = ({ address, varient }) => {
    const [promoData, setPromoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);

    // Extract region from location.search
    const regionMatch = address?.match(/([^,]+?)(?:\s+\d{5})?,\s*(Canada|United States)$/);
    const region = regionMatch ? regionMatch[1].trim() : null;

    useEffect(() => {
        if (region) {
            setLoading(true);
            fetch(`https://partner-promo-api.vendingvillage.com/?region=${region}`)
                .then(response => response.json())
                .then(data => {
                    //console.log(region, data)
                    if (data?.id) {
                        setPromoData(data);
                    } else {
                        setPromoData(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching promo data:', error);
                    setPromoData(null);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setPromoData(null);
            setLoading(false);
        }
    }, [region]);

    const handleClose = () => {
        setIsVisible(false);
    };

    if (!isVisible || loading || !region || !promoData) {
        return null;
    }

    const classes = classNames(css.root, css[varient]);

    return (
        <div className={classes}>
            <button onClick={handleClose} className={css.closeButton}>&times;</button>
            
            <div className={css.promoContainer}>
                <h2 className={css.title}>{promoData.promoTitle}</h2>
                <div className={css.promoTextContainer}>
                    <p
                        className={css.promoText}
                        dangerouslySetInnerHTML={{
                            __html: promoData.promoBody
                                ?.replace('{companyName}', `<strong>${promoData.companyName}</strong>`)
                                .replace('{region}', region),
                        }}
                    />
                    
                    <ModalIframeButton 
                        iframeUrl={`https://form.jotform.com/${promoData.formId}?region=${region}&promoTitle=${encodeURIComponent(promoData.promoTitle)}&contactName=${promoData.contactName}&contactEmail=${promoData.contactEmail}&companyName=${promoData.companyName}`} 
                        buttonLabel={promoData.ctaLabel} 
                        icon={iconMap[promoData.icon] || Phone}
                        buttonClassName={css.ctaButton}
                    />
                    
                </div>
            </div>

            <div className={css.selfPromo}>
                <a target="_blank" href="/p/partnership"><FormattedMessage id="RegionalPartnerPromo.selfPromo" /></a>
            </div>
        </div>
    );
}

export default RegionalPartnerPromo;
