/**
 * ProductCard.jsx
 * ─────────────────────────────────────────────────────
 * Tarjeta de producto para el catálogo del e-commerce.
 *
 * Props:
 *  - product         {object}   Datos del producto (ver propTypes al final)
 *  - userRole        {string}   Rol del usuario: 'Client' | 'Wholesaler' | 'Admin' | 'Employee' | null
 *  - onAddToCart     {function} Callback al hacer click en "Agregar al carrito"
 */

'use client'; // Next.js App Router — necesario para estado de interacción

import { useState } from 'react';
import { ShoppingCart, Package, Tag, Zap } from 'lucide-react';
import PropTypes from 'prop-types';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Formatea un número como currency ARS.
 * @param {number} amount
 * @returns {string}  e.g. "$12.499,99"
 */
const formatPrice = (amount) =>
    new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);

/**
 * Resuelve el precio y la metadata de precio a mostrar según el rol del usuario.
 *
 * @param {object} product
 * @param {string|null} userRole
 * @returns {{ displayPrice: number, isWholesale: boolean, minQty: number|null }}
 */
function resolvePricing(product, userRole) {
    const wp = product.wholesalePrice;

    if (userRole === 'Wholesaler' && wp) {
        return {
            displayPrice: wp.price,
            isWholesale: true,
            minQty: wp.minQuantity,
        };
    }

    return {
        displayPrice: product.price,
        isWholesale: false,
        minQty: null,
    };
}

// ─── SUBCOMPONENTES ───────────────────────────────────────────────────────────

/** Imagen de portada del producto con fallback de ícono */
function ProductImage({ brand, model }) {
    const [imgError, setImgError] = useState(false);

    return (
        <div className="relative flex items-center justify-center w-full h-44 sm:h-52 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden rounded-t-2xl">
            {/* Patrón decorativo de fondo */}
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 80%, #8b5cf6 0%, transparent 50%)' }}
            />

            {imgError ? (
                <div className="flex flex-col items-center gap-2 text-slate-500 z-10">
                    <Package size={48} strokeWidth={1.2} />
                    <span className="text-xs font-medium tracking-wide">{brand}</span>
                </div>
            ) : (
                // Intenta cargar imagen dinámica; si falla, muestra el fallback
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={`/images/products/${brand.toLowerCase()}-${model.toLowerCase().replace(/\s+/g, '-')}.webp`}
                    alt={`${brand} ${model}`}
                    className="object-contain h-36 w-36 z-10 drop-shadow-2xl"
                    onError={() => setImgError(true)}
                />
            )}
        </div>
    );
}

/** Badge de categoría */
function CategoryBadge({ category }) {
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 ring-1 ring-inset ring-indigo-700/20">
            <Tag size={10} />
            {category}
        </span>
    );
}

/** Badge de stock */
function StockBadge({ stockOnline }) {
    if (stockOnline <= 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-950/50 text-red-400 border border-red-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Sin stock web
            </span>
        );
    }

    if (stockOnline <= 3) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950/50 text-amber-400 border border-amber-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Últimas {stockOnline} unid.
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Disponible web
        </span>
    );
}

