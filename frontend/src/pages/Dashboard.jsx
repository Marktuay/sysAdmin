import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Smartphone,
    Users,
    CheckCircle2,
    XCircle,
    TrendingDown,
    DollarSign,
    AlertTriangle
} from 'lucide-react';

const StatCard = ({ title, value, icon, color, subValue, subLabel }) => (
    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
                {icon}
            </div>
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        </div>
        <div>
            <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
            {subValue !== undefined && (
                <p className="text-sm text-slate-500 mt-1">
                    <span className="font-semibold">{subValue}</span> {subLabel}
                </p>
            )}
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/reports/dashboard');
                setStats(response.data);
            } catch (err) {
                setError('No se pudieron cargar las estadísticas');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-200 rounded-2xl"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-96 bg-slate-200 rounded-2xl"></div>
                <div className="h-96 bg-slate-200 rounded-2xl"></div>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center glass-card border-red-100 bg-red-50/50">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-bold text-red-900">{error}</h2>
            <button onClick={() => window.location.reload()} className="btn-primary mt-4 mx-auto">Reintentar</button>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Resumen operativo del inventario de dispositivos</p>
                </div>
                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-600 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Sistema Online
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Dispositivos"
                    value={stats.devices.total}
                    icon={<Smartphone />}
                    color="primary"
                    subValue={stats.devices.available}
                    subLabel="disponibles"
                />
                <StatCard
                    title="Asignados"
                    value={stats.devices.assigned}
                    icon={<CheckCircle2 />}
                    color="green"
                    subValue={Math.round((stats.devices.assigned / stats.devices.total) * 100) || 0}
                    subLabel="% ocupación"
                />
                <StatCard
                    title="Empleados"
                    value={stats.employees.total}
                    icon={<Users />}
                    color="blue"
                    subValue={stats.employees.total}
                    subLabel="en sistema"
                />
                <StatCard
                    title="Bajas"
                    value={stats.devices.baja}
                    icon={<XCircle />}
                    color="red"
                    subValue={stats.devices.baja}
                    subLabel="equipos fuera"
                />
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-8 rounded-2xl bg-gradient-to-br from-white to-primary-50">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <DollarSign className="text-primary-600" />
                        Valor Financiero del Inventario
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <div>
                            <p className="text-sm font-medium text-slate-400 uppercase mb-1">Costo Inicial Total</p>
                            <p className="text-2xl font-bold text-slate-900">U$ {stats.financial.total_value_initial.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400 uppercase mb-1">Depreciación Acum.</p>
                            <p className="text-2xl font-bold text-red-600">U$ {stats.financial.accumulated_depreciation.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400 uppercase mb-1">Valor Actual</p>
                            <p className="text-3xl font-extra-bold text-primary-700">U$ {stats.financial.total_value_current.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-500">Porcentaje de vida útil restante</span>
                            <span className="font-bold text-primary-600">
                                {Math.round((stats.financial.total_value_current / stats.financial.total_value_initial) * 100) || 0}%
                            </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-500 transition-all duration-1000"
                                style={{ width: `${(stats.financial.total_value_current / stats.financial.total_value_initial) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-8 rounded-2xl flex flex-col justify-center text-center">
                    <TrendingDown className="mx-auto text-orange-500 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-900">Cálculo de Depreciación</h3>
                    <p className="text-sm text-slate-500 mt-2">
                        El sistema calcula automáticamente el valor actual de cada equipo basándose en una vida útil de 36 meses.
                    </p>
                    <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <p className="text-xs text-orange-800 font-medium">
                            Próximo cierre contable: {new Date().toLocaleDateString('es-NI', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
