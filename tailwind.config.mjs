/** @type {import('tailwindcss').Config} */
const config = {
    darkMode: "class",
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Neutral monochrome palette as requested
                primary: "#4b5563", // Gray 600
                "primary-hover": "#374151", // Gray 700
                secondary: "#6b7280", // Gray 500
                "background-light": "#ffffff",
                "background-dark": "#f3f4f6", // Off-white for dark mode replacement to keep it neutral/bright
                "surface-light": "#f9fafb", // Gray 50
                "surface-dark": "#e5e7eb", // Gray 200
                "text-light": "#111827", // Gray 900
                "text-dark": "#1f2937", // Gray 800
            },
            fontFamily: {
                display: ["Roboto", "sans-serif"],
                body: ["Roboto", "sans-serif"],
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

export default config;
