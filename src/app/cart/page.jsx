'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    ShoppingBag,
    X,
    Plus,
    Minus,
    ChevronDown,
    ArrowLeft,
    ArrowRight,
    Sparkles,
    Truck,
} from 'lucide-react';
import { useCartStore } from '@/lib/store/useCartStore';
import './cart.css';

/* ── Constants ─────────────────────────────────────────────── */
const DISCOUNT_THRESHOLD = 1_000_000;   // $1.000.000 ARS
const DISCOUNT_PERCENT = 7;           // 7% off

/**
 * Get available stock from a product's various data shapes.
 */
function getStock(product) {
    if (!product) return 0;
    if (product.stock_online && typeof product.stock_online.quantity === 'number')
        return product.stock_online.quantity;
    if (typeof product.stock_online === 'number') return product.stock_online;
    if (typeof product.stockOnline === 'number') return product.stockOnline;
    return 0;
}

/* ── Component ─────────────────────────────────────────────── */
export default function CartPage() {
    const {
        items,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        getTotalItems,
        getTotalPrice,
    } = useCartStore();

    const [isMounted, setIsMounted] = useState(false);
    const [shippingOpen, setShippingOpen] = useState(false);
    const [zipCode, setZipCode] = useState('');
    const [shippingCost, setShippingCost] = useState(null);
    const [country, setCountry] = useState('AR');

    useEffect(() => setIsMounted(true), []);

    /* ── Derived values ────────────────────────────────────── */
    const totalItems = isMounted ? getTotalItems() : 0;
    const subtotal = isMounted ? getTotalPrice() : 0;

    const progressPct = useMemo(
        () => Math.min((subtotal / DISCOUNT_THRESHOLD) * 100, 100),
        [subtotal],
    );
    const isDiscountUnlocked = subtotal >= DISCOUNT_THRESHOLD;
    const discountAmount = isDiscountUnlocked
        ? subtotal * (DISCOUNT_PERCENT / 100)
        : 0;
    const remaining = DISCOUNT_THRESHOLD - subtotal;

    const total = subtotal - discountAmount + (shippingCost ?? 0);

    /* ── Shipping mock ─────────────────────────────────────── */
    const handleShippingUpdate = () => {
        if (!zipCode.trim()) return;
        // Simulated cost based on ZIP length for demo
        const mockCost = parseInt(zipCode.slice(0, 4), 10) * 3 || 5500;
        setShippingCost(mockCost);
        setShippingOpen(false);
    };

    /* ── Render: Loading skeleton ──────────────────────────── */
    if (!isMounted) {
        return (
            <div className="cart-page">
                <div className="cart-container">
                    <div className="cart-header">
                        <div className="skeleton" style={{ width: 200, height: 32 }} />
                    </div>
                    <div className="cart-grid">
                        <div className="glass-panel cart-items-panel" style={{ padding: 24 }}>
                            {[1, 2, 3].map((i) => (
                                <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                                    <div className="skeleton" style={{ width: 80, height: 80, flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
                                        <div className="skeleton" style={{ width: '40%', height: 14 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="glass-panel cart-summary">
                            <div className="skeleton" style={{ width: '100%', height: 6, marginBottom: 24, borderRadius: 999 }} />
                            <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 12 }} />
                            <div className="skeleton" style={{ width: '100%', height: 16, marginBottom: 12 }} />
                            <div className="skeleton" style={{ width: '100%', height: 52, borderRadius: 12 }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Render: Empty state ───────────────────────────────── */
    if (items.length === 0) {
        return (
            <div className="cart-page">
                <div className="cart-container">
                    <div className="cart-header">
                        <h1>Carrito de compras</h1>
                        <Link href="/" className="cart-back-link">
                            <ArrowLeft size={16} strokeWidth={1.5} />
                            Seguir comprando
                        </Link>
                    </div>

                    <div className="cart-empty">
                        <div className="cart-empty-icon">
                            <ShoppingBag size={48} strokeWidth={1.2} />
                        </div>
                        <h2>Tu carrito está vacío</h2>
                        <p>
                            Descubrí nuestros últimos productos y encontrá lo que necesitás
                            para tu dispositivo.
                        </p>
                        <Link href="/" className="cart-empty-cta">
                            Volver a la Tienda
                            <ArrowRight size={16} strokeWidth={2} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Render: Active / Reward Unlocked ──────────────────── */
    return (
        <div className="cart-page">
            <div className="cart-container">
                {/* Header */}
                <div className="cart-header">
                    <h1>
                        Carrito de compras
                        <span className="cart-count-badge">{totalItems}</span>
                    </h1>
                    <Link href="/" className="cart-back-link">
                        <ArrowLeft size={16} strokeWidth={1.5} />
                        Seguir comprando
                    </Link>
                </div>

                <div className="cart-grid">
                    {/* ───── Left: Items List ───── */}
                    <div className="glass-panel cart-items-panel">
                        <div className="cart-items-panel-header">
                            <h2>{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</h2>
                            <button className="cart-clear-btn" onClick={clearCart}>
                                Vaciar carrito
                            </button>
                        </div>

                        {items.map((item) => {
                            const stock = getStock(item.product);
                            const isLowStock = stock > 0 && stock <= 3;
                            const atMaxStock = item.quantity >= stock;
                            const lineTotal = (Number(item.product.price) || 0) * item.quantity;

                            return (
                                <div className="cart-item" key={item.product.id}>
                                    {/* Image */}
                                    <div className="cart-item-image">
                                        {item.product.image_url ? (
                                            <img
                                                src={`http://localhost:3001${item.product.image_url}`}
                                                alt={item.product.model || item.product.name}
                                            />
                                        ) : (
                                            <ShoppingBag size={28} strokeWidth={1.2} className="placeholder-icon" />
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="cart-item-details">
                                        <Link href={`/product/${item.product.id}`}>
                                            <p className="cart-item-title">
                                                {item.product.model || item.product.name}
                                            </p>
                                        </Link>
                                        <p className="cart-item-variant">{item.product.brand}</p>

                                        {/* Stock warning */}
                                        {isLowStock && (
                                            <span className="cart-item-stock-warning">
                                                {stock === 0
                                                    ? 'Sin stock'
                                                    : `Quedan solo ${stock}`}
                                            </span>
                                        )}

                                        {atMaxStock && stock > 3 && (
                                            <span className="cart-item-stock-warning" style={{ color: 'var(--cart-text-secondary)' }}>
                                                Máximo disponible
                                            </span>
                                        )}

                                        {/* Quantity stepper */}
                                        <div style={{ marginTop: 8 }}>
                                            <div className="qty-stepper">
                                                <button
                                                    onClick={() => decreaseQuantity(item.product.id)}
                                                    aria-label="Disminuir cantidad"
                                                >
                                                    <Minus size={14} strokeWidth={2} />
                                                </button>
                                                <span className="qty-value">{item.quantity}</span>
                                                <button
                                                    onClick={() => increaseQuantity(item.product.id)}
                                                    disabled={atMaxStock}
                                                    aria-label="Aumentar cantidad"
                                                >
                                                    <Plus size={14} strokeWidth={2} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price + Delete */}
                                    <div className="cart-item-actions">
                                        <span className="cart-item-price">
                                            ${lineTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </span>
                                        <button
                                            className="cart-item-delete"
                                            onClick={() => removeFromCart(item.product.id)}
                                            aria-label="Eliminar producto"
                                        >
                                            <X size={16} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ───── Right: Order Summary Sidebar ───── */}
                    <div className="glass-panel cart-summary">
                        {/* ── Progress bar ── */}
                        <div className="discount-progress">
                            {isDiscountUnlocked ? (
                                <div className="unlocked-badge">
                                    <Sparkles size={14} strokeWidth={2} />
                                    {DISCOUNT_PERCENT}% OFF en tu compra
                                </div>
                            ) : (
                                <p className="discount-progress-text">
                                    Superá los{' '}
                                    <span className="highlight">
                                        ${DISCOUNT_THRESHOLD.toLocaleString('es-AR')}
                                    </span>{' '}
                                    y obtené {DISCOUNT_PERCENT}% OFF
                                </p>
                            )}
                            <div className="progress-track" style={{ marginTop: isDiscountUnlocked ? 12 : 0 }}>
                                <div
                                    className={`progress-fill${isDiscountUnlocked ? ' complete' : ''}`}
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>

                        {/* ── Summary rows ── */}
                        <div className="summary-rows">
                            <div className="summary-row">
                                <span className="label">Subtotal (sin envío)</span>
                                <span className="value">
                                    ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            {isDiscountUnlocked && (
                                <div className="summary-row discount">
                                    <span className="label">{DISCOUNT_PERCENT}% OFF en tu compra</span>
                                    <span className="value">
                                        −${discountAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}

                            <div className="summary-row shipping">
                                <span className="label">
                                    Medios de envío
                                </span>
                                {shippingCost !== null ? (
                                    <span className="value calculated">
                                        ${shippingCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                ) : (
                                    <button
                                        className={`shipping-toggle${shippingOpen ? ' open' : ''}`}
                                        onClick={() => setShippingOpen(!shippingOpen)}
                                    >
                                        Calcular
                                        <ChevronDown size={14} strokeWidth={2} />
                                    </button>
                                )}
                            </div>

                            {/* ── Shipping accordion ── */}
                            <div className={`shipping-accordion${shippingOpen ? ' open' : ''}`}>
                                <div className="shipping-form">
                                    <select
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                    >
                                        <option value="AR">Argentina</option>
                                        <option value="UY">Uruguay</option>
                                        <option value="CL">Chile</option>
                                        <option value="BR">Brasil</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Tu código postal"
                                        value={zipCode}
                                        onChange={(e) => setZipCode(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleShippingUpdate()}
                                    />
                                    <button
                                        className="shipping-update-btn"
                                        onClick={handleShippingUpdate}
                                    >
                                        Calcular
                                    </button>
                                    <a
                                        href="https://www.correoargentino.com.ar/formularios/cpa"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            fontSize: 12,
                                            color: 'var(--cart-primary)',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        No sé mi código postal
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* ── Total ── */}
                        <div className="summary-total">
                            <span className="label">Total</span>
                            <span className="value">
                                {isDiscountUnlocked && (
                                    <span className="old-price">
                                        ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                )}
                                ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* ── Checkout ── */}
                        <Link href="/checkout" className="checkout-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            Iniciar compra
                            <ArrowRight size={16} strokeWidth={2} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
