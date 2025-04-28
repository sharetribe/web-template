import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { FilePenLine } from 'lucide-react';
import { FormattedMessage } from '../../../../../../util/reactIntl';
import ModalIframeButton from '../../../ModalIframeButton/ModalIframeButton';

import css from './AgentApplyNow.module.css';

const AgentApplyNow = () => {

const [promoCode, setPromoCode] = useState(null);

    useEffect(() => {
   
        // Get promo code from URL if it exists, otherwise check cookie
        //if the value is set, make the field readonly
        const params = new URLSearchParams(window.location.search);
        const fprParam = params.get('fpr');
        const cookiePromoCode = Cookies.get('_fprom_ref');
        if (fprParam) {
            setPromoCode(fprParam);
        } else if (cookiePromoCode) {
            setPromoCode(cookiePromoCode);
        }
    }, []);

    return (
        <div className={css.root}>
            <ModalIframeButton 
                iframeUrl={`https://link.vendingvillage.com/agent-application-form?promoCode=${promoCode}`} 
                buttonLabel={<FormattedMessage id="AgentApplyNow.buttonLabel" />} 
                icon={FilePenLine}
                buttonClassName="primaryButton"
            />
        </div>
    )
}

export default AgentApplyNow;