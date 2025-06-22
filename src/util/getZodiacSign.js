const getZodiacSign = (month, day) => {
  const zodiac = [
    { sign: 'Capricorn', from: '01-01', to: '01-19' },
    { sign: 'Aquarius', from: '01-20', to: '02-18' },
    { sign: 'Pisces', from: '02-19', to: '03-20' },
    { sign: 'Aries', from: '03-21', to: '04-19' },
    { sign: 'Taurus', from: '04-20', to: '05-20' },
    { sign: 'Gemini', from: '05-21', to: '06-20' },
    { sign: 'Cancer', from: '06-21', to: '07-22' },
    { sign: 'Leo', from: '07-23', to: '08-22' },
    { sign: 'Virgo', from: '08-23', to: '09-22' },
    { sign: 'Libra', from: '09-23', to: '10-22' },
    { sign: 'Scorpio', from: '10-23', to: '11-21' },
    { sign: 'Sagittarius', from: '11-22', to: '12-21' },
    { sign: 'Capricorn', from: '12-22', to: '12-31' },
  ];

  const birth = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return zodiac.find(({ from, to }) => birth >= from && birth <= to)?.sign || null;
};

export default getZodiacSign; 