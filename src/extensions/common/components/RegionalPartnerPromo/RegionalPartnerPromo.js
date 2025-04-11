import React, { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';
import css from './RegionalPartnerPromo.module.css';

const RegionalPartnerPromo = ({ address, varient }) => {
    const [promoData, setPromoData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Extract region from location.search
    const regionMatch = address.match(/([^,]+?)(?:\s+\d{5})?,\s*(Canada|United States)$/);
    const region = regionMatch ? regionMatch[1].trim() : null;

    useEffect(() => {
        if (region) {
            setLoading(true);
            fetch(`https://partner-promo-api.vendingvillage.com/?region=${region}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data['Promo Title']) {
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

    if (loading) {
        return null;
    }

    if (region && promoData) {
        return (
            
            <div className={`${css.root} ${css[varient] || ''}`}>

                <div className={css.promoContainer}>

                    <h2 className={css.title}>{promoData['Promo Title']}</h2>
                    <div className={css.promoTextContainer}>
                        <p className={css.promoText}>
                            <strong>{promoData['Company Name']}</strong> is our preferred partner in {region}
                        </p>
                        <a target="_blank" href={promoData['CTA Link']} className={css.ctaButton}>
                            <Phone/> {promoData['CTA Label']}
                        </a>
                    </div>
                </div>

                <div className={css.selfPromo}>
                    <a target="_blank" href="/p/partnership">Become a partner</a>
                </div>

            </div>
            

        );
    }

    // If no promo data, return null
    return null;
}

export default RegionalPartnerPromo;
