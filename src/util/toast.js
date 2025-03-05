import toast from 'react-hot-toast';

export const showSuccessToast = message => {
  toast.success(message, {
    duration: 4000,
    position: 'top-center',
    // You can add more options here
  });
};

export const showErrorToast = message => {
  toast.error(message, {
    duration: 4000,
    position: 'top-center',
    // You can add more options here
  });
};
