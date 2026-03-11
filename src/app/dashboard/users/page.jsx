"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function UsersPage() {
    const { token } = useAuthStore();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const headers = { 'Authorization': `Bearer ${token}` };

            const [usersRes, rolesRes] = await Promise.all([
                fetch('http://localhost:3001/api/users', { headers }),
                fetch('http://localhost:3001/api/users/roles', { headers })
            ]);

            const usersData = await usersRes.json();
            const rolesData = await rolesRes.json();

            setUsers(usersData.data || []);
            setRoles(rolesData.data || []);
        } catch (err) {
            setError('Error al cargar la gestión de usuarios.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRequestAction = async (requestId, action) => {
        try {
            await fetch(`http://localhost:3001/api/users/request-role/${requestId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action })
            });
            fetchData(); // Recargar para reflejar cambios
        } catch (err) {
            alert('Error al procesar la solicitud.');
            console.error(err);
        }
    };

    const handleRoleChange = async (userId, newRoleId) => {
        try {
            await fetch(`http://localhost:3001/api/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role_id: newRoleId })
            });
            fetchData();
        } catch (err) {
            alert('Error al cambiar el rol.');
            console.error(err);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando usuarios...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100">Gestión de Usuarios</h1>
            <p className="text-gray-500 dark:text-gray-400">Administra los roles y aprueba solicitudes de cuentas mayoristas.</p>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-sm">
                                <th className="p-4 font-bold text-gray-700 dark:text-gray-300">Usuario</th>
                                <th className="p-4 font-bold text-gray-700 dark:text-gray-300">Contacto</th>
                                <th className="p-4 font-bold text-gray-700 dark:text-gray-300">Rol Actual</th>
                                <th className="p-4 font-bold text-gray-700 dark:text-gray-300">Registro</th>
                                <th className="p-4 font-bold text-gray-700 dark:text-gray-300 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900 dark:text-white">
                                            {user.first_name} {user.last_name}
                                        </div>
                                        {user.pendingRequest && (
                                            <span className="inline-flex items-center gap-1 mt-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                <span className="material-icons text-[12px]">schedule</span>
                                                Solicitó: {user.pendingRequest.role.name}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-2"><span className="material-icons text-[14px] opacity-70">mail</span> {user.email}</div>
                                        {user.phone && <div className="flex items-center gap-2 mt-1"><span className="material-icons text-[14px] opacity-70">phone</span> {user.phone}</div>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${user.role.name === 'Admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                            user.role.name === 'Employee' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                user.role.name === 'Wholesaler' ? 'bg-primary/20 text-primary-dark dark:text-primary-light' :
                                                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                            {user.role.name}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        {user.pendingRequest ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleRequestAction(user.pendingRequest.id, 'approved')}
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors"
                                                    title="Aprobar Solicitud"
                                                >
                                                    <span className="material-icons text-[20px]">check</span>
                                                </button>
                                                <button
                                                    onClick={() => handleRequestAction(user.pendingRequest.id, 'rejected')}
                                                    className="bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 p-2 rounded-lg transition-colors"
                                                    title="Rechazar Solicitud"
                                                >
                                                    <span className="material-icons text-[20px]">close</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <select
                                                className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm px-3 py-2 text-gray-700 dark:text-gray-300 outline-none focus:border-primary transition-colors"
                                                value={user.role.id}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            >
                                                {roles.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">No hay usuarios registrados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
