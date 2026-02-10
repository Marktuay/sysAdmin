import React, { useState, useEffect } from 'react';
import { X, Clock, Globe, Shield } from 'lucide-react';
import api from '../services/api';

const UserActivityModal = ({ isOpen, onClose, userId, userName }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            fetchActivity();
        }
    }, [isOpen, userId]);

    const fetchActivity = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/users/${userId}/activity`);
            setActivities(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Historial de Actividad</h2>
                        <p className="text-sm text-slate-500">Usuario: {userName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="p-10 text-center text-slate-400">
                            <Clock size={40} className="mx-auto mb-3 opacity-20" />
                            <p>No hay actividad registrada</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {activities.map((act) => (
                                <div key={act.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded textxs font-medium uppercase tracking-wider text-[10px] ${
                                            act.action === 'login' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {act.action === 'login' ? '● Inicio de Sesión' : '○ Cierre de Sesión'}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(act.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                                        <div className="flex items-center gap-1" title="Dirección IP">
                                            <Globe size={12} />
                                            {act.ip_address || 'IP desconocida'}
                                        </div>
                                        <div className="flex items-center gap-1 truncate max-w-[200px]" title="Navegador">
                                            <Shield size={12} />
                                            {act.user_agent ? act.user_agent.split(' ')[0] : 'Unknown Agent'} 
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserActivityModal;
