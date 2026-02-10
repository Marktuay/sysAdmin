import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Smartphone,
    Search,
    Plus,
    Filter,
    Edit2,
    Trash2,
    ChevronRight,
    ShieldCheck,
    AlertCircle,
    Clock,
    DollarSign,
    Phone,
    Hash,
    LayoutGrid,
    List,
    FileDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DeviceModal from '../components/DeviceModal';

const Devices = ({ initialFilter = '', title = 'Dispositivos' }) => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState(initialFilter);
    const [viewMode, setViewMode] = useState('list'); // Default to list/table as requested for inventory checks
    const [isExporting, setIsExporting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDevice, setCurrentDevice] = useState(null);
    const { hasRole } = useAuth();
    
    // Reset filter if initialFilter changes (e.g. navigation)
    useEffect(() => {
        if (initialFilter) setFilter(initialFilter);
    }, [initialFilter]);

    useEffect(() => {
        fetchDevices();
    }, [search, filter]);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const params = {
                search: search || undefined,
                estado: filter || undefined
            };
            const response = await api.get('/devices/', { params });
            setDevices(response.data);
        } catch (error) {
            console.error('Error fetching devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setCurrentDevice(null);
        setIsModalOpen(true);
    };

    const handleEdit = (device) => {
        setCurrentDevice(device);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de dar de baja este dispositivo?')) {
            try {
                await api.delete(`/devices/${id}`);
                fetchDevices();
            } catch (error) {
                console.error('Error deleting device:', error);
                alert('Error al eliminar dispositivo');
            }
        }
    };

    const handleSave = async (data) => {
        try {
            if (currentDevice) {
                await api.put(`/devices/${currentDevice.id}`, data);
            } else {
                await api.post('/devices/', data);
            }
            setIsModalOpen(false);
            fetchDevices();
        } catch (error) {
            console.error('Error saving device:', error);
            alert('Error al guardar dispositivo');
        }
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const params = {
                search: search || undefined,
                estado: filter || undefined
            };
            const response = await api.get('/devices/export', { 
                params,
                responseType: 'blob' 
            });
            
            const filename = title === 'Líneas Libres' ? 'lineas_libres.xlsx' : 'dispositivos.xlsx';
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading excel:', error);
            alert('Error al exportar a Excel');
        } finally {
            setIsExporting(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'disponible': return 'bg-blue-100 text-blue-700';
            case 'asignado': return 'bg-green-100 text-green-700';
            case 'baja': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
                    <p className="text-slate-500">
                        {title === 'Líneas Libres' 
                            ? 'Gestión de líneas y equipos disponibles para asignación' 
                            : 'Gestión de inventario de equipos y terminales'
                        }
                    </p>
                </div>
                {hasRole(['admin', 'rrhh']) && (
                    <div className="flex gap-2">
                         <button 
                            className="btn-secondary" 
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            <FileDown size={20} />
                            <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'Exportar Excel'}</span>
                        </button>
                        <button className="btn-primary" onClick={handleCreate}>
                            <Plus size={20} />
                            <span>{title === 'Líneas Libres' ? 'Agregar Línea' : 'Añadir Equipo'}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por marca, modelo, IMEI, número o empleado..."
                        className="input-field !pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="input-field w-auto"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        <option value="disponible">Disponibles</option>
                        <option value="asignado">Asignados</option>
                        <option value="baja">De Baja</option>
                    </select>
                    <button className="btn-secondary px-3">
                        <Filter size={20} />
                    </button>
                    <div className="border-l border-slate-200 pl-2 ml-2 flex gap-1">
                        <button 
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:bg-slate-50'}`}
                            onClick={() => setViewMode('grid')}
                            title="Vista Cuadrícula"
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button 
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:bg-slate-50'}`}
                            onClick={() => setViewMode('list')}
                            title="Vista Tabla"
                        >
                            <List size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Devices Content */}
            {viewMode === 'grid' ? (
                // Grid View
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="glass-card p-6 rounded-2xl animate-pulse h-64 bg-slate-50"></div>
                    ))
                ) : devices.length === 0 ? (
                    <div className="col-span-full py-20 text-center glass-card">
                        <Smartphone size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-slate-400">No se encontraron dispositivos</p>
                    </div>
                ) : (
                    devices.map((device) => (
                        <div key={device.id} className="glass-card p-6 rounded-2xl hover:shadow-xl transition-all duration-300 group flex flex-col justify-between h-full border-b-4 border-b-transparent hover:border-b-primary-500">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-lg bg-primary-50 text-primary-600`}>
                                        <Smartphone size={24} />
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(device.estado)}`}>
                                        {device.estado}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                                    {device.marca} {device.modelo}
                                </h3>

                                <div className="mt-4 space-y-2">
                                    {device.asignado_a ? (
                                        <div className="flex items-center gap-2 text-sm text-slate-500 bg-purple-50 p-2 rounded-lg border border-purple-100 mb-3">
                                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                            <span className="font-semibold text-purple-700 truncate w-full" title={device.asignado_a}>
                                                {device.asignado_a}
                                            </span>
                                        </div>
                                    ) : device.ultimo_asignado && device.estado === 'disponible' ? (
                                        <div className="flex flex-col gap-1 text-sm text-slate-500 bg-orange-50 p-2 rounded-lg border border-orange-100 mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                                <span className="font-medium text-orange-800 text-xs uppercase tracking-wide">Última Asignación</span>
                                            </div>
                                            <span className="font-semibold text-slate-700 truncate pl-4" title={device.ultimo_asignado}>
                                                {device.ultimo_asignado}
                                            </span>
                                            {device.fecha_devolucion_ultimo && (
                                                <span className="text-xs text-slate-400 pl-4">
                                                    Devuelto: {new Date(device.fecha_devolucion_ultimo).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    ) : null}

                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Phone size={14} className="text-slate-400" />
                                        <span className="font-semibold text-slate-700">{device.numero_telefono || 'Sin número'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Hash size={14} className="text-slate-400" />
                                        <span>IMEI: {device.imei || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <DollarSign size={14} className="text-slate-400" />
                                        <span>Costo: ${device.costo_inicial}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {device.estado_fisico === 'NUEVO' ? (
                                        <ShieldCheck size={16} className="text-green-500" />
                                    ) : device.estado_fisico === 'USADO' ? (
                                        <Clock size={16} className="text-blue-500" />
                                    ) : (
                                        <AlertCircle size={16} className="text-orange-500" />
                                    )}
                                    <span className="text-xs font-medium text-slate-500">{device.estado_fisico}</span>
                                </div>

                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => handleEdit(device)}
                                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(device.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                </div>
            ) : (
                // Table View
                <div className="glass-card overflow-hidden rounded-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Equipo / Marca</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Línea / Número</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">IMEI</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Estado Físico</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Disponibilidad</th>
                                    <th className="py-4 px-6 font-semibold text-slate-600 text-sm text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="p-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                            <td className="p-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                            <td className="p-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                            <td className="p-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                            <td className="p-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                            <td className="p-4"><div className="h-4 bg-slate-100 rounded w-16 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : devices.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-slate-400">
                                            No se encontraron registros
                                        </td>
                                    </tr>
                                ) : (
                                    devices.map((device) => (
                                        <tr key={device.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-3 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                                        <Smartphone size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{device.marca}</p>
                                                        <p className="text-xs text-slate-500">{device.modelo}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-6">
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-slate-400" />
                                                    <span className="font-medium text-slate-700">
                                                        {device.numero_telefono || <span className="text-slate-400 italic">Sin número</span>}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-6 text-sm text-slate-600 font-mono">
                                                {device.imei || 'N/A'}
                                            </td>
                                            <td className="py-3 px-6">
                                                <div className="flex items-center gap-2">
                                                    {device.estado_fisico === 'NUEVO' ? (
                                                        <ShieldCheck size={14} className="text-green-500" />
                                                    ) : device.estado_fisico === 'USADO' ? (
                                                        <Clock size={14} className="text-blue-500" />
                                                    ) : (
                                                        <AlertCircle size={14} className="text-orange-500" />
                                                    )}
                                                    <span className="text-sm text-slate-700 capitalize">{device.estado_fisico}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-6">
                                                <div className="space-y-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(device.estado)}`}>
                                                        {device.estado}
                                                    </span>
                                                    {device.asignado_a ? (
                                                        <p className="text-xs text-purple-600 font-medium truncate max-w-[150px]" title={device.asignado_a}>
                                                            👤 {device.asignado_a}
                                                        </p>
                                                    ) : device.ultimo_asignado && device.estado === 'disponible' ? (
                                                        <p className="text-xs text-orange-600 font-medium truncate max-w-[150px]" title={`Devuelto por: ${device.ultimo_asignado}`}>
                                                            ↩️ Ex: {device.ultimo_asignado}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="py-3 px-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleEdit(device)}
                                                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(device.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <DeviceModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave} 
                device={currentDevice} 
            />
        </div>
    );
};

export default Devices;
