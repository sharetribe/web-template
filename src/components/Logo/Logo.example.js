import React from 'react';

import scaled24h from './images/scaled24h.png';
import scaled24h2x from './images/scaled24h2x.png';
import scaled36h from './images/scaled36h.png';
import scaled36h2x from './images/scaled36h2x.png';
import scaled48h from './images/scaled48h.png';
import scaled48h2x from './images/scaled48h2x.png';

import { LogoComponent } from './Logo';
import css from './LinkedLogo.module.css';

const logoImageDesktop = scaled24h;
const logoImageMobile = scaled24h;

export const Scaled24h_local_desktop = {
  component: LogoComponent,
  props: {
    layout: 'desktop',
    logoImageDesktop: scaled24h,
    logoImageMobile,
    logoSettings: { format: 'image', height: 24 },
    marketplaceName: 'ExampleMarketplace',
    className: css.logo,
  },
  group: 'logo',
};

// emulate the syntax of hosted asset
export const Scaled24h_responsive_desktop = {
  component: LogoComponent,
  props: {
    layout: 'desktop',
    logoImageDesktop: {
      id: '00000000-0000-0000-0000-000000000000',
      type: 'imageAsset',
      attributes: {
        variants: {
          scaled: {
            height: 24,
            width: 154,
            url: scaled24h,
            name: 'scaled',
          },
          scaled2x: {
            height: 48,
            width: 308,
            url: scaled24h2x,
            name: 'scaled2x',
          },
        },
        assetPath: '/design/branding/logo-00000000-0000-0000-0000-000000000000.png',
      },
    },
    logoImageMobile,
    logoSettings: { format: 'image', height: 24 },
    marketplaceName: 'ExampleMarketplace',
    className: css.logo,
  },
  group: 'logo',
};

export const Scaled36h_local_desktop = {
  component: LogoComponent,
  props: {
    layout: 'desktop',
    logoImageDesktop: scaled36h,
    logoImageMobile,
    logoSettings: { format: 'image', height: 36 },
    marketplaceName: 'ExampleMarketplace',
    className: css.logo,
  },
  group: 'logo',
};

export const Scaled36h_responsive_desktop = {
  component: LogoComponent,
  props: {
    layout: 'desktop',
    logoImageDesktop: {
      id: '00000000-0000-0000-0000-000000000000',
      type: 'imageAsset',
      attributes: {
        variants: {
          scaled: {
            height: 36,
            width: 231,
            url: scaled36h,
            name: 'scaled',
          },
          scaled2x: {
            height: 72,
            width: 462,
            url: scaled36h2x,
            name: 'scaled2x',
          },
        },
        assetPath: '/design/branding/logo-00000000-0000-0000-0000-000000000000.png',
      },
    },
    logoImageMobile,
    logoSettings: { format: 'image', height: 36 },
    marketplaceName: 'ExampleMarketplace',
    className: css.logo,
  },
  group: 'logo',
};

export const Scaled48h_local_desktop = {
  component: LogoComponent,
  props: {
    layout: 'desktop',
    logoImageDesktop: scaled48h,
    logoImageMobile,
    logoSettings: { format: 'image', height: 48 },
    marketplaceName: 'ExampleMarketplace',
    className: css.logo,
  },
  group: 'logo',
};

export const Scaled48h_responsive_desktop = {
  component: LogoComponent,
  props: {
    layout: 'desktop',
    logoImageDesktop: {
      id: '00000000-0000-0000-0000-000000000000',
      type: 'imageAsset',
      attributes: {
        variants: {
          scaled: {
            height: 48,
            width: 308,
            url: scaled48h,
            name: 'scaled',
          },
          scaled2x: {
            height: 96,
            width: 616,
            url: scaled48h2x,
            name: 'scaled2x',
          },
        },
        assetPath: '/design/branding/logo-00000000-0000-0000-0000-000000000000.png',
      },
    },
    logoImageMobile,
    logoSettings: { format: 'image', height: 48 },
    marketplaceName: 'ExampleMarketplace',
    className: css.logo,
  },
  group: 'logo',
};

const LogoWrapper160w = props => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      backgroundColor: 'tomato',
      color: 'white',
    }}
  >
    <div
      style={{
        maxWidth: '160px',
        overflow: 'hidden',
        border: '1px dotted tomato',
        backgroundColor: 'white',
      }}
    >
      <LogoComponent {...props} />
    </div>
    Wrapper element has set a max-width for the logo.
  </div>
);

export const Scaled24h_responsive_mobile160w = {
  component: LogoWrapper160w,
  props: {
    layout: 'mobile',
    logoImageDesktop,
    logoImageMobile: {
      id: '00000000-0000-0000-0000-000000000000',
      type: 'imageAsset',
      attributes: {
        variants: {
          scaled: {
            height: 24,
            width: 128,
            url: scaled24h,
            name: 'scaled',
          },
          scaled2x: {
            height: 48,
            width: 256,
            url: scaled24h2x,
            name: 'scaled2x',
          },
        },
        assetPath: '/design/branding/logo-00000000-0000-0000-0000-000000000000.png',
      },
    },
    logoSettings: { format: 'image', height: 24 },
    marketplaceName: 'ExampleMarketplace',
    className: css.logo,
  },
  group: 'logo',
};

export const Scaled36h_responsive_mobile160w = {
  component: LogoWrapper160w,
  props: {
    layout: 'mobile',
    logoImageDesktop,
    logoImageMobile: {
      id: '00000000-0000-0000-0000-000000000000',
      type: 'imageAsset',
      attributes: {
        variants: {
          scaled: {
            height: 36,
            width: 192,
            url: scaled36h,
            name: 'scaled',
          },
          scaled2x: {
            height: 72,
            width: 384,
            url: scaled36h2x,
            name: 'scaled2x',
          },
        },
        assetPath: '/design/branding/logo-00000000-0000-0000-0000-000000000000.png',
      },
    },
    logoSettings: { format: 'image', height: 36 },
    marketplaceName: 'ExampleMarketplace',
    className: css.logo,
  },
  group: 'logo',
};

export const Scaled48h_responsive_mobile160w = {
  component: LogoWrapper160w,
  props: {
    layout: 'mobile',
    logoImageDesktop,
    logoImageMobile: {
      id: '00000000-0000-0000-0000-000000000000',
      type: 'imageAsset',
      attributes: {
        variants: {
          scaled: {
            height: 48,
            width: 192,
            url: scaled48h,
            name: 'scaled',
          },
          scaled2x: {
            height: 96,
            width: 384,
            url: scaled48h2x,
            name: 'scaled2x',
          },
        },
        assetPath: '/design/branding/logo-00000000-0000-0000-0000-000000000000.png',
      },
    },
    logoSettings: { format: 'image', height: 48 },
    marketplaceName: 'ExampleMarketplace',
    className: css.logo,
  },
  group: 'logo',
};
