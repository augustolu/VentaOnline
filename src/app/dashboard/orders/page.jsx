"use client";

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Search,
    Filter,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    ChevronDown,
    ExternalLink,
    ShoppingBag,
    User,
    Calendar,
    DollarSign,
    RefreshCw,
    Shield
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';

const STATUS_TABS = [
    { id: 'all', label: 'Todos', color: '#8E8E93' },
    { id: 'Pending', label: 'Pendientes', color: '#FF9500' },
    { id: 'Awaiting_Verification', label: 'Por Verificar', color: '#5856D6' },
    { id: 'Paid', label: 'Pagados', color: '#34C759' },
    { id: 'Rejected', label: 'Rechazados', color: '#FF3B30' },
];

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);
    const { token } = useAuthStore();

    const fetchOrders = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const url = activeTab === 'all'
                ? 'http://localhost:3001/api/orders'
                : `http://localhost:3001/api/orders?status=${activeTab}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            if (response.data.success) {
                setOrders(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Error al cargar las órdenes. Asegúrate de tener permisos de Admin o Empleado.');
        } finally {
            setLoading(false);
        }
    }, [activeTab, token]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleApprove = async (orderId) => {
        if (!confirm('¿Estás seguro de que deseas aprobar este pago?')) return;

        setActionLoading(true);
        try {
            const response = await axios.post('http://localhost:3001/api/payments/verify',
                { orderId },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );
            if (response.data.success) {
                fetchOrders();
                setSelectedOrder(null);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Error al aprobar el pago.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (orderId) => {
        const reason = prompt('Motivo del rechazo:', 'Comprobante inválido o monto incorrecto.');
        if (reason === null) return;

        setActionLoading(true);
        try {
            const response = await axios.post('http://localhost:3001/api/orders/reject',
                { orderId, reason },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );
            if (response.data.success) {
                fetchOrders();
                setSelectedOrder(null);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Error al rechazar la orden.');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Paid': return { bg: 'rgba(52,199,89,0.1)', text: '#34C759', icon: CheckCircle };
            case 'Awaiting_Verification': return { bg: 'rgba(88,86,214,0.1)', text: '#5856D6', icon: Clock };
            case 'Pending': return { bg: 'rgba(255,149,0,0.1)', text: '#FF9500', icon: AlertCircle };
            case 'Rejected': return { bg: 'rgba(255,59,48,0.1)', text: '#FF3B30', icon: XCircle };
            default: return { bg: 'rgba(142,142,147,0.1)', text: '#8E8E93', icon: Clock };
        }
    };

    if (!isMounted) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-pulse">
                <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-4 w-96 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
                <div className="w-full max-w-4xl h-64 bg-gray-50 dark:bg-gray-900 rounded-2xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100 font-header">Gestión de Pedidos</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Administra las ventas y valida comprobantes de transferencia.</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all text-gray-600 dark:text-gray-300"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border ${activeTab === tab.id
                            ? 'bg-gray-900 border-gray-900 text-white shadow-lg shadow-gray-200 dark:shadow-none'
                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-700/30">
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Orden</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {loading && !orders.length ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-4 h-16 bg-gray-50/20 dark:bg-gray-800/20"></td>
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                        No se encontraron órdenes en esta categoría.
                                    </td>
                                </tr>
                            ) : orders.map((order) => {
                                const { bg, text, icon: Icon } = getStatusStyles(order.status);
                                return (
                                    <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                                    {order.user.first_name} {order.user.last_name}
                                                </span>
                                                <span className="text-[11px] text-gray-400">{order.user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-100">
                                            ${Number(order.total_amount).toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div style={{ backgroundColor: bg, color: text }} className="px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 w-fit uppercase tracking-tight">
                                                <Icon size={12} />
                                                {STATUS_TABS.find(t => t.id === order.status)?.label || order.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Detail */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 dark:text-white font-header">Detalle del Pedido</h2>
                                <p className="text-xs text-gray-400 mt-0.5">ID: {selectedOrder.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <XCircle size={24} className="text-gray-300" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left: Items and Progress */}
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <ShoppingBag size={14} /> Productos ({selectedOrder.order_items.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedOrder.order_items.map((item) => (
                                            <div key={item.id} className="flex gap-4 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center p-1 border border-gray-50 dark:border-gray-700">
                                                    {item.product.image_url ? (
                                                        <img src={`http://localhost:3001${item.product.image_url}`} alt="" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <ShoppingBag size={20} className="text-gray-200" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{item.product.model}</p>
                                                    <p className="text-[11px] text-gray-400 capitalize">{item.product.brand} · {item.quantity} unidades</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-gray-800 dark:text-gray-100">${Number(item.unit_price).toLocaleString('es-AR')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-500">Total Pagado</span>
                                        <span className="text-xl font-black text-gray-900 dark:text-white">${Number(selectedOrder.total_amount).toLocaleString('es-AR')}</span>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <User size={14} /> Información del Cliente
                                    </h3>
                                    <div className="p-5 rounded-2xl bg-gray-900 text-white shadow-xl">
                                        <p className="text-lg font-black">{selectedOrder.user.first_name} {selectedOrder.user.last_name}</p>
                                        <p className="text-sm text-gray-400">{selectedOrder.user.email}</p>
                                        <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold">Fecha</p>
                                                <p className="text-xs font-bold">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold">Estado Actual</p>
                                                <p className="text-xs font-bold">{selectedOrder.status}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right: Receipt and Actions */}
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Filter size={14} /> Comprobante de Transferencia
                                    </h3>
                                    {selectedOrder.payment?.payment_receipt ? (
                                        <div className="relative group rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-lg bg-gray-50 dark:bg-gray-900">
                                            <img
                                                src={`http://localhost:3001${selectedOrder.payment.payment_receipt.receipt_url}`}
                                                alt="Comprobante"
                                                className="w-full h-auto object-contain max-h-[400px]"
                                            />
                                            <a
                                                href={`http://localhost:3001${selectedOrder.payment.payment_receipt.receipt_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg text-gray-800 hover:scale-110 transition-transform"
                                            >
                                                <ExternalLink size={20} />
                                            </a>
                                            <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur text-center border-t border-gray-200 dark:border-gray-700">
                                                <p className="text-xs font-bold text-gray-500 uppercase">Monto Declarado</p>
                                                <p className="text-lg font-black text-gray-900 dark:text-white">${Number(selectedOrder.payment.amount).toLocaleString('es-AR')}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-64 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 gap-2 italic">
                                            <AlertCircle size={32} />
                                            <p className="text-sm">No se ha subido comprobante aún</p>
                                        </div>
                                    )}
                                </section>

                                {/* Actions */}
                                {selectedOrder.status === 'Awaiting_Verification' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleReject(selectedOrder.id)}
                                            disabled={actionLoading}
                                            className="h-14 rounded-2xl border-2 border-red-500 text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                        >
                                            <XCircle size={20} /> Rechazar
                                        </button>
                                        <button
                                            onClick={() => handleApprove(selectedOrder.id)}
                                            disabled={actionLoading}
                                            className="h-14 rounded-2xl bg-green-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-green-600 shadow-lg shadow-green-100 dark:shadow-none transition-all disabled:opacity-50"
                                        >
                                            <CheckCircle size={20} /> Aprobar
                                        </button>
                                    </div>
                                )}

                                {selectedOrder.status === 'Paid' && (
                                    <div className="p-4 rounded-2xl bg-green-50 border border-green-100 text-green-700 flex items-center justify-center gap-3">
                                        <CheckCircle size={20} />
                                        <span className="text-sm font-bold uppercase tracking-tight">Venta Confirmada</span>
                                    </div>
                                )}

                                {selectedOrder.status === 'Rejected' && (
                                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 flex items-center justify-center gap-3">
                                        <XCircle size={20} />
                                        <span className="text-sm font-bold uppercase tracking-tight">Pedido Rechazado</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
