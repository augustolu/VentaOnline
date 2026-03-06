"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/lib/store/useAuthStore';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        role_name: 'Client', // Default
        admin_secret: ''
    });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePhoneChange = (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

        // Auto-format: Add space after 3 chars, then after 1 char
        if (value.length > 3 && value.length <= 4) {
            value = `${value.slice(0, 3)} ${value.slice(3)}`;
        } else if (value.length > 4) {
            value = `${value.slice(0, 3)} ${value.slice(3, 4)} ${value.slice(4, 10)}`;
        }

        setFormData({ ...formData, phone: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post('http://localhost:3001/api/auth/register', formData);
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
            let errorMsg = err.response?.data?.message || 'Error al registrar usuario';
            if (err.response?.data?.errors) {
                const detailedErrors = Object.values(err.response.data.errors).flat().join(' | ');
                errorMsg = `${errorMsg}: ${detailedErrors}`;
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
            <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100 dark:border-gray-700">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-black text-primary mb-2">Crear Cuenta</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Completá tus datos para registrarte</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                        </div>
                    </div>

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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono (WhatsApp)</label>
                        <input
                            type="tel"
                            placeholder="Ej: 266 4 123456"
                            required
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            maxLength={12}
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

                    {/* Oculto el selector de rol por pedido del sistema: todos se registran como Cliente */}

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="flex items-center h-5">
                                <input
                                    type="checkbox"
                                    required
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                                />
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                                <span className="font-bold text-gray-800 dark:text-gray-200">Al registrarte, aceptas recibir ofertas por email y WhatsApp. </span>
                                Si sales del grupo de WhatsApp, no podrás volver a entrar.
                                <button type="button" onClick={() => setShowTerms(!showTerms)} className="text-primary hover:underline ml-1 font-bold">
                                    {showTerms ? 'Ocultar términos' : 'Ver términos completos'}
                                </button>
                            </div>
                        </label>
                    </div>

                    {showTerms && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-[11px] text-gray-600 dark:text-gray-400 space-y-2 border border-gray-200 dark:border-gray-700 h-40 overflow-y-auto custom-scrollbar animate-in scale-in">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200">Términos y Condiciones de Suscripción</h4>
                            <p>Al proporcionar tu número de teléfono y correo electrónico, aceptas los siguientes puntos sobre el tratamiento de tus datos personales:</p>
                            <p><strong>Finalidad de los Datos:</strong> Autorizas el uso de tu correo electrónico para el envío de boletines de ofertas y tu número de WhatsApp para ser incluido exclusivamente en nuestro Grupo de Difusión de Súper Descuentos.</p>
                            <p><strong>Privacidad:</strong> Tus datos son confidenciales. No compartiremos tu información con terceros ni la utilizaremos para fines ajenos a nuestras promociones exclusivas.</p>
                            <p><strong>Baja Voluntaria:</strong> Puedes solicitar la baja de nuestra lista de correos o salirte del grupo de WhatsApp en cualquier momento.</p>
                            <p><strong>Política de Reingreso (WhatsApp):</strong> Si decides abandonar el grupo de WhatsApp, esta acción es definitiva. No volverás a ser agregado manualmente ni de forma automática en el futuro para evitar el reingreso reiterado y proteger la experiencia de los demás miembros.</p>
                            <p><strong>Consentimiento:</strong> Al completar el registro, confirmas que eres el titular de los datos proporcionados y aceptas recibir estas comunicaciones.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !acceptedTerms}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg transition-colors mt-6 disabled:opacity-70"
                    >
                        {loading ? 'Registrando...' : 'Crear Cuenta'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    ¿Ya tenés cuenta?{' '}
                    <Link href="/login" className="text-primary hover:underline font-bold">
                        Iniciá Sesión acá
                    </Link>
                </div>
            </div>
        </div>
    );
}
