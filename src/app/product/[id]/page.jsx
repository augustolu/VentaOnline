"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCartStore } from '@/lib/store/useCartStore';

export default function ProductDetailPage() {
    const params = useParams();
    const productId = params?.id;
    const { addToCart } = useCartStore();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!productId) return;

        const fetchProduct = async () => {
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

    const hasStock = (product.stock_online?.quantity > 0) || (product.stock_physical?.quantity > 0);

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

                        {/* Image Gallery area */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-8 flex items-center justify-center min-h-[400px]">
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

                        {/* Product Info area */}
                        <div className="p-8 md:p-12 flex flex-col border-l border-gray-100 dark:border-gray-800">
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
                            <div className="mt-auto pt-8 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`flex items-center gap-2 text-sm font-bold ${hasStock ? 'text-green-600' : 'text-red-500'}`}>
                                        <span className="material-icons">{hasStock ? 'check_circle' : 'cancel'}</span>
                                        {hasStock ? 'Stock Disponible' : 'Sin Stock Temporalmente'}
                                    </div>
                                    {hasStock && (
                                        <div className="text-xs text-gray-500">
                                            ({(product.stock_online?.quantity || 0) + (product.stock_physical?.quantity || 0)} unidades)
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        disabled={!hasStock}
                                        onClick={() => addToCart(product)}
                                        className="flex-1 bg-primary hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons">shopping_cart</span>
                                        Añadir al Carrito
                                    </button>
                                    <button className="w-14 h-14 border-2 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-500 rounded-xl flex items-center justify-center transition-colors">
                                        <span className="material-icons">favorite_border</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