/** Sección de precio con lógica mayorista */
function PriceSection({ displayPrice, regularPrice, isWholesale, minQty }) {
    return (
        <div className="flex flex-col gap-1">
            {isWholesale && (
                <div className="flex items-center gap-2">
                    {/* Precio tachado */}
                    <span className="text-sm text-slate-500 line-through">
                        {formatPrice(regularPrice)}
                    </span>
                    {/* Etiqueta mayorista */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-500/30">
                        <Zap size={9} className="fill-amber-400 text-amber-400" />
                        Mayorista
                    </span>
                </div>
            )}

            <div className="flex items-baseline gap-2">
                <span
                    className={`text-2xl font-extrabold tracking-tight ${isWholesale ? 'text-amber-300' : 'text-white'
                        }`}
                >
                    {formatPrice(displayPrice)}
                </span>
            </div>

            {isWholesale && minQty && (
                <p className="text-[11px] text-amber-500/80 font-medium">
                    Comprando {minQty} unidad{minQty > 1 ? 'es' : ''} o más
                </p>
            )}
        </div>
    );
}

/** Botón de carrito con estados: disponible / agotado / cargando */
function CartButton({ stockOnline, isLoading, onClick }) {
    const outOfStock = stockOnline <= 0;

    if (outOfStock) {
        return (
            <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold
                   bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50
                   select-none"
                aria-label="Producto agotado en canal web"
            >
                <ShoppingCart size={16} />
                Agotado en Web
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold
                 bg-gradient-to-r from-indigo-600 to-violet-600
                 hover:from-indigo-500 hover:to-violet-500
                 active:scale-[0.98] active:brightness-90
                 text-white shadow-lg shadow-indigo-900/40
                 transition-all duration-200 ease-out
                 disabled:opacity-60 disabled:cursor-wait
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            aria-label={`Agregar ${isLoading ? '(procesando)' : ''}`}
        >
            {isLoading ? (
                <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Agregando…
                </>
            ) : (
                <>
                    <ShoppingCart size={16} />
                    Agregar al Carrito
                </>
            )}
        </button>
    );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

/**
 * ProductCard
 *
 * @example
 * <ProductCard
 *   product={{
 *     id: 'uuid',
 *     brand: 'Samsung',
 *     model: 'Galaxy A55',
 *     category: 'Smartphones',
 *     price: 950000,
 *     stockOnline: 4,
 *     wholesalePrice: { price: 820000, minQuantity: 5 },
 *   }}
 *   userRole="Wholesaler"
 *   onAddToCart={(product) => console.log(product)}
 * />
 */
export default function ProductCard({ product, userRole, onAddToCart }) {
    const [isLoading, setIsLoading] = useState(false);

    const { displayPrice, isWholesale, minQty } = resolvePricing(product, userRole);

    const handleAddToCart = async () => {
        if (!onAddToCart) return;
        setIsLoading(true);
        try {
            await onAddToCart(product);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <article
            className="group relative flex flex-col w-full rounded-2xl overflow-hidden
                 bg-gradient-to-b from-slate-800/70 to-slate-900/90
                 border border-slate-700/50
                 shadow-xl shadow-black/30
                 hover:border-indigo-700/60 hover:shadow-indigo-950/40
                 transition-all duration-300 ease-out
                 hover:-translate-y-0.5"
            aria-label={`Producto: ${product.brand} ${product.model}`}
        >
            {/* Imagen */}
            <ProductImage brand={product.brand} model={product.model} />

            {/* Cuerpo de la card */}
            <div className="flex flex-col flex-1 gap-4 p-4 sm:p-5">

                {/* Fila: categoría + stock */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CategoryBadge category={product.category} />
                    <StockBadge stockOnline={product.stockOnline} />
                </div>

                {/* Nombre del producto */}
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-0.5">
                        {product.brand}
                    </p>
                    <h2 className="text-base sm:text-lg font-bold text-slate-100 leading-snug line-clamp-2">
                        {product.model}
                    </h2>
                </div>

                {/* Precio */}
                <PriceSection
                    displayPrice={displayPrice}
                    regularPrice={product.price}
                    isWholesale={isWholesale}
                    minQty={minQty}
                />

                {/* Separador */}
                <div className="h-px bg-slate-700/50" />

                {/* Botón de carrito */}
                <CartButton
                    stockOnline={product.stockOnline}
                    isLoading={isLoading}
                    onClick={handleAddToCart}
                />
            </div>
        </article>
    );
}

// ─── PROP TYPES ───────────────────────────────────────────────────────────────

ProductCard.propTypes = {
    product: PropTypes.shape({
        id: PropTypes.string.isRequired,
        brand: PropTypes.string.isRequired,
        model: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        stockOnline: PropTypes.number.isRequired,
        wholesalePrice: PropTypes.shape({
            price: PropTypes.number.isRequired,
            minQuantity: PropTypes.number.isRequired,
        }),
    }).isRequired,
    userRole: PropTypes.oneOf(['Admin', 'Employee', 'Client', 'Wholesaler', null]),
    onAddToCart: PropTypes.func,
};

ProductCard.defaultProps = {
    userRole: null,
    onAddToCart: null,
};
