import logoImageDesktop from '../assets/biketribe-logo-desktop.png';
import logoImageMobile from '../assets/biketribe-logo-mobile.png';
import brandImage from '../assets/biketribe-brandImage-1500.jpg';
import facebookImage from '../assets/biketribe-facebook-sharing-1200x630.jpg';
import twitterImage from '../assets/biketribe-twitter-sharing-600x314.jpg';

/////////////////////////////////////////////////////////
// This file contains configs that affect branding     //
// NOTE: these are just some of the relevant configs   //
// Most of the work happens in marketplaceDefaults.css //
// and in components.                                  //
/////////////////////////////////////////////////////////

// Marketplace color.
// This is saved as CSS Property: --marketplaceColor in src/app.js
// Also --marketplaceColorDark and --marketplaceColorLight are generated from this one
// by adding +/- 10% to lightness.
export const marketplaceColor = '#7c3aed';

// Logo is used in Topbar on mobile and desktop, where height is the limiting factor.
// Therefore, we strongly suggest that your image file for desktop logo is in landscape!
//
// If you need to fine-tune the logo, the component is defined in src/components/Logo/Logo.js
// By default logo gets 24 pixels vertical space, but it could be wider (e.g. 180px)
// The default images are meant for retina displays and are therefore twice as big in actual dimensions
export const logoImageDesktopURL = logoImageDesktop;
export const logoImageMobileURL = logoImageMobile;

// The _logoSettings_ settings for the logo. Due to constraints in current Topbar, we only support 3 height variants
// at this point. There could be more height variants in the future and potentially other logo formats than 'image'.
// Note: logo image is always scaled and the limiting factor is height. However, there's also maximum width,
//       which is 370px in the Topbar. If the logo is wider than that, browser will scale it down.
export const logoSettings = {
  height: 24, // Hosted asset supports: 24, 36, 48
  format: 'image',
};

// brandImageURL is used as a background image on the "hero" section of several pages.
// Used on AuthenticationPage, EmailVerificationPage, PasswordRecoveryPage, PasswordResetPage etc.
// NOTE: Those pages use ResponsiveBackgroundImageContainer component,
//       it's possible to include more image variants to make image fetching more performant.
export const brandImageURL = brandImage;

// Default images for social media sharing
// These can be overwritten per page

// For Facebook, the aspect ratio should be 1200x630 (otherwise, the image is cropped)
export const facebookImageURL = facebookImage;
// For Twitter, the aspect ratio should be 600x314 (otherwise, the image is cropped)
export const twitterImageURL = twitterImage;
