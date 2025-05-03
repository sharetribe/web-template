import { AspectRatioWrapper } from '../index';

const AspectRatioWrapperMaybe = ({ isSquareLayout, children, ...rest }) => {
  if (isSquareLayout) {
    return <AspectRatioWrapper {...rest}>{children}</AspectRatioWrapper>;
  }
  return <>{children}</>;
};

export default AspectRatioWrapperMaybe;
