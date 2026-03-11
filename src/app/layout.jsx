import './globals.css';

export const metadata = {
    title: 'La Clínica del Celular Home V1',
    description: 'Plantilla de E-Commerce.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="es" suppressHydrationWarning>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                        (function() {
                            try {
                                const isWindows = navigator.userAgent.includes('Windows');
                                const dpr = window.devicePixelRatio;
                                if (isWindows && dpr > 1.2) {
                                    /* Si la escala es del 150% (dpr=1.5), limitamos el impacto */
                                    const scaleFactor = 1.15; // Queremos que se vea max 115% de grande aprox
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
