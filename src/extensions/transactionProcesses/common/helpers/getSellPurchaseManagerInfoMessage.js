export const getSellPurchaseManagerInfoMessage = ({
  managerAddress,
  managerEmail,
  managerName,
  managerPhoneNumber,
}) => {
  return `Business: ${managerBusinessName}, 
Manager Name: ${managerName},
Manager Email: ${managerEmail},
Manager Phone: ${managerPhoneNumber},
Address of Location: ${managerAddress}`;
};
