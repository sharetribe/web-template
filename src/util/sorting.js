const ASC = 'ascending';
const DSC = 'descending';

export const sortFiledByText = (a, b, field, order = ASC) => {
  const diff = a[field].toLowerCase().localeCompare(b[field].toLowerCase());

  if (order === ASC) {
      return diff;
  }

  return -1 * diff;
}

export const sortFieldByNum = (a, b, field, order = ASC) => {
  const diff = a[field] - b[field];

  if (order === ASC) {
      return diff;
  }

  return -1 * diff;
}

export const sortUsers = () => {

}

export const sortUsersByName = (a, b, order = 'ASC') => {

  console.log('sortUsersByNamea');
  console.log(a);
  console.log(order);

  const aField = a.field;
  const bField = b.field;
  const diff = aField.toLowerCase().localeCompare(bField.toLowerCase());

  if (order === ASC) {
      return diff;
  }

  return -1 * diff;
}

export default sortUsersByName;

export const sortUsersByEmail = (a, b, field, order = ASC) => {
  const diff = a[field].toLowerCase().localeCompare(b[field].toLowerCase());

  if (order === ASC) {
      return diff;
  }

  return -1 * diff;
}

export const sortUsersByCommission = (a, b, field, order = ASC) => {
  const diff = a[field].toLowerCase().localeCompare(b[field].toLowerCase());

  if (order === ASC) {
      return diff;
  }

  return -1 * diff;
}