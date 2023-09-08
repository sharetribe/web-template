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