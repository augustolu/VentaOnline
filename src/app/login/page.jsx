"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/lib/store/useAuthStore';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post('http://localhost:3001/api/auth/login', formData);
            if (res.data.success) {
                const { token, user } = res.data.data;
                setAuth(token, user);
                // Redirect based on role
                if (user.role.name === 'Admin' || user.role.name === 'Employee') {
                    router.push('/dashboard');
                } else {
                    router.push('/');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
            <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100 dark:border-gray-700">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-primary mb-2">Iniciar Sesión</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Ingresá tus credenciales para continuar</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
                        <input
                            type="password"
                            required
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg transition-colors mt-6 disabled:opacity-70"
                    >
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    ¿No tenés cuenta?{' '}
                    <Link href="/register" className="text-primary hover:underline font-bold">
                        Registrate acá
                    </Link>
                </div>
            </div>
        </div>
    );
}
