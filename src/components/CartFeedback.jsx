"use client";

import { useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/lib/store/useCartStore';

export default function CartFeedback() {
    const lastAdded = useCartStore((state) => state.lastAdded);
    const [showToast, setShowToast] = useState(false);
    const audioRef = useRef(null);
    const processedRef = useRef(lastAdded); // <--- Initialize with current value to skip it

    useEffect(() => {
        // Only trigger if lastAdded is NEW and greater than what we've seen
        if (lastAdded > 0 && lastAdded !== processedRef.current) {
            processedRef.current = lastAdded;

            // Play sound
            if (audioRef.current) {
                audioRef.current.volume = 0.3;
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(err => console.log('Audio playback failed:', err));
            }

            // Show toast
            setShowToast(true);
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [lastAdded]);

    return (
        <>
            <audio ref={audioRef} src="/sounds/add-to-cart.mp3" preload="auto" />

            <div
                className={`fixed top-24 right-4 z-[60] py-3 px-6 rounded-2xl shadow-2xl transition-all duration-500 transform flex items-center gap-3 ${showToast
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-full opacity-0'
                    }`}
                style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 87, 34, 0.2)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                }}
            >
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white">
                    <span className="material-icons text-lg">shopping_cart</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-900 font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        ¡Producto agregado!
                    </span>
                    <span className="text-gray-500 text-xs">Se sumó correctamente al carrito</span>
                </div>
            </div>
        </>
    );
}
