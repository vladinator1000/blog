// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "vladinator1000";
export const SITE_DESCRIPTION =
  "Vlady's thoughts";
export const TWITTER_HANDLE = "@vladinator1000";
export const MY_NAME = "Vlady Veselinov";

// setup in astro.config.mjs
const BASE_URL = new URL(import.meta.env.SITE);
export const SITE_URL = BASE_URL.origin;
