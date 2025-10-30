import { parse } from '../../util/urlHelpers';
import { verify } from '../../ducks/emailVerification.duck';

// ================ Load data ================ //

export const loadData = (params, search) => {
  const urlParams = parse(search);
  const verificationToken = urlParams.t;
  const token = verificationToken ? `${verificationToken}` : null;
  return verify(token);
};
