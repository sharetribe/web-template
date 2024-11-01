export const createTheme = branding => {
  return {
    token: {
      colorPrimary: branding.marketplaceColor,
      colorPrimaryHover: branding.marketplaceColorLight,
      colorPrimaryActive: branding.marketplaceColorDark,
      colorPrimaryText: 'var(--colorWhite)',
      colorSuccess: 'var(--colorSuccess)',
      colorSuccessHover: 'var(--colorSuccessDark)',
      colorSuccessActive: 'var(--colorSuccessDark)',
      colorInfo: branding.marketplaceColor,
      colorText: 'var(--colorGrey700)',
      colorTextDisabled: 'var(--colorGrey300)',
      colorBorder: 'var(--colorGrey100)',
      colorBorderHover: 'var(--colorGrey300)',
      colorDisabled: 'var(--colorGrey100)',
      borderRadius: 4,
      boxShadow: 'var(--boxShadowButton)',
      fontSize: 16,
      fontFamily: 'var(--fontFamily)',
      fontWeight: 'var(--fontWeightSemiBold)',
    },
    components: {
      Modal: {
        titleFontSize: 18,
      },
    },
  };
};
