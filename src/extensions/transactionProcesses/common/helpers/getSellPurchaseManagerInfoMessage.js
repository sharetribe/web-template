export const getSellPurchaseManagerInfoMessage = ({
  managerAddress,
  managerEmail,
  managerName,
  managerPhoneNumber,
}) => {
  return `Manager Name: ${managerName},
Manager Email: ${managerEmail},
Manager Phone: ${managerPhoneNumber},
Address of Location: ${managerAddress}`;
};
