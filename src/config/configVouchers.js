/////////////////////////////////////////////////////////
// Configurations related to vouchers/codes            //
// Comment out to disable Voucherify                   //
/////////////////////////////////////////////////////////

export const ENABLED = process.env.REACT_APP_VOUCHERIFY_ENABLED !== 'false';
export const APPLICATION_ID = process.env.REACT_APP_VOUCHERIFY_CLIENT_APPLICATION_ID;
export const SECRET_KEY = process.env.REACT_APP_VOUCHERIFY_CLIENT_KEY;
export const API_URL = process.env.REACT_APP_VOUCHERIFY_API_URL || 'https://us1.api.voucherify.io';
