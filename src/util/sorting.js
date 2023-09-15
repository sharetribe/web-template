export const ASC = 'ascending';
export const DSC = 'descending';

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

export const sortUsersByName = (a, b, order) => {

  const aField = a.attributes.profile.displayName;
  const bField = b.attributes.profile.displayName;

  const diff = aField.toLowerCase().localeCompare(bField.toLowerCase());

  if (order === ASC) {
      return diff;
  }

  return -1 * diff;
}

export const sortUsersByEmail = (a, b, order = ASC) => {
  
  const aField = a.attributes.email;
  const bField = b.attributes.email;

  const diff = aField.toLowerCase().localeCompare(bField.toLowerCase());

  if (order === ASC) {
      return diff;
  }

  return -1 * diff;
}

export const sortUsersByCommission = (a, b, order = ASC) => {
    
  const aField = a.attributes.profile.metadata?.commission ? a.attributes.profile.metadata?.commission : 15;
  const bField = b.attributes.profile.metadata?.commission ? b.attributes.profile.metadata?.commission : 15;
  
  const diff = aField - bField;

  if (order === ASC) {
      return diff;
  }

  return -1 * diff;
}
