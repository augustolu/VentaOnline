'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

/**
 * Componente de temporizador de reserva con estética premium.
 * 
 * @param {object} props
 * @param {string} props.expiresAt - Fecha de expiración en formato ISO.
 * @param {Function} props.onExpire - Callback ejecutado cuando el tiempo llega a cero.
 */
export default function ReservationTimer({ expiresAt, onExpire }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        if (!expiresAt) return;

        const calculateTimeLeft = () => {
            const difference = new Date(expiresAt) - new Date();

            if (difference <= 0) {
                setTimeLeft('00:00');
                if (onExpire) onExpire();
                return false;
            }

            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            // Marcar como urgente si quedan menos de 5 minutos
            if (difference < 5 * 60 * 1000) {
                setIsUrgent(true);
            }

            const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            setTimeLeft(formatted);
            return true;
        };

        const timer = setInterval(() => {
            if (!calculateTimeLeft()) {
                clearInterval(timer);
            }
        }, 1000);

        calculateTimeLeft(); // Initial call

        return () => clearInterval(timer);
    }, [expiresAt, onExpire]);

    if (!timeLeft) return null;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '14px',
            background: isUrgent ? 'rgba(255,59,48,0.08)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${isUrgent ? 'rgba(255,59,48,0.2)' : 'rgba(0,0,0,0.06)'}`,
            backdropFilter: 'blur(12px)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
            <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isUrgent ? '#FF3B30' : '#1D1D1F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                animation: isUrgent ? 'pulse 2s infinite' : 'none',
            }}>
                {isUrgent ? <AlertCircle size={18} /> : <Clock size={18} />}
            </div>

            <div>
                <p style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isUrgent ? '#FF3B30' : '#86868B',
                    margin: 0,
                }}>
                    {isUrgent ? 'Reserva por expirar' : 'Tu reserva caduca en'}
                </p>
                <p style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '18px',
                    fontWeight: 700,
                    color: isUrgent ? '#FF3B30' : '#1D1D1F',
                    margin: 0,
                    lineHeight: 1.2,
                }}>
                    {timeLeft}
                </p>
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.4); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(255, 59, 48, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
                }
            `}</style>
        </div>
    );
}
