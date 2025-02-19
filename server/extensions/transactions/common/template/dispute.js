const getDisputeEmailTemplate = data => {
  const { txId, providerName, customerName } = data;

  return `
    <p><b>Refund Request Review</b></p></br>
    <p>A buyer has requested a refund for an order. Please keep track of this request, and if the seller does not resolve it within 5 days, kindly step in to assist and take the necessary action.</p>
    <p>Order Details:</p>
    <ul>
      <li><b>Buyer:</b> ${customerName}</li>
      <li><b>Seller:</b> ${providerName}</li>
      <li><b>Transaction ID:</b> ${txId}</li>
    </ul>
    <p>Please monitor this case and resolve this. If a refund is necessary, process it manually via the Sharetribe Console</p>
    <p>Thank you,</p>
    <p>Vending Village</p>
  `;
};

module.exports = getDisputeEmailTemplate;
