import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function ReservationExpiredModal({ isOpen, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
        }}>
            <div style={{
                width: '100%',
                maxWeight: '400px',
                maxWidth: '400px',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '32px',
                padding: '40px 32px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                animation: 'modalIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: '#1D1D1F',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    margin: '0 auto 24px',
                }}>
                    <ShoppingBag size={28} />
                </div>

                <h2 style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#1D1D1F',
                    marginBottom: '12px',
                    letterSpacing: '-0.02em',
                }}>
                    Tiempo agotado
                </h2>

                <p style={{
                    fontSize: '15px',
                    lineHeight: '1.5',
                    color: '#86868B',
                    marginBottom: '32px',
                }}>
                    Tu reserva ha expirado y el stock ha sido liberado. ¡Sigue explorando la tienda para encontrar más productos!
                </p>

                <button
                    onClick={onConfirm}
                    style={{
                        width: '100%',
                        padding: '16px 24px',
                        background: '#0071E3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '16px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                >
                    Seguir Comprando
                    <ArrowRight size={18} />
                </button>
            </div>

            <style jsx>{`
                @keyframes modalIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
