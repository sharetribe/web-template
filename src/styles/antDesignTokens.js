import './marketplaceDefaults.css';

export const createTheme = branding => {
  const rootStyles = getComputedStyle(document.documentElement);

  return {
    token: {
      colorPrimary: branding.marketplaceColor,
      colorPrimaryHover: branding.marketplaceColorLight,
      colorPrimaryActive: branding.marketplaceColorDark,
      colorPrimaryText: rootStyles.getPropertyValue('--colorWhite'),
      colorSuccess: rootStyles.getPropertyValue('--colorSuccess'),
      colorSuccessHover: rootStyles.getPropertyValue('--colorSuccessDark'),
      colorSuccessActive: rootStyles.getPropertyValue('--colorSuccessDark'),
      colorInfo: branding.marketplaceColor,
      colorText: rootStyles.getPropertyValue('--colorGrey700'),
      colorTextDisabled: rootStyles.getPropertyValue('--colorGrey300'),
      colorBorder: rootStyles.getPropertyValue('--colorGrey100'),
      colorBorderHover: rootStyles.getPropertyValue('--colorGrey300'),
      colorDisabled: rootStyles.getPropertyValue('--colorGrey100'),
      boxShadow: rootStyles.getPropertyValue('--boxShadowButton'),
      fontFamily: rootStyles.getPropertyValue('--fontFamily'),
      fontWeight: rootStyles.getPropertyValue('--fontWeightSemiBold'),
      borderRadius: 4,
      fontSize: 16,
    },
    components: {
      Modal: {
        titleFontSize: 18,
      },
    },
  };
};
