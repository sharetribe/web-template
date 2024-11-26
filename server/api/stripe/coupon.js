const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

const supabaseKey = process.env.REACT_APP_SUPABASE_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  const { code, listingId } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Coupon code is required.', codeType: 'missing', valid: false });
  }


  if (code.startsWith('GC') || code.startsWith('WF')) {
    try {
      const query = supabase.from('giftcard').select('*').eq('code', code);
      const { data, error } = await query.single();

      if (error || !data) {
        return res.status(200).json({
          message: 'Gift card code is not valid or listing mismatch.',
          codeType: code.startsWith('GC') ? 'giftCard' : 'welfareCard',
          valid: false,
        });
      }


    if (data.used) {
      return res.status(200).json({
        message: 'Gift card has already been used.',
        codeType: code.startsWith('GC') ? 'giftCard' : 'welfareCard',
        valid: false,
      });
    }

      if (code.startsWith('GC')) {


        return res.status(200).json({ amount_off: data.amount, code:data.code, codeType: 'giftCard', valid: true });
      } else if (code.startsWith('WF')) {
 

        if (data.listingId === listingId && data.isWellfare) {
          return res.status(200).json({ percent_off: 100, code:data.code,  codeType: 'welfareCard', valid: true });
        } else {
          return res.status(200).json({
            message: 'Welfare card listing mismatch or invalid welfare card.',
            codeType: 'welfare card',
            valid: false,
          });
        }
      }
    } catch (error) {
      console.error('Error querying Supabase:', error);
      return res.status(500).json({ message: 'Internal server error.', codeType: 'error', valid: false });
    }
  }

  // Default to Stripe API if code is neither GC nor WF
  axios
    .get(`https://api.stripe.com/v1/coupons/${code}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    })
    .then((response) => {
      res.status(200).json({ ...response.data, codeType: 'coupon', valid: true });
    })
    .catch(() => {
      res.status(200).json({ message: 'Coupon code is not valid.', codeType: 'invalid', valid: false });
    });
};