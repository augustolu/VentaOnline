'use client';

import ProductCard from '@/components/catalog/ProductCard';

// ─── FIXTURES ─────────────────────────────────────────────────────────────────

const baseProduct = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    brand: 'Samsung',
    model: 'Galaxy A55 5G 128GB',
    category: 'Smartphones',
    price: 950_000,
    stockOnline: 8,
    wholesalePrice: {
        price: 820_000,
        minQuantity: 5,
    },
};

const SCENARIOS = [
    {
        label: 'Cliente normal — stock disponible',
        userRole: 'Client',
        product: { ...baseProduct },
    },
    {
        label: 'Mayorista — precio especial',
        userRole: 'Wholesaler',
        product: { ...baseProduct },
    },
    {
        label: 'Sin stock web (agotado)',
        userRole: 'Client',
        product: { ...baseProduct, stockOnline: 0 },
    },
    {
        label: 'Últimas unidades en web',
        userRole: 'Client',
        product: { ...baseProduct, stockOnline: 2 },
    },
    {
        label: 'Mayorista — sin stock web',
        userRole: 'Wholesaler',
        product: { ...baseProduct, stockOnline: 0 },
    },
    {
        label: 'Visitante no logueado',
        userRole: null,
        product: { ...baseProduct },
    },
];

export default function ProductCardDemoPage() {
    return (
        <main className="min-h-screen bg-slate-950 px-4 py-12">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 text-center">
                    <h1 className="text-3xl font-extrabold text-white mb-2">
                        ProductCard — Demo de variantes
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Todas las combinaciones de rol × stock × precio mayorista
                    </p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {SCENARIOS.map((s) => (
                        <div key={s.label} className="flex flex-col gap-2">
                            {/* Etiqueta del escenario */}
                            <span className="text-xs text-slate-500 font-medium tracking-wide uppercase px-1">
                                {s.label}
                            </span>

                            <ProductCard
                                product={s.product}
                                userRole={s.userRole}
                                onAddToCart={(p) => alert(`Agregado: ${p.brand} ${p.model}`)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
