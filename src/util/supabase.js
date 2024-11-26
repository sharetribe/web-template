import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const generateGiftCardCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const code = Array.from({ length: 10 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
  return `GC${code}`;
};

const createUniqueGiftCardCode = async () => {
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = generateGiftCardCode();
    const { data, error } = await supabase.from('giftcard').select('code').eq('code', code);

    if (error) {
      console.error('Error checking for existing code:', error);
      throw error;
    }
    isUnique = data.length === 0;
  }

  return code;
};

export const createGiftCard = async ({ customerId, amount, transactionId }) => {
  const code = await createUniqueGiftCardCode();

  try {
    const { data, error } = await supabase
      .from('giftcard')
      .insert([
        {
          code,
          user: customerId,
          amount,
          isWellfare: false,
          listingId: null,
          recipient: null,
          used: false,
          purchaseId: transactionId,
        },
      ])
      .select();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error creating gift card:', error);
    return null;
  }
};

export const updateGiftCard = async (giftCardProps) => {
  const { giftCardType, giftCardAmount, bookingTotal, giftCardCode } = giftCardProps;

  try {
    if (giftCardType === 'giftCard') {
      const remainingAmount = Math.max(0, parseFloat(giftCardAmount) - parseFloat(bookingTotal));
      const usedStatus = remainingAmount === 0;

      const { data, error } = await supabase
        .from('giftcard')
        .update({
          amount: remainingAmount > 0 ? remainingAmount : 0,
          used: usedStatus,
        })
        .eq('code', giftCardCode)
        .select();

      if (error) {
        throw error;
      }
      return data;
    }

    if (giftCardType === 'welfareCard') {
      const { data, error } = await supabase
        .from('giftcard')
        .update({
          used: true,
        })
        .eq('code', giftCardCode)
        .select();

      if (error) {
        throw error;
      }

      return data;
    }

    throw new Error('Unsupported gift card type');
  } catch (error) {
    console.error('Error updating gift card:', error);
    return null;
  }
};

export const fetchGiftCard = async (userId, transactionId) => {
  try {
    if (!userId || !transactionId) {
      throw new Error('Both userId and transactionId are required to fetch gift cards.');
    }

    const { data, error } = await supabase
      .from('giftcard')
      .select('*') // Select all columns; adjust as needed
      .eq('user', userId)
      .eq('purchaseId', transactionId);

    if (error) {
      console.error('Error fetching gift cards:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchGiftCard:', error);
    return [];
  }
};