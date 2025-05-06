import { AspectRatioWrapper } from '../index';

const AspectRatioWrapperMaybe = ({ isSquareLayout, children, ...rest }) => {
  if (isSquareLayout) {
    return <AspectRatioWrapper {...rest}>{children}</AspectRatioWrapper>;
  }
  return <div>{children}</div>;
};

export default AspectRatioWrapperMaybe;
