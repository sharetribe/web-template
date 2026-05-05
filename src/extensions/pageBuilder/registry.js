import { avPageBuilderExtension } from './av';
import { noopPageBuilderExtension } from './noop';
import { composePageBuilderExtensions } from './composeExtensions';

export const pageBuilderExtensions = [noopPageBuilderExtension, avPageBuilderExtension];

// Pre-composed entry point — call from CMSPage.js to fan out hooks.
export const pageBuilderExtension = composePageBuilderExtensions(pageBuilderExtensions);
