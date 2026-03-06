import './globals.css';

export const metadata = {
    title: 'La Clínica del Celular Home V1',
    description: 'Plantilla de E-Commerce.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="es">
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
            </head>
            <body className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-body transition-colors duration-200">
                {children}
            </body>
        </html>
    );
}
