"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCartStore } from '@/lib/store/useCartStore';
import { useFavoritesStore } from '@/lib/store/useFavoritesStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import EditProductModal from '@/components/EditProductModal';
import StockUpdateModal from '@/components/StockUpdateModal';
import PhysicalSaleModal from '@/components/PhysicalSaleModal';
import DeleteProductModal from '@/components/DeleteProductModal';

export default function ProductDetailPage() {
    const params = useParams();
    const productId = params?.id;
    const { addToCart } = useCartStore();
    const { isFavorite, toggleFavorite } = useFavoritesStore();
    const { isAdminOrEmployee } = useAuthStore();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    // Management Modals State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const fetchProduct = async () => {
        if (!productId) return;
        try {
            const res = await fetch(`http://localhost:3001/api/products/${productId}`);
            const data = await res.json();
            if (data.success) {
                setProduct(data.data);
            } else {
                setError('Producto no encontrado');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        fetchProduct();
    }, [productId]);

    if (loading) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen font-body flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="material-icons animate-spin text-4xl text-primary mb-4">autorenew</span>
                    <p className="text-gray-500">Cargando detalles...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen font-body flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <span className="material-icons text-6xl text-gray-400 mb-4">error_outline</span>
                    <h1 className="text-2xl font-bold mb-2">Oops!</h1>
                    <p className="text-gray-500">{error || 'El producto que buscas no existe.'}</p>
                </div>
                <Footer />
            </div>
        );
    }

    const hasOnlineStock = (product.stock_online?.quantity || 0) > 0;
    const hasPhysicalStock = (product.stock_physical?.quantity || 0) > 0;
    const hasAnyStock = hasOnlineStock || hasPhysicalStock;

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-body min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8">
                {/* Breadcrumbs */}
                <div className="text-sm text-gray-500 mb-8 flex items-center gap-2">
                    <a href="/" className="hover:text-primary transition-colors">Inicio</a>
                    <span className="material-icons text-xs">chevron_right</span>
                    <span>{product.category}</span>
                    <span className="material-icons text-xs">chevron_right</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{product.brand} {product.model}</span>
                </div>

                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">

                        {/* Left Column: Image and Specs */}
                        <div className="flex flex-col bg-gray-50 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-800">
                            {/* Image Gallery area */}
                            <div className="p-8 flex items-center justify-center min-h-[400px]">
                                {product.image_url ? (
                                    <img
                                        src={`http://localhost:3001${product.image_url}`}
                                        alt={product.model}
                                        className="max-w-full max-h-[500px] object-contain mix-blend-multiply dark:mix-blend-normal hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                                    />
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <span className="material-icons text-9xl block mb-4 opacity-50">image</span>
                                        <p>Sin imagen disponible</p>
                                    </div>
                                )}
                            </div>

                            {/* Product Specifications */}
                            {product.features && product.features.length > 0 && (
                                <div className="px-8 pb-8 animate-in fade-in slide-in-from-bottom-2">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <span className="material-icons text-primary text-xl">memory</span>
                                        Especificaciones Técnicas
                                    </h2>
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                        {product.features.map((feature, idx) => (
                                            <div key={idx} className={`flex flex-col sm:flex-row p-4 ${idx !== product.features.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}>
                                                <span className="text-xs font-bold text-gray-500 w-full sm:w-1/3 mb-1 sm:mb-0 uppercase tracking-widest">{feature.name}</span>
                                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">{feature.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Product Info area (Right Column) */}
                        <div className="p-8 md:p-12 flex flex-col">
                            <div className="mb-2 flex items-center gap-2">
                                <span className="text-xs uppercase tracking-widest font-bold text-gray-500">{product.brand}</span>
                                {product.compatibility && (
                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wide">
                                        Para: {product.compatibility}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-4">
                                {product.model}
                            </h1>

                            <div className="text-4xl font-black text-primary mb-6 flex items-baseline gap-2">
                                <span>${Number(product.price).toLocaleString('es-AR')}</span>
                            </div>

                            {/* Description Box */}
                            <div className="prose prose-sm dark:prose-invert mb-8 text-gray-600 dark:text-gray-400">
                                {product.description ? (
                                    <div className="whitespace-pre-wrap">{product.description}</div>
                                ) : (
                                    <p className="italic">Este producto no cuenta con una descripción detallada.</p>
                                )}
                            </div>

                            {/* Stock and Actions */}
                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex flex-col gap-2 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center gap-2 text-sm font-bold ${hasOnlineStock ? 'text-green-600' : 'text-red-500'}`}>
                                            <span className="material-icons text-lg">{hasOnlineStock ? 'cloud_done' : 'cloud_off'}</span>
                                            {hasOnlineStock ? 'Stock Online Disponible' : 'Sin Stock Online'}
                                        </div>
                                        {hasOnlineStock && (
                                            <div className="text-xs text-gray-500 font-medium bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                                {product.stock_online.quantity} unid.
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center gap-2 text-sm font-bold ${hasPhysicalStock ? 'text-indigo-600' : 'text-gray-400'}`}>
                                            <span className="material-icons text-lg">{hasPhysicalStock ? 'storefront' : 'no_meeting_room'}</span>
                                            {hasPhysicalStock ? 'Disponible en Local' : 'No disponible en Local'}
                                        </div>
                                        {hasPhysicalStock && (
                                            <div className="text-xs text-gray-500 font-medium bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                                {product.stock_physical.quantity} unid.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {!isMounted || !isAdminOrEmployee() ? (
                                        <>
                                            {/* Comprar Ahora — primary CTA */}
                                            <button
                                                disabled={(() => {
                                                    const s = product.stock_online;
                                                    return !((s && typeof s.quantity === 'number') ? s.quantity > 0 : (typeof s === 'number' ? s > 0 : (product.stockOnline > 0)));
                                                })()}
                                                onClick={() => {
                                                    addToCart(product);
                                                    router.push('/checkout');
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '16px 24px',
                                                    border: 'none',
                                                    borderRadius: '14px',
                                                    background: (() => {
                                                        const s = product.stock_online;
                                                        const hasStock = (s && typeof s.quantity === 'number') ? s.quantity > 0 : (typeof s === 'number' ? s > 0 : (product.stockOnline > 0));
                                                        return hasStock ? '#1D1D1F' : '#D1D1D6';
                                                    })(),
                                                    color: 'white',
                                                    fontFamily: "'Space Grotesk', sans-serif",
                                                    fontSize: '16px',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.02em',
                                                    cursor: (() => {
                                                        const s = product.stock_online;
                                                        const hasStock = (s && typeof s.quantity === 'number') ? s.quantity > 0 : (typeof s === 'number' ? s > 0 : (product.stockOnline > 0));
                                                        return hasStock ? 'pointer' : 'not-allowed';
                                                    })(),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '10px',
                                                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!e.currentTarget.disabled) {
                                                        e.currentTarget.style.background = '#FF5722';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,87,34,0.35)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!e.currentTarget.disabled) {
                                                        e.currentTarget.style.background = '#1D1D1F';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                                                    }
                                                }}
                                            >
                                                <span className="material-icons" style={{ fontSize: '20px' }}>
                                                    {(() => {
                                                        const s = product.stock_online;
                                                        const hasStock = (s && typeof s.quantity === 'number') ? s.quantity > 0 : (typeof s === 'number' ? s > 0 : (product.stockOnline > 0));
                                                        return hasStock ? 'bolt' : 'block';
                                                    })()}
                                                </span>
                                                {(() => {
                                                    const s = product.stock_online;
                                                    const hasStock = (s && typeof s.quantity === 'number') ? s.quantity > 0 : (typeof s === 'number' ? s > 0 : (product.stockOnline > 0));
                                                    return hasStock ? 'Comprar Ahora' : 'Sin Stock Online';
                                                })()}
                                            </button>

                                            {/* Añadir al Carrito + Favoritos */}
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <button
                                                    disabled={(() => {
                                                        const s = product.stock_online;
                                                        return !((s && typeof s.quantity === 'number') ? s.quantity > 0 : (typeof s === 'number' ? s > 0 : (product.stockOnline > 0)));
                                                    })()}
                                                    onClick={() => addToCart(product)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '14px 20px',
                                                        borderRadius: '14px',
                                                        background: 'rgba(255,255,255,0.7)',
                                                        backdropFilter: 'blur(16px) saturate(180%)',
                                                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                                                        border: '1px solid rgba(0,0,0,0.08)',
                                                        color: '#1D1D1F',
                                                        fontFamily: "'Space Grotesk', sans-serif",
                                                        fontSize: '15px',
                                                        fontWeight: 600,
                                                        cursor: (() => {
                                                            const s = product.stock_online;
                                                            const hasStock = (s && typeof s.quantity === 'number') ? s.quantity > 0 : (typeof s === 'number' ? s > 0 : (product.stockOnline > 0));
                                                            return hasStock ? 'pointer' : 'not-allowed';
                                                        })(),
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!e.currentTarget.disabled) {
                                                            e.currentTarget.style.background = 'rgba(255,255,255,0.92)';
                                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                                                            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!e.currentTarget.disabled) {
                                                            e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                                            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)';
                                                        }
                                                    }}
                                                >
                                                    <span className="material-icons" style={{ fontSize: '18px' }}>
                                                        {(() => {
                                                            const s = product.stock_online;
                                                            const hasStock = (s && typeof s.quantity === 'number') ? s.quantity > 0 : (typeof s === 'number' ? s > 0 : (product.stockOnline > 0));
                                                            return hasStock ? 'shopping_cart' : 'block';
                                                        })()}
                                                    </span>
                                                    Añadir al Carrito
                                                </button>
                                                <button
                                                    onClick={() => toggleFavorite(product)}
                                                    style={{
                                                        width: '54px',
                                                        height: '54px',
                                                        borderRadius: '14px',
                                                        background: isFavorite(product.id)
                                                            ? 'rgba(255,59,48,0.06)'
                                                            : 'rgba(255,255,255,0.7)',
                                                        backdropFilter: 'blur(16px) saturate(180%)',
                                                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                                                        border: isFavorite(product.id)
                                                            ? '1.5px solid rgba(255,59,48,0.3)'
                                                            : '1px solid rgba(0,0,0,0.08)',
                                                        color: isFavorite(product.id) ? '#FF3B30' : '#AEAEB2',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                        flexShrink: 0,
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
                                                        if (!isFavorite(product.id)) e.currentTarget.style.color = '#FF3B30';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                        if (!isFavorite(product.id)) e.currentTarget.style.color = '#AEAEB2';
                                                    }}
                                                >
                                                    <span className="material-icons" style={{ fontSize: '22px' }}>
                                                        {isFavorite(product.id) ? 'favorite' : 'favorite_border'}
                                                    </span>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setIsEditModalOpen(true)}
                                                className="flex items-center justify-center gap-2 bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white py-4 rounded-xl font-bold transition-all shadow-sm"
                                            >
                                                <span className="material-icons">edit</span>
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => setIsStockModalOpen(true)}
                                                className="flex items-center justify-center gap-2 bg-indigo-100 dark:bg-indigo-900/40 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white py-4 rounded-xl font-bold transition-all shadow-sm"
                                            >
                                                <span className="material-icons">inventory</span>
                                                Stock
                                            </button>
                                            <button
                                                onClick={() => setIsSaleModalOpen(true)}
                                                className="flex items-center justify-center gap-2 bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white py-4 rounded-xl font-bold transition-all shadow-sm"
                                            >
                                                <span className="material-icons">point_of_sale</span>
                                                Venta Física
                                            </button>
                                            <button
                                                onClick={() => setIsDeleteModalOpen(true)}
                                                className="flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/40 hover:bg-red-600 dark:hover:bg-red-600 text-red-700 dark:text-red-300 hover:text-white py-4 rounded-xl font-bold transition-all shadow-sm"
                                            >
                                                <span className="material-icons">delete_forever</span>
                                                Eliminar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <EditProductModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                product={product}
                onProductUpdated={() => fetchProduct()}
            />

            <StockUpdateModal
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
                product={product}
                onSuccess={() => fetchProduct()}
            />

            <PhysicalSaleModal
                isOpen={isSaleModalOpen}
                onClose={() => setIsSaleModalOpen(false)}
                product={product}
                onSuccess={() => fetchProduct()}
            />

            <DeleteProductModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                product={product}
                onSuccess={() => {
                    // Navigate to root after successful deletion
                    window.location.href = '/';
                }}
            />
        </div>
    );
}
