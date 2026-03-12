import './globals.css';
import config from '@/config/tenantConfig.json';

export const metadata = {
    title: config.metadata.title,
    description: config.metadata.description,
};

/**
 * Generates inline CSS variable declarations from the tenant theme config.
 * Injected as an inline <style> tag so SSR picks up the correct colors
 * before the external CSS loads.
 */
function buildThemeStyleString() {
    const t = config.theme;
    return `:root {
  --color-primary: ${t.primary};
  --color-primary-hover: ${t.primaryHover};
  --color-secondary: ${t.secondary};
  --color-bg-light: ${t.backgroundLight};
  --color-bg-dark: ${t.backgroundDark};
  --color-surface-light: ${t.surfaceLight};
  --color-surface-dark: ${t.surfaceDark};
  --color-text-light: ${t.textLight};
  --color-text-dark: ${t.textDark};
}`;
}

export default function RootLayout({ children }) {
    return (
        <html lang={config.metadata.lang} suppressHydrationWarning>
            <head>
                <link href={config.fonts.googleFontsUrl} rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
                <style dangerouslySetInnerHTML={{ __html: buildThemeStyleString() }} />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                        (function() {
                            try {
                                const isWindows = navigator.userAgent.includes('Windows');
                                const dpr = window.devicePixelRatio;
                                if (isWindows && dpr > 1.2) {
                                    const scaleFactor = 1.15;
                                    const zoomLevel = scaleFactor / dpr; 
                                    document.documentElement.style.zoom = zoomLevel;
                                }
                            } catch (e) {
                                console.error('Error applying scale mitigation', e);
                            }
                        })();
                        `
                    }}
                />
            </head>
            <body className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-body transition-colors duration-200" suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
