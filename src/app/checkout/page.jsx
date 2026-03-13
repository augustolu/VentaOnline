"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import config from '@/config/tenantConfig.json';
import { useCartStore } from '@/lib/store/useCartStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useEffect } from 'react';
import axios from 'axios';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import ReservationTimer from '@/components/ReservationTimer';
import ReservationExpiredModal from '@/components/ReservationExpiredModal';
import {
    ShoppingBag,
    Upload,
    CheckCircle2,
    ArrowLeft,
    Copy,
    Sparkles,
    Shield,
    Clock,
    FileCheck,
} from 'lucide-react';

const { discountThreshold: DISCOUNT_THRESHOLD, discountPct: DISCOUNT_PCT } = config.checkout || { discountThreshold: 1000000, discountPct: 5 };

const BANK_INFO = {
    bank: 'Banco Nación Argentina',
    holder: 'TU TIENDA S.R.L.',
    cbu: '0110012345678901234567',
    alias: 'TUTIENDA.PAGOS',
    cuit: '30-12345678-9',
};

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();
    const { user } = useAuthStore();

    const [step, setStep] = useState(1); // 1=Resumen, 2=Transferencia, 3=Comprobante
    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [notes, setNotes] = useState('');
    const [orderId, setOrderId] = useState(null);
    const [error, setError] = useState(null);
    const [isExpiredModalOpen, setIsExpiredModalOpen] = useState(false);
    const [copiedField, setCopiedField] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Shipping states
    const [shippingData, setShippingData] = useState({
        address_line: '',
        city: '',
        state: '',
        postal_code: '',
        shipping_type: 'standard'
    });
    const [shippingCost, setShippingCost] = useState(0);

    const { currentOrderId, expiresAt, setCheckoutSession, clearCheckoutSession, releaseStock } = useCheckoutStore();

    useEffect(() => {
        setIsMounted(true);

        if (currentOrderId && expiresAt) {
            setOrderId(currentOrderId);
            setStep(2);
        }

        // --- Manejo de abandono ---
        const handleUnload = () => {
            // No podemos usar async/await aquí de forma fiable, pero releaseStock usa axios
            // Para cierres de pestaña, navigator.sendBeacon es mejor, pero releaseStock
            // ya hace lo que necesitamos para navegaciones internas de Next.js
            if (currentOrderId && !orderComplete) {
                // Sincrónico o disparar y olvidar para cierres bruscos
                const data = JSON.stringify({ order_id: currentOrderId });
                navigator.sendBeacon('http://localhost:3001/api/checkout/cleanup', data);
            }
        };

        window.addEventListener('beforeunload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleUnload);
            // Si el componente se desmonta (usuario navega a otra página de la SPA)
            // y la orden NO está completa, liberamos stock.
            // Usamos una referencia al estado actual para evitar problemas de cierre (clousure)
            // pero en Next.js, si orderComplete cambia a true, este cleanup se re-ejecutará
            // si lo metemos en las dependencias.
        };
    }, [currentOrderId, expiresAt]);

    // Cleanup de desmontaje específico para navegación SPA
    useEffect(() => {
        return () => {
            // Si el usuario cambia de ruta (ej: vuelve al inicio) y hay una orden pendiente
            if (currentOrderId && !orderComplete) {
                releaseStock();
            }
        };
    }, [currentOrderId, orderComplete, releaseStock]);


    const cartTotal = getTotalPrice();
    const cartItemsCount = getTotalItems();
    const hasDiscount = cartTotal >= DISCOUNT_THRESHOLD;
    const discountAmount = hasDiscount ? cartTotal * (DISCOUNT_PCT / 100) : 0;
    const subtotalWithDiscount = cartTotal - discountAmount;
    const total = subtotalWithDiscount + shippingCost;

    // Shipping cost calculator (mock logic matching backend)
    useEffect(() => {
        const cp = parseInt(shippingData.postal_code);
        if (!isNaN(cp) && shippingData.postal_code.length >= 4) {
            if (cp >= 1000 && cp <= 1499) setShippingCost(2500);
            else if (cp >= 1500 && cp <= 1999) setShippingCost(3500);
            else setShippingCost(6500);
        } else {
            setShippingCost(0);
        }
    }, [shippingData.postal_code]);

    const handleCopy = async (text, field) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setReceiptFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setReceiptPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleCreateOrder = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const cartItems = items.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity
            }));

            const config = { withCredentials: true, headers: {} };
            const token = useAuthStore.getState().token;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            const response = await axios.post('http://localhost:3001/api/checkout',
                {
                    items: cartItems,
                    shipping_details: shippingData
                },
                config
            );

            if (response.data.success) {
                const { order_id, expires_at } = response.data.data;
                setOrderId(order_id);
                setCheckoutSession(order_id, expires_at);
                setStep(2);
            }
        } catch (err) {
            console.error('Error creating order:', err);
            setError(err.response?.data?.message || 'Error al crear la orden. Intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitOrder = async () => {
        if (!receiptFile || !orderId) return;

        setIsSubmitting(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('order_id', orderId);
            formData.append('amount', total);
            formData.append('receipt', receiptFile);
            if (notes) formData.append('transfer_reference', notes);

            const config = {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            };
            const token = useAuthStore.getState().token;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            const response = await axios.post('http://localhost:3001/api/payments/upload-receipt',
                formData,
                config
            );

            if (response.data.success) {
                setOrderComplete(true);
                clearCheckoutSession();
            }
        } catch (err) {
            console.error('Error uploading receipt:', err);
            setError(err.response?.data?.message || 'Error al subir el comprobante.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Hydration mismatch guard MUST be first
    if (!isMounted) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen font-body flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center py-16">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Order complete state
    if (orderComplete) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen font-body flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center px-4 py-16">
                    <div style={{
                        maxWidth: '480px',
                        width: '100%',
                        textAlign: 'center',
                        padding: '48px 32px',
                        borderRadius: '24px',
                        background: 'rgba(255,255,255,0.82)',
                        backdropFilter: 'blur(24px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
                    }}>
                        <div style={{
                            width: '72px', height: '72px',
                            borderRadius: '50%',
                            background: 'rgba(52,199,89,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px',
                        }}>
                            <CheckCircle2 size={36} strokeWidth={1.5} color="#34C759" />
                        </div>
                        <h1 style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: '26px',
                            fontWeight: 700,
                            color: '#1D1D1F',
                            margin: '0 0 8px',
                        }}>¡Pedido registrado!</h1>
                        <p style={{
                            fontSize: '14px',
                            lineHeight: 1.6,
                            color: '#86868B',
                            margin: '0 0 28px',
                        }}>
                            Tu comprobante fue enviado correctamente. Recibirás una confirmación
                            una vez que validemos la transferencia.
                        </p>
                        <button
                            onClick={() => {
                                clearCart();
                                router.push('/');
                            }}
                            style={{
                                padding: '14px 32px',
                                border: 'none',
                                borderRadius: '12px',
                                background: '#1D1D1F',
                                color: 'white',
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.25s',
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
                            Volver a la Tienda
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Empty cart
    if (cartItemsCount === 0) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen font-body flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center px-4 py-16">
                    <div style={{
                        maxWidth: '420px',
                        width: '100%',
                        textAlign: 'center',
                        padding: '48px 32px',
                        borderRadius: '24px',
                        background: 'rgba(255,255,255,0.82)',
                        backdropFilter: 'blur(24px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
                    }}>
                        <ShoppingBag size={48} strokeWidth={1} color="#AEAEB2" style={{ margin: '0 auto 16px', display: 'block' }} />
                        <h2 style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: '22px',
                            fontWeight: 700,
                            color: '#1D1D1F',
                            margin: '0 0 8px',
                        }}>Tu carrito está vacío</h2>
                        <p style={{ fontSize: '14px', color: '#86868B', margin: '0 0 24px' }}>
                            Agregá productos para iniciar tu compra.
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            style={{
                                padding: '12px 28px',
                                border: 'none',
                                borderRadius: '12px',
                                background: '#1D1D1F',
                                color: 'white',
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.25s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#FF5722';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#1D1D1F';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            Ver Productos
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Step indicator styles
    const stepDot = (n) => ({
        width: '32px', height: '32px',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '13px',
        fontWeight: 700,
        background: step >= n ? '#1D1D1F' : '#F2F2F7',
        color: step >= n ? 'white' : '#AEAEB2',
        transition: 'all 0.3s',
    });
    const stepLine = (n) => ({
        flex: 1,
        height: '2px',
        background: step > n ? '#1D1D1F' : '#F2F2F7',
        transition: 'background 0.3s',
    });

    const CopyRow = ({ label, value, field }) => (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(0,0,0,0.02)',
            marginBottom: '8px',
        }}>
            <div>
                <span style={{ display: 'block', fontSize: '11px', color: '#86868B', fontWeight: 500, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', fontWeight: 600, color: '#1D1D1F' }}>{value}</span>
            </div>
            <button
                onClick={() => handleCopy(value, field)}
                style={{
                    width: '32px', height: '32px',
                    borderRadius: '8px',
                    background: copiedField === field ? 'rgba(52,199,89,0.1)' : 'rgba(0,0,0,0.04)',
                    border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: copiedField === field ? '#34C759' : '#86868B',
                }}
            >
                {copiedField === field ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            </button>
        </div>
    );

    const handleExpiration = async () => {
        // 1. Llamar al cleanup del backend inmediatamente enviando el ID específico
        try {
            await axios.post('http://localhost:3001/api/checkout/cleanup', {
                order_id: currentOrderId
            });
        } catch (err) {
            console.error('Error al disparar cleanup:', err);
        }

        // 2. Limpiar sesión local y mostrar modal
        clearCheckoutSession();
        setIsExpiredModalOpen(true);
    };

    const handleConfirmExpiration = () => {
        setIsExpiredModalOpen(false);
        router.push('/');
    };


    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen font-body flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8" style={{ maxWidth: '960px' }}>
                {/* Back + Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : router.back()}
                        style={{
                            width: '40px', height: '40px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.7)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            color: '#1D1D1F',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                            e.currentTarget.style.transform = 'translateX(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
                            e.currentTarget.style.transform = 'translateX(0)';
                        }}
                    >
                        <ArrowLeft size={18} strokeWidth={2} />
                    </button>
                    <h1 style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: '28px',
                        fontWeight: 700,
                        color: '#1D1D1F',
                        margin: 0,
                    }}>Checkout</h1>

                    {/* Reservation Timer */}
                    {expiresAt && (
                        <div style={{ marginLeft: 'auto' }}>
                            <ReservationTimer expiresAt={expiresAt} onExpire={handleExpiration} />
                        </div>
                    )}
                </div>

                {error && (
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: 'rgba(255,59,48,0.1)',
                        border: '1px solid rgba(255,59,48,0.2)',
                        color: '#FF3B30',
                        fontSize: '14px',
                        fontWeight: 500,
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}>
                        <Shield size={16} />
                        {error}
                    </div>
                )}

                {/* Step Indicator */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '32px',
                    maxWidth: '360px',
                }}>
                    <div style={stepDot(1)}>1</div>
                    <div style={stepLine(1)} />
                    <div style={stepDot(2)}>2</div>
                    <div style={stepLine(2)} />
                    <div style={stepDot(3)}>3</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
                    {/* Left: Main content */}
                    <div style={{
                        borderRadius: '20px',
                        background: 'rgba(255,255,255,0.82)',
                        backdropFilter: 'blur(24px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                        padding: '28px',
                        minHeight: '400px',
                    }}>
                        {/* STEP 1: Resumen del pedido y Envío */}
                        {step === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                {/* Productos */}
                                <div>
                                    <h2 style={{
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        color: '#1D1D1F',
                                        margin: '0 0 16px',
                                    }}>Resumen del pedido</h2>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {items.map((item) => {
                                            const lineTotal = item.product.price * item.quantity;
                                            return (
                                                <div key={item.product.id} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    background: 'rgba(0,0,0,0.02)',
                                                }}>
                                                    <div style={{
                                                        width: '48px', height: '48px',
                                                        borderRadius: '8px',
                                                        background: '#F5F5F7',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                                                            <ShoppingBag size={18} color="#AEAEB2" />
                                                        )}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{
                                                            fontFamily: "'Space Grotesk', sans-serif",
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            color: '#1D1D1F',
                                                            margin: 0,
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        }}>{item.product.model || item.product.name}</p>
                                                        <p style={{ fontSize: '11px', color: '#86868B', margin: '1px 0 0' }}>
                                                            Cant: {item.quantity}
                                                        </p>
                                                    </div>
                                                    <span style={{
                                                        fontFamily: "'Space Grotesk', sans-serif",
                                                        fontSize: '13px',
                                                        fontWeight: 700,
                                                        color: '#1D1D1F',
                                                    }}>
                                                        ${lineTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Datos de Envío */}
                                <div>
                                    <h2 style={{
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        color: '#1D1D1F',
                                        margin: '0 0 16px',
                                    }}>Datos de Envío</h2>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={{ fontSize: '11px', color: '#86868B', fontWeight: 600, marginBottom: '4px', display: 'block' }}>DIRECCIÓN Y NÚMERO</label>
                                            <input
                                                type="text"
                                                value={shippingData.address_line}
                                                onChange={(e) => setShippingData({ ...shippingData, address_line: e.target.value })}
                                                placeholder="Ej: Av. Rivadavia 1234, 4° B"
                                                style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)', outline: 'none', fontSize: '14px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', color: '#86868B', fontWeight: 600, marginBottom: '4px', display: 'block' }}>CIUDAD</label>
                                            <input
                                                type="text"
                                                value={shippingData.city}
                                                onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                                                placeholder="Ej: CABA"
                                                style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)', outline: 'none', fontSize: '14px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', color: '#86868B', fontWeight: 600, marginBottom: '4px', display: 'block' }}>PROVINCIA</label>
                                            <input
                                                type="text"
                                                value={shippingData.state}
                                                onChange={(e) => setShippingData({ ...shippingData, state: e.target.value })}
                                                placeholder="Ej: Buenos Aires"
                                                style={{ width: '100%', height: '44px', padding: '0 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)', outline: 'none', fontSize: '14px' }}
                                            />
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={{ fontSize: '11px', color: '#86868B', fontWeight: 600, marginBottom: '4px', display: 'block' }}>CÓDIGO POSTAL (PARA CALCULAR ENVÍO)</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    value={shippingData.postal_code}
                                                    onChange={(e) => setShippingData({ ...shippingData, postal_code: e.target.value })}
                                                    placeholder="Ej: 1425"
                                                    style={{ flex: 1, height: '44px', padding: '0 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.1)', outline: 'none', fontSize: '16px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}
                                                />
                                                {shippingCost > 0 && (
                                                    <div style={{
                                                        padding: '0 16px', borderRadius: '10px', background: '#FF5722', color: 'white',
                                                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600
                                                    }}>
                                                        Envío: ${shippingCost.toLocaleString('es-AR')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateOrder}
                                    disabled={isSubmitting || !shippingData.postal_code || !shippingData.address_line}
                                    style={{
                                        width: '100%', height: '52px',
                                        border: 'none', borderRadius: '12px',
                                        background: (isSubmitting || !shippingData.postal_code || !shippingData.address_line) ? '#AEAEB2' : '#1D1D1F',
                                        color: 'white',
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        fontSize: '15px', fontWeight: 600,
                                        cursor: (isSubmitting || !shippingData.postal_code || !shippingData.address_line) ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.25s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: '8px',
                                        marginTop: '12px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSubmitting && shippingData.postal_code && shippingData.address_line) {
                                            e.currentTarget.style.background = '#FF5722';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,87,34,0.3)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSubmitting) {
                                            e.currentTarget.style.background = (isSubmitting || !shippingData.postal_code || !shippingData.address_line) ? '#AEAEB2' : '#1D1D1F';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
                                >
                                    {isSubmitting ? 'Iniciando pedido...' : 'Continuar al pago'}
                                </button>
                            </div>
                        )}

                        {/* STEP 2: Datos de transferencia */}
                        {step === 2 && (
                            <>
                                <h2 style={{
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    color: '#1D1D1F',
                                    margin: '0 0 6px',
                                }}>Datos para transferencia</h2>
                                <p style={{ fontSize: '13px', color: '#86868B', margin: '0 0 20px' }}>
                                    Realizá la transferencia por el monto total indicado a los siguientes datos:
                                </p>

                                <div style={{
                                    padding: '20px',
                                    borderRadius: '16px',
                                    background: 'rgba(255,87,34,0.03)',
                                    border: '1px solid rgba(255,87,34,0.1)',
                                    marginBottom: '20px',
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '16px',
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        color: '#FF5722',
                                    }}>
                                        Monto a transferir: ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </div>
                                    <CopyRow label="Banco" value={BANK_INFO.bank} field="bank" />
                                    <CopyRow label="Titular" value={BANK_INFO.holder} field="holder" />
                                    <CopyRow label="CBU" value={BANK_INFO.cbu} field="cbu" />
                                    <CopyRow label="Alias" value={BANK_INFO.alias} field="alias" />
                                    <CopyRow label="CUIT" value={BANK_INFO.cuit} field="cuit" />
                                </div>

                                {/* Trust badges */}
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    marginBottom: '24px',
                                }}>
                                    {[
                                        { icon: Shield, label: 'Pago seguro' },
                                        { icon: Clock, label: 'Validación en 24hs' },
                                        { icon: FileCheck, label: 'Comprobante digital' },
                                    ].map(({ icon: Icon, label }) => (
                                        <div key={label} style={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '12px 8px',
                                            borderRadius: '12px',
                                            background: 'rgba(0,0,0,0.02)',
                                        }}>
                                            <Icon size={18} strokeWidth={1.5} color="#86868B" />
                                            <span style={{ fontSize: '11px', color: '#86868B', fontWeight: 500, textAlign: 'center' }}>{label}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setStep(3)}
                                    style={{
                                        width: '100%', height: '48px',
                                        border: 'none', borderRadius: '12px',
                                        background: '#1D1D1F', color: 'white',
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        fontSize: '15px', fontWeight: 600,
                                        cursor: 'pointer', transition: 'all 0.25s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: '8px',
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
                                    Ya transferí, cargar comprobante
                                </button>
                            </>
                        )}

                        {/* STEP 3: Subir comprobante */}
                        {step === 3 && (
                            <>
                                <h2 style={{
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    color: '#1D1D1F',
                                    margin: '0 0 6px',
                                }}>Cargar comprobante</h2>
                                <p style={{ fontSize: '13px', color: '#86868B', margin: '0 0 20px' }}>
                                    Subí la captura o PDF del comprobante de transferencia.
                                </p>

                                {/* Upload area */}
                                <label style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: receiptPreview ? '12px' : '40px 24px',
                                    borderRadius: '16px',
                                    border: '2px dashed',
                                    borderColor: receiptFile ? '#34C759' : 'rgba(0,0,0,0.1)',
                                    background: receiptFile ? 'rgba(52,199,89,0.03)' : 'rgba(0,0,0,0.01)',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s',
                                    marginBottom: '20px',
                                }}>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    {receiptPreview ? (
                                        <div style={{ textAlign: 'center' }}>
                                            <img
                                                src={receiptPreview}
                                                alt="Comprobante"
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '280px',
                                                    borderRadius: '10px',
                                                    objectFit: 'contain',
                                                    marginBottom: '10px',
                                                }}
                                            />
                                            <p style={{ fontSize: '12px', color: '#34C759', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <CheckCircle2 size={14} /> {receiptFile.name}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload size={28} strokeWidth={1.5} color="#AEAEB2" style={{ marginBottom: '12px' }} />
                                            <p style={{
                                                fontFamily: "'Space Grotesk', sans-serif",
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                color: '#1D1D1F',
                                                margin: '0 0 4px',
                                            }}>Hacé clic para subir</p>
                                            <p style={{ fontSize: '12px', color: '#AEAEB2', margin: 0 }}>
                                                JPG, PNG o PDF — máx 10MB
                                            </p>
                                        </>
                                    )}
                                </label>

                                {/* Notes */}
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Notas adicionales (opcional)"
                                    style={{
                                        width: '100%',
                                        minHeight: '80px',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        background: 'rgba(0,0,0,0.02)',
                                        fontFamily: "'Outfit', sans-serif",
                                        fontSize: '13px',
                                        color: '#1D1D1F',
                                        resize: 'vertical',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        marginBottom: '20px',
                                    }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = '#FF5722'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'}
                                />

                                <button
                                    onClick={handleSubmitOrder}
                                    disabled={!receiptFile || isSubmitting}
                                    style={{
                                        width: '100%', height: '48px',
                                        border: 'none', borderRadius: '12px',
                                        background: !receiptFile ? '#D1D1D6' : '#1D1D1F',
                                        color: 'white',
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        fontSize: '15px', fontWeight: 600,
                                        cursor: !receiptFile ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.25s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: '8px',
                                        opacity: isSubmitting ? 0.7 : 1,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (receiptFile && !isSubmitting) {
                                            e.currentTarget.style.background = '#FF5722';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,87,34,0.3)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (receiptFile && !isSubmitting) {
                                            e.currentTarget.style.background = '#1D1D1F';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
                                >
                                    {isSubmitting ? 'Enviando...' : 'Confirmar pedido'}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Right: Order summary sidebar */}
                    <div style={{
                        borderRadius: '20px',
                        background: 'rgba(255,255,255,0.82)',
                        backdropFilter: 'blur(24px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                        padding: '24px',
                        position: 'sticky',
                        top: '100px',
                    }}>
                        <h3 style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#1D1D1F',
                            margin: '0 0 16px',
                        }}>Tu pedido</h3>

                        {/* Compact item list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            {items.map((item) => (
                                <div key={item.product.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '13px',
                                }}>
                                    <span style={{ color: '#1D1D1F', fontWeight: 500 }}>
                                        {item.product.model || item.product.name}
                                        {item.quantity > 1 && <span style={{ color: '#86868B' }}> ×{item.quantity}</span>}
                                    </span>
                                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: '#1D1D1F' }}>
                                        ${(item.product.price * item.quantity).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '0 0 12px' }} />

                        {/* Summary */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: '#86868B' }}>Subtotal</span>
                                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: '#1D1D1F' }}>
                                    ${cartTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            {hasDiscount && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                    <span style={{ color: '#FF5722', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Sparkles size={12} /> {DISCOUNT_PCT}% OFF
                                    </span>
                                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: '#FF5722' }}>
                                        -${discountAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '0 0 12px' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#1D1D1F',
                            }}>Total</span>
                            <div style={{ textAlign: 'right' }}>
                                {hasDiscount && (
                                    <span style={{
                                        fontFamily: "'Space Grotesk', sans-serif",
                                        fontSize: '12px',
                                        color: '#AEAEB2',
                                        textDecoration: 'line-through',
                                        marginRight: '6px',
                                    }}>
                                        ${cartTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </span>
                                )}
                                <span style={{
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    fontSize: '20px',
                                    fontWeight: 700,
                                    color: '#1D1D1F',
                                }}>
                                    ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        {/* Payment method badge */}
                        <div style={{
                            marginTop: '16px',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(0,0,0,0.02)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <Shield size={14} strokeWidth={1.5} color="#86868B" />
                            <span style={{ fontSize: '12px', color: '#86868B', fontWeight: 500 }}>
                                Pago por transferencia bancaria
                            </span>
                        </div>
                    </div>
                </div>
            </main>
            <ReservationExpiredModal
                isOpen={isExpiredModalOpen}
                onConfirm={handleConfirmExpiration}
            />
            <Footer />
        </div>
    );
}
