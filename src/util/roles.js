export const AccessRole = (props,role) => {

    const { currentUser } = props

    if(currentUser){
        const { attributes } = currentUser;
        const { profile } = attributes;
        const { metadata } = profile;

        if(attributes && profile && metadata && metadata.role){
            return metadata.role === role;
        }
    }
    // an extra condition.
    return false;
  };
  