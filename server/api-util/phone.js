function maskPhone(p) {
  if (!p) return 'null';
  const digits = String(p).replace(/\D/g, '');
  return `***${digits.slice(-4)}`;
}
module.exports = { maskPhone };
