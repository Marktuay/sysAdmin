import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    BarChart3,
    PieChart as PieChartIcon,
    TrendingDown,
    Smartphone,
    Users,
    FileCheck,
    Download,
    Calendar
} from 'lucide-react';

const Reports = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(false);
            // Mocking for now as the specialized reports endpoint might need more backend work
            // but we have /reports/dashboard
            const response = await api.get('/reports/dashboard');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(true); // Set to false when done, wait...
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const deviceDistribution = [
        { label: 'Disponibles', value: stats?.devices?.available || 0, color: 'bg-blue-500' },
        { label: 'Asignados', value: stats?.devices?.assigned || 0, color: 'bg-green-500' },
        { label: 'De Baja', value: stats?.devices?.baja || 0, color: 'bg-red-500' }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Reportes y Estadísticas</h1>
                <p className="text-slate-500">Análisis detallado del inventario y activos de la empresa</p>
            </div>

            {/* Financial Impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                            <BarChart3 size={24} />
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+12.5%</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Inversión Total</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">${stats?.financial?.total_value_initial?.toLocaleString() || '0'}</p>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-500/20"></div>
                </div>

                <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                            <TrendingDown size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Depreciación Acumulada</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">${stats?.financial?.accumulated_depreciation?.toLocaleString() || '0'}</p>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500/20"></div>
                </div>

                <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Smartphone size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Valor Neto Actual</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">${stats?.financial?.total_value_current?.toLocaleString() || '0'}</p>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500/20"></div>
                </div>

                <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Users size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Empleados Activos</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.employees?.total || 0}</p>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500/20"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Inventory Distribution */}
                <div className="glass-card p-8 rounded-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <PieChartIcon size={20} className="text-primary-600" />
                            Distribución de Inventario
                        </h3>
                    </div>

                    <div className="space-y-6">
                        {deviceDistribution.map((item, idx) => {
                            const total = deviceDistribution.reduce((acc, curr) => acc + curr.value, 0);
                            const percentage = total > 0 ? (item.value / total) * 100 : 0;

                            return (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-slate-600">{item.label}</span>
                                        <span className="font-bold text-slate-900">{item.value} ({percentage.toFixed(1)}%)</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                            <FileCheck size={14} />
                            Datos actualizados en tiempo real según inventario actual.
                        </p>
                    </div>
                </div>

                {/* Action Cards */}
                <div className="space-y-6">
                    <div className="glass-card p-6 rounded-2xl border-l-4 border-l-primary-500 hover:translate-x-1 transition-transform cursor-pointer">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                                    <Download size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Exportar Inventario</h4>
                                    <p className="text-sm text-slate-500">Descargar lista completa en Excel</p>
                                </div>
                            </div>
                            <Calendar className="text-slate-300" />
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl border-l-4 border-l-blue-500 hover:translate-x-1 transition-transform cursor-pointer">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <BarChart3 size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Reporte de Depreciación</h4>
                                    <p className="text-sm text-slate-500">Análisis contable detallado</p>
                                </div>
                            </div>
                            <Calendar className="text-slate-300" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-8 rounded-2xl text-white shadow-xl shadow-primary-200">
                        <h3 className="text-xl font-bold mb-2">Próxima Auditoría</h3>
                        <p className="text-white/80 text-sm mb-6">La revisión trimestral de activos está programada para el 15 de Marzo.</p>
                        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-2 rounded-xl text-sm font-bold transition-colors">
                            Programar Recordatorio
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
