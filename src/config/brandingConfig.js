import logoImageDesktop from '../assets/sneakertime-logo.png';
import logoImageMobile from '../assets/sneakertime-logo-mobile.png';
import brandImage from '../assets/background-1440.jpg';
import facebookImage from '../assets/sneakertimeFacebook-1200x630.jpg';
import twitterImage from '../assets/sneakertimeTwitter-600x314.jpg';

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
export const marketplaceColor = '#5d2bc0';

// Logo is used in Topbar on mobile and desktop, where height is the limiting factor.
// Therefore, we strongly suggest that your image file for desktop logo is in landscape!
//
// If you need to fine-tune the logo, the component is defined in src/components/Logo/Logo.js
// By default logo gets 27 pixels vertical space, but it could be wider (e.g. 180px)
// The default images are meant for retina displays and are therefore twice as big in actual dimensions
export const logoImageDesktopURL = logoImageDesktop;
export const logoImageMobileURL = logoImageMobile;

// brandImageURL is used as a background image on the "hero" section of several pages.
// Used on AuthenticationPage, EmailVerificationPage, PasswordRecoveryPage, PasswordResetPage etc.
export const brandImageURL = brandImage;

// Default images for social media sharing
// These can be overwritten per page

// For Facebook, the aspect ratio should be 1200x630 (otherwise, the image is cropped)
export const facebookImageURL = facebookImage;
// For Twitter, the aspect ratio should be 600x314 (otherwise, the image is cropped)
export const twitterImageURL = twitterImage;
