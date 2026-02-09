import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Users,
    Search,
    Plus,
    Filter,
    MoreVertical,
    Edit2,
    Trash2,
    ChevronRight,
    UserCheck,
    UserX,
    MapPin,
    Briefcase
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import EmployeeModal from '../components/EmployeeModal';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const { hasRole } = useAuth();

    useEffect(() => {
        fetchEmployees();
    }, [search, filter]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const params = {
                search: search || undefined,
                estado: filter || undefined
            };
            const response = await api.get('/employees/', { params });
            setEmployees(response.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setCurrentEmployee(null);
        setIsModalOpen(true);
    };

    const handleEdit = (employee) => {
        setCurrentEmployee(employee);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este empleado?')) {
            try {
                await api.delete(`/employees/${id}`);
                fetchEmployees();
            } catch (error) {
                console.error('Error deleting employee:', error);
                alert('Error al eliminar empleado');
            }
        }
    };

    const handleSave = async (data) => {
        try {
            if (currentEmployee) {
                await api.put(`/employees/${currentEmployee.id}`, data);
            } else {
                await api.post('/employees/', data);
            }
            setIsModalOpen(false);
            fetchEmployees();
        } catch (error) {
            console.error('Error saving employee:', error);
            alert('Error al guardar empleado');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Empleados</h1>
                    <p className="text-slate-500">Gestión de personal y terminales asignadas</p>
                </div>
                {hasRole(['admin', 'rrhh']) && (
                    <button className="btn-primary" onClick={handleCreate}>
                        <Plus size={20} />
                        <span>Nuevo Empleado</span>
                    </button>
                )}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o cargo..."
                        className="input-field pl-10"
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
                        <option value="activo">Activos</option>
                        <option value="inactivo">Inactivos</option>
                    </select>
                    <button className="btn-secondary px-3">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* Employees Table/Grid */}
            <div className="glass-card overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Empleado</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cargo / Ubicación</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Dispositivo / Línea</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Empresa</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-6"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                                        <td className="px-6 py-6"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                                        <td className="px-6 py-6"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                                        <td className="px-6 py-6"><div className="h-6 bg-slate-200 rounded-full w-16 mx-auto"></div></td>
                                        <td className="px-6 py-6"><div className="h-8 bg-slate-200 rounded-lg w-8 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                                        <Users size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>No se encontraron empleados</p>
                                    </td>
                                </tr>
                            ) : (
                                employees.map((employee) => (
                                    <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                                    {employee.nombre_completo.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{employee.nombre_completo}</p>
                                                    <p className="text-xs text-slate-500">ID: #{employee.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm text-slate-600">
                                                <span className="flex items-center gap-1.5 font-medium">
                                                    <Briefcase size={14} className="text-slate-400" />
                                                    {employee.cargo || 'N/A'}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs">
                                                    <MapPin size={14} className="text-slate-400" />
                                                    {employee.ubicacion || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm">
                                                <span className="font-medium text-slate-800">{employee.dispositivo_actual || 'Sin asignar'}</span>
                                                <span className="text-xs text-slate-500">{employee.linea_actual || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600 italic">{employee.empresa || 'New Century'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${employee.estado === 'activo'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {employee.estado === 'activo' ? <UserCheck size={12} /> : <UserX size={12} />}
                                                {employee.estado.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEdit(employee)}
                                                    className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-primary-600 transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(employee.id)}
                                                    className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-red-600 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-900 transition-all">
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                            <button className="p-2 text-slate-400 lg:hidden">
                                                <MoreVertical size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Info */}
                {!loading && employees.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium tracking-wide mb-0">
                        <span>MOSTRANDO {employees.length} EMPLEADOS</span>
                        <div className="flex gap-2">
                            <button disabled className="px-3 py-1 rounded border border-slate-200 bg-white disabled:opacity-50">Anterior</button>
                            <button disabled className="px-3 py-1 rounded border border-slate-200 bg-white disabled:opacity-50">Siguiente</button>
                        </div>
                    </div>
                )}
            </div>

            <EmployeeModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave} 
                employee={currentEmployee} 
            />
        </div>
    );
};

export default Employees;
