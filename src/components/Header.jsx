"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useCartStore } from '@/lib/store/useCartStore';
import { useFavoritesStore } from '@/lib/store/useFavoritesStore';
import { useSearchStore } from '@/lib/store/useSearchStore';
import {
    ShoppingBag,
    X,
    Plus,
    Minus,
    ChevronDown,
    ArrowRight,
    Sparkles,
    Package,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import CartFeedback from './CartFeedback';

const DISCOUNT_THRESHOLD = 1_000_000;
const DISCOUNT_PCT = 5;

function getStock(product) {
    if (!product) return 0;
    if (product.stock_online && typeof product.stock_online.quantity === 'number')
        return product.stock_online.quantity;
    if (typeof product.stock_online === 'number') return product.stock_online;
    if (typeof product.stockOnline === 'number') return product.stockOnline;
    return 0;
}

export default function Header() {
    const { isAdminOrEmployee, user, logout } = useAuthStore();
    const {
        items, getTotalItems, getTotalPrice,
        increaseQuantity, decreaseQuantity, removeFromCart, clearCart,
        lastAdded
    } = useCartStore();
    const { getTotalFavorites } = useFavoritesStore();
    const { searchQuery, setSearchQuery } = useSearchStore();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const router = useRouter();

    // Hydration mismatch fix
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Animation trigger for cart icon
    const [shouldBounce, setShouldBounce] = useState(false);
    const processedAddedRef = useRef(lastAdded);

    useEffect(() => {
        if (lastAdded > 0 && lastAdded !== processedAddedRef.current) {
            processedAddedRef.current = lastAdded;
            setShouldBounce(true);
            const timer = setTimeout(() => setShouldBounce(false), 500);
            return () => clearTimeout(timer);
        }
    }, [lastAdded]);

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isCartOpen]);

    const cartItemsCount = getTotalItems();
    const cartTotal = getTotalPrice();
    const favoritesCount = getTotalFavorites();

    // Discount progress (5% off at $1M)
    const progressPct = useMemo(
        () => Math.min((cartTotal / DISCOUNT_THRESHOLD) * 100, 100),
        [cartTotal],
    );
    const hasDiscount = cartTotal >= DISCOUNT_THRESHOLD;
    const remaining = DISCOUNT_THRESHOLD - cartTotal;
    const discountAmount = hasDiscount ? cartTotal * (DISCOUNT_PCT / 100) : 0;
    const total = cartTotal - discountAmount;

    return (
        <>
            <div className="bg-primary text-white text-xs py-1">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <span className="flex items-center"><span className="material-icons text-sm mr-1">phone</span> +54 11 1234 5678</span>
                        <span className="flex items-center"><span className="material-icons text-sm mr-1">email</span> contacto@mitienda.com</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link className="hover:underline" href="#">Mi Cuenta</Link>
                        <Link className="hover:underline" href="#">Rastrear Pedido</Link>
                        <span className="cursor-pointer">ARS $</span>
                    </div>
                </div>
            </div>

            <header className="bg-surface-light dark:bg-surface-dark shadow-sm sticky top-0 z-40 transition-colors duration-200">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link className="flex items-center gap-3" href="/">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 flex-shrink-0">
                            <span className="material-icons text-gray-400">store</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-primary leading-none tracking-tight">Tu</span>
                            <span className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-none">Tienda</span>
                        </div>
                    </Link>
                    <div className="flex-1 max-w-2xl mx-8 hidden md:block">
                        <div className="relative">
                            <input
                                className="w-full border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-full py-2.5 pl-5 pr-12 focus:outline-none focus:border-primary focus:ring-0 text-sm transition-colors"
                                placeholder="Buscar marca, modelo..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="absolute right-0 top-0 h-full w-12 flex items-center justify-center bg-primary text-white rounded-r-full hover:bg-primary-hover transition-colors">
                                <span className="material-icons">search</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-300 min-h-[40px]">
                        {!isMounted ? (
                            <div className="flex items-center space-x-6 opacity-30 animate-pulse">
                                <span className="material-icons text-3xl">account_circle</span>
                                <span className="material-icons text-3xl">favorite_border</span>
                                <span className="material-icons text-3xl">shopping_cart</span>
                            </div>
                        ) : (
                            <>
                                {user ? (
                                    <div className="relative pr-4 border-r border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                            className="flex items-center gap-3 hover:text-primary transition-colors focus:outline-none"
                                        >
                                            <span className="material-icons text-3xl">account_circle</span>
                                            <div className="hidden lg:flex flex-col text-xs items-start">
                                                <span className="font-bold text-gray-800 dark:text-white line-clamp-1 w-24 text-left" title={user.first_name}>
                                                    {user.first_name}
                                                </span>
                                                <span className="text-gray-500 text-[10px] uppercase tracking-wide flex items-center gap-1 mt-0.5">
                                                    Mi Cuenta <span className="material-icons text-[10px]">expand_more</span>
                                                </span>
                                            </div>
                                        </button>

                                        {isProfileMenuOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)}></div>
                                                <div className="absolute right-4 top-full mt-3 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                                        <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{user.first_name} {user.last_name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                                    </div>
                                                    <div className="p-2 space-y-1">
                                                        <Link href="#" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors w-full text-left">
                                                            <span className="material-icons text-[18px]">person</span> Mi Perfil
                                                        </Link>
                                                        <Link href="#" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors w-full text-left">
                                                            <span className="material-icons text-[18px]">favorite_border</span> Favoritos
                                                        </Link>

                                                        {isAdminOrEmployee() && (
                                                            <Link href="/dashboard" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-primary font-bold hover:bg-primary/10 rounded-lg transition-colors w-full text-left">
                                                                <span className="material-icons text-[18px]">dashboard</span> Panel de Control
                                                            </Link>
                                                        )}
                                                    </div>
                                                    <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                                                        <button onClick={() => { setIsProfileMenuOpen(false); logout(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors w-full text-left font-medium">
                                                            <span className="material-icons text-[18px]">logout</span> Cerrar Sesión
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <Link href="/login" className="flex items-center gap-2 hover:text-primary transition-colors group cursor-pointer pr-4 border-r border-gray-200 dark:border-gray-700">
                                        <span className="material-icons text-3xl group-hover:scale-110 transition-transform">account_circle</span>
                                        <div className="hidden lg:flex flex-col text-xs items-start">
                                            <span className="font-bold text-gray-800 dark:text-white">Ingresar</span>
                                            <span className="text-gray-400">o Registrarse</span>
                                        </div>
                                    </Link>
                                )}

                                <Link href="/favorites" className="relative hover:text-primary transition-colors focus:outline-none">
                                    <span className="material-icons text-3xl">favorite_border</span>
                                    {favoritesCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-[18px] w-[18px] flex items-center justify-center shadow-sm">
                                            {favoritesCount}
                                        </span>
                                    )}
                                </Link>
                                {/* ── Cart Button ─────────────────────── */}
                                <button
                                    onClick={() => setIsCartOpen(true)}
                                    className={`relative hover:text-primary transition-all flex items-center gap-2 focus:outline-none ${shouldBounce ? 'animate-bounce-subtle' : ''}`}
                                >
                                    <style jsx>{`
                                        @keyframes bounce-subtle {
                                            0%, 100% { transform: scale(1); }
                                            50% { transform: scale(1.15); }
                                        }
                                        .animate-bounce-subtle {
                                            animation: bounce-subtle 0.5s ease;
                                        }
                                    `}</style>
                                    <div className="relative">
                                        <span className="material-icons text-3xl">shopping_cart</span>
                                        {cartItemsCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                                {cartItemsCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="hidden lg:flex flex-col text-xs items-start">
                                        <span className="text-gray-400">Total</span>
                                        <span className="font-bold text-gray-800 dark:text-white leading-none">
                                            ${Number(cartTotal).toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                </button>

                                {/* ── Glassmorphism Cart Drawer ────────── */}
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-50 transition-all duration-300"
                                    style={{
                                        pointerEvents: isCartOpen ? 'auto' : 'none',
                                        background: isCartOpen ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0)',
                                        backdropFilter: isCartOpen ? 'blur(4px)' : 'blur(0px)',
                                        WebkitBackdropFilter: isCartOpen ? 'blur(4px)' : 'blur(0px)',
                                    }}
                                    onClick={() => setIsCartOpen(false)}
                                />

                                {/* Drawer Panel */}
                                <div
                                    className="fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-350 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                                    style={{
                                        width: '440px',
                                        maxWidth: '100vw',
                                        transform: isCartOpen ? 'translateX(0)' : 'translateX(100%)',
                                        background: 'rgba(255,255,255,0.82)',
                                        backdropFilter: 'blur(24px) saturate(180%)',
                                        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                                        borderLeft: '1px solid rgba(0,0,0,0.06)',
                                        boxShadow: isCartOpen ? '-8px 0 40px rgba(0,0,0,0.08)' : 'none',
                                        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
                                    }}
                                >
                                    {/* ── Drawer Header ── */}
                                    <div style={{
                                        padding: '20px 24px',
                                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexShrink: 0,
                                    }}>
                                        <h3 style={{
                                            fontFamily: "'Space Grotesk', sans-serif",
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: '#1D1D1F',
                                            margin: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                        }}>
                                            Carrito de compras
                                            {cartItemsCount > 0 && (
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    minWidth: '24px',
                                                    height: '24px',
                                                    padding: '0 7px',
                                                    borderRadius: '999px',
                                                    background: '#FF5722',
                                                    color: 'white',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    fontFamily: "'Space Grotesk', sans-serif",
                                                }}>{cartItemsCount}</span>
                                            )}
                                        </h3>
                                        <button
                                            onClick={() => setIsCartOpen(false)}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: 'none',
                                                borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.04)',
                                                cursor: 'pointer',
                                                color: '#86868B',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = '#1D1D1F'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#86868B'; }}
                                        >
                                            <X size={18} strokeWidth={2} />
                                        </button>
                                    </div>

                                    {/* ── Empty State ── */}
                                    {items.length === 0 ? (
                                        <div style={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '40px 24px',
                                            textAlign: 'center',
                                        }}>
                                            <div style={{
                                                width: '100px',
                                                height: '100px',
                                                borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.9)',
                                                border: '1px solid rgba(0,0,0,0.06)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: '20px',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                            }}>
                                                <ShoppingBag size={40} strokeWidth={1.2} color="#AEAEB2" />
                                            </div>
                                            <p style={{
                                                fontFamily: "'Space Grotesk', sans-serif",
                                                fontSize: '18px',
                                                fontWeight: 700,
                                                color: '#1D1D1F',
                                                margin: '0 0 8px',
                                            }}>Tu carrito está vacío</p>
                                            <p style={{
                                                fontSize: '14px',
                                                color: '#86868B',
                                                margin: '0 0 24px',
                                                lineHeight: 1.5,
                                                maxWidth: '260px',
                                            }}>Explorá nuestros productos y encontrá lo que necesitás.</p>
                                            <Link
                                                href="/"
                                                onClick={() => setIsCartOpen(false)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '12px 28px',
                                                    borderRadius: '12px',
                                                    background: '#1D1D1F',
                                                    color: 'white',
                                                    fontFamily: "'Space Grotesk', sans-serif",
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    textDecoration: 'none',
                                                    transition: 'all 0.25s',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#FF5722'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,87,34,0.3)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = '#1D1D1F'; e.currentTarget.style.boxShadow = 'none'; }}
                                            >
                                                Volver a la Tienda
                                                <ArrowRight size={14} strokeWidth={2} />
                                            </Link>
                                        </div>
                                    ) : (
                                        <>
                                            {/* ── Items List (scrollable) ── */}
                                            <div style={{
                                                flex: 1,
                                                overflowY: 'auto',
                                                padding: '0',
                                            }}>
                                                {/* Clear cart row */}
                                                <div style={{
                                                    padding: '10px 24px',
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                }}>
                                                    <button
                                                        onClick={clearCart}
                                                        style={{
                                                            fontSize: '12px',
                                                            fontWeight: 500,
                                                            color: '#86868B',
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            transition: 'all 0.2s',
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.color = '#FF3B30'; e.currentTarget.style.background = 'rgba(255,59,48,0.06)'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.color = '#86868B'; e.currentTarget.style.background = 'none'; }}
                                                    >
                                                        Vaciar carrito
                                                    </button>
                                                </div>

                                                {items.map((item) => {
                                                    const stock = getStock(item.product);
                                                    const isLowStock = stock > 0 && stock <= 3;
                                                    const atMaxStock = item.quantity >= stock;
                                                    const lineTotal = (Number(item.product.price) || 0) * item.quantity;

                                                    return (
                                                        <div
                                                            key={item.product.id}
                                                            className="group"
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '14px',
                                                                padding: '14px 24px',
                                                                borderBottom: '1px solid rgba(0,0,0,0.04)',
                                                                transition: 'background 0.2s',
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            {/* Image */}
                                                            <div style={{
                                                                width: '68px',
                                                                height: '68px',
                                                                borderRadius: '10px',
                                                                background: '#F2F2F7',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                overflow: 'hidden',
                                                                flexShrink: 0,
                                                            }}>
                                                                {item.product.image_url ? (
                                                                    <img
                                                                        src={`http://localhost:3001${item.product.image_url}`}
                                                                        alt={item.product.model}
                                                                        style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }}
                                                                    />
                                                                ) : (
                                                                    <Package size={24} strokeWidth={1.2} color="#AEAEB2" />
                                                                )}
                                                            </div>

                                                            {/* Details */}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <Link href={`/product/${item.product.id}`} onClick={() => setIsCartOpen(false)}>
                                                                    <p style={{
                                                                        fontFamily: "'Space Grotesk', sans-serif",
                                                                        fontSize: '14px',
                                                                        fontWeight: 600,
                                                                        color: '#1D1D1F',
                                                                        margin: '0 0 2px',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                    }}>{item.product.model || item.product.name}</p>
                                                                </Link>
                                                                <p style={{ fontSize: '12px', color: '#86868B', margin: '0 0 6px' }}>
                                                                    {item.product.brand}
                                                                </p>

                                                                {isLowStock && (
                                                                    <p style={{
                                                                        fontSize: '11px',
                                                                        fontWeight: 500,
                                                                        color: '#FF3B30',
                                                                        margin: '0 0 6px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                    }}>
                                                                        <span style={{
                                                                            width: '5px', height: '5px',
                                                                            borderRadius: '50%', background: '#FF3B30',
                                                                            display: 'inline-block',
                                                                        }} />
                                                                        {stock === 0 ? 'Sin stock' : `Quedan solo ${stock}`}
                                                                    </p>
                                                                )}

                                                                {/* Quantity Stepper */}
                                                                <div style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                                    borderRadius: '8px',
                                                                    overflow: 'hidden',
                                                                    height: '30px',
                                                                    background: 'white',
                                                                }}>
                                                                    <button
                                                                        onClick={() => decreaseQuantity(item.product.id)}
                                                                        style={{
                                                                            width: '30px', height: '100%',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                                            color: '#1D1D1F', transition: 'background 0.15s',
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#F2F2F7'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                                    >
                                                                        <Minus size={12} strokeWidth={2} />
                                                                    </button>
                                                                    <span style={{
                                                                        width: '32px', textAlign: 'center',
                                                                        fontFamily: "'Space Grotesk', sans-serif",
                                                                        fontSize: '13px', fontWeight: 600,
                                                                        color: '#1D1D1F',
                                                                        borderLeft: '1px solid rgba(0,0,0,0.06)',
                                                                        borderRight: '1px solid rgba(0,0,0,0.06)',
                                                                        lineHeight: '30px',
                                                                        userSelect: 'none',
                                                                    }}>{item.quantity}</span>
                                                                    <button
                                                                        onClick={() => increaseQuantity(item.product.id)}
                                                                        disabled={atMaxStock}
                                                                        style={{
                                                                            width: '30px', height: '100%',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            background: 'none', border: 'none', cursor: atMaxStock ? 'not-allowed' : 'pointer',
                                                                            color: atMaxStock ? '#AEAEB2' : '#1D1D1F', transition: 'background 0.15s',
                                                                        }}
                                                                        onMouseEnter={(e) => { if (!atMaxStock) e.currentTarget.style.background = '#F2F2F7'; }}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                                    >
                                                                        <Plus size={12} strokeWidth={2} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Price + Delete */}
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                                                                <span style={{
                                                                    fontFamily: "'Space Grotesk', sans-serif",
                                                                    fontSize: '14px',
                                                                    fontWeight: 700,
                                                                    color: '#1D1D1F',
                                                                    whiteSpace: 'nowrap',
                                                                }}>
                                                                    ${lineTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                                </span>
                                                                <button
                                                                    onClick={() => removeFromCart(item.product.id)}
                                                                    className="opacity-0 group-hover:opacity-100"
                                                                    style={{
                                                                        width: '26px', height: '26px',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        borderRadius: '50%', background: 'none', border: 'none',
                                                                        cursor: 'pointer', color: '#AEAEB2', transition: 'all 0.15s',
                                                                    }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,59,48,0.08)'; e.currentTarget.style.color = '#FF3B30'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#AEAEB2'; }}
                                                                    title="Eliminar"
                                                                >
                                                                    <X size={14} strokeWidth={1.5} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* ── Footer (Summary) ── */}
                                            <div style={{
                                                flexShrink: 0,
                                                borderTop: '1px solid rgba(0,0,0,0.06)',
                                                padding: '18px 24px 24px',
                                                background: 'rgba(255,255,255,0.6)',
                                            }}>
                                                {/* Discount progress */}
                                                <div style={{ marginBottom: '16px' }}>
                                                    {hasDiscount ? (
                                                        <div style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '5px 12px',
                                                            borderRadius: '999px',
                                                            background: 'rgba(255,87,34,0.08)',
                                                            color: '#FF5722',
                                                            fontFamily: "'Space Grotesk', sans-serif",
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                        }}>
                                                            <Sparkles size={14} strokeWidth={2} />
                                                            {DISCOUNT_PCT}% OFF en tu compra
                                                        </div>
                                                    ) : (
                                                        <p style={{
                                                            fontSize: '12px',
                                                            fontWeight: 500,
                                                            color: '#86868B',
                                                            margin: '0 0 8px',
                                                        }}>
                                                            Sumá{' '}
                                                            <span style={{ color: '#FF5722', fontWeight: 700 }}>
                                                                ${remaining.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                            {' '}más para obtener {DISCOUNT_PCT}% OFF
                                                        </p>
                                                    )}
                                                    <div style={{
                                                        width: '100%', height: '5px',
                                                        background: '#F2F2F7', borderRadius: '999px',
                                                        overflow: 'hidden', marginTop: hasDiscount ? '8px' : '0',
                                                    }}>
                                                        <div style={{
                                                            height: '100%',
                                                            width: `${progressPct}%`,
                                                            background: hasDiscount
                                                                ? '#FF5722'
                                                                : 'linear-gradient(90deg, #FF8A65, #FF5722)',
                                                            borderRadius: '999px',
                                                            transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                            boxShadow: hasDiscount ? '0 0 8px rgba(255,87,34,0.3)' : 'none',
                                                        }} />
                                                    </div>
                                                </div>

                                                {/* Summary rows */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                        <span style={{ color: '#86868B' }}>Subtotal</span>
                                                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: '#1D1D1F' }}>
                                                            ${cartTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>

                                                    {hasDiscount && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                            <span style={{ color: '#FF5722', fontWeight: 500 }}>{DISCOUNT_PCT}% OFF en tu compra</span>
                                                            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: '#FF5722' }}>
                                                                -${discountAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Divider */}
                                                <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '0 0 14px' }} />



                                                {/* Total row with struck-through original */}
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'baseline',
                                                    marginBottom: '18px',
                                                }}>
                                                    <span style={{
                                                        fontFamily: "'Space Grotesk', sans-serif",
                                                        fontSize: '15px',
                                                        fontWeight: 600,
                                                        color: '#1D1D1F',
                                                    }}>Total</span>
                                                    <div style={{ textAlign: 'right' }}>
                                                        {hasDiscount && (
                                                            <span style={{
                                                                fontFamily: "'Space Grotesk', sans-serif",
                                                                fontSize: '13px',
                                                                color: '#AEAEB2',
                                                                textDecoration: 'line-through',
                                                                marginRight: '8px',
                                                            }}>
                                                                ${cartTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        )}
                                                        <span style={{
                                                            fontFamily: "'Space Grotesk', sans-serif",
                                                            fontSize: '22px',
                                                            fontWeight: 700,
                                                            color: '#1D1D1F',
                                                        }}>
                                                            ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Checkout CTA */}
                                                <button
                                                    onClick={() => {
                                                        setIsCartOpen(false);
                                                        router.push('/checkout');
                                                    }}
                                                    style={{
                                                        width: '100%', height: '48px',
                                                        border: 'none', borderRadius: '12px',
                                                        background: '#1D1D1F', color: 'white',
                                                        fontFamily: "'Space Grotesk', sans-serif",
                                                        fontSize: '15px', fontWeight: 600,
                                                        cursor: 'pointer', transition: 'all 0.25s',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        gap: '8px', letterSpacing: '0.02em',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = '#FF5722';
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                        e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,87,34,0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = '#1D1D1F';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    Iniciar compra
                                                    <ArrowRight size={16} strokeWidth={2} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <nav className="border-t border-gray-100 dark:border-gray-800 hidden md:block">
                    <div className="container mx-auto px-4">
                        <ul className="flex space-x-8 text-sm font-bold text-gray-600 dark:text-gray-300">
                            <li><Link href="/" className="block py-3 hover:text-primary border-b-2 border-transparent hover:border-primary transition-colors">Inicio</Link></li>
                            <li><Link href="#" className="block py-3 hover:text-primary border-b-2 border-transparent hover:border-primary transition-colors">Ofertas</Link></li>
                            <li><Link href="#" className="block py-3 hover:text-primary border-b-2 border-transparent hover:border-primary transition-colors">Nuevos Ingresos</Link></li>
                            <li>
                                {user?.role === 'Wholesaler' || isAdminOrEmployee() ? (
                                    <Link href="/mayorista" className="block py-3 text-secondary font-black border-b-2 border-transparent hover:border-secondary transition-colors">Mayorista</Link>
                                ) : (
                                    <Link
                                        href="/mayorista"
                                        className="block py-3 text-secondary font-black border-b-2 border-transparent hover:border-secondary transition-colors flex items-center gap-1"
                                    >
                                        Mayorista <span className="material-icons text-[14px]">lock</span>
                                    </Link>
                                )}
                            </li>
                            <li><a href="https://wa.me/541112345678" target="_blank" rel="noopener noreferrer" className="block py-3 hover:text-primary border-b-2 border-transparent hover:border-primary transition-colors">Contacto</a></li>
                        </ul>
                    </div>
                </nav>
            </header>
            <CartFeedback />
        </>
    );
}
