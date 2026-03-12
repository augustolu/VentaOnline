/** @type {import('tailwindcss').Config} */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('./src/config/tenantConfig.json');

const tw = {
    darkMode: "class",
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // All colors now reference CSS custom properties
                // sourced from tenantConfig.json via :root variables.
                primary: "var(--color-primary)",
                "primary-hover": "var(--color-primary-hover)",
                secondary: "var(--color-secondary)",
                "background-light": "var(--color-bg-light)",
                "background-dark": "var(--color-bg-dark)",
                "surface-light": "var(--color-surface-light)",
                "surface-dark": "var(--color-surface-dark)",
                "text-light": "var(--color-text-light)",
                "text-dark": "var(--color-text-dark)",
            },
            fontFamily: {
                display: [config.fonts.display, "sans-serif"],
                body: [config.fonts.body, "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "0.5rem",
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms'),
    ],
};

export default tw;
