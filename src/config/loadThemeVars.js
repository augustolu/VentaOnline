/**
 * loadThemeVars.js
 * 
 * Helper that reads tenantConfig.json and exports theme values
 * for use in tailwind.config.mjs and CSS generation.
 * 
 * This file is imported at BUILD TIME only (Node.js context),
 * never in client-side React components.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('./tenantConfig.json');

export const theme = config.theme;
export const fonts = config.fonts;
export const brand = config.brand;
export const features = config.features;
export const metadata = config.metadata;

export default config;
