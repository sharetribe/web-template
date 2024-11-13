import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const generateGiftCardCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const code = Array.from({ length: 10 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `GC${code}`;
};

const createUniqueGiftCardCode = async () => {
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = generateGiftCardCode();
    const { data, error } = await supabase
      .from('giftcard')
      .select('code')
      .eq('code', code);

    if (error) {
      console.error('Error checking for existing code:', error);
      throw error;
    }
    isUnique = data.length === 0;
  }

  return code;
};

export const createGiftCard = async ({ user, amount, gifter, isWellfare, listingId, recipient }) => {
  const code = await createUniqueGiftCardCode();

  try {
    const { data, error } = await supabase
      .from('giftcard')
      .insert([
        {
          code,
          user,
          amount,
          gifter,
          isWellfare,
          listingId,
          recipient,
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    console.log('Gift card created:', data);
    return data;
  } catch (error) {
    console.error('Error creating gift card:', error);
    return null;
  }
};

// =============== Test Function =============== //

const testCreateGiftCard = async () => {
  const giftCardData = {
    user: 'testUser',
    amount: 100.0,
    gifter: true,
    isWellfare: false,
    listing: 'testListing',
    recipient: 'testRecipient',
  };

  try {
    const result = await createGiftCard(giftCardData);
    console.log('Test result:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Uncomment the line below to run the test when the file is executed
// testCreateGiftCard();

