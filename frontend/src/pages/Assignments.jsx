import React, { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';
import api from '../services/api';
import {
    FileText,
    Plus,
    Search,
    Download,
    RotateCcw,
    CheckCircle2,
    Clock,
    User,
    Smartphone,
    Calendar,
    AlertCircle,
    X,
    FileDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Assignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [devices, setDevices] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedDevice, setSelectedDevice] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const { hasRole } = useAuth();
    const debouncedSearch = useDebounce(search, 500);

    useEffect(() => {
        fetchAssignments();
        if (showModal) {
            fetchModalData();
        }
    }, [showModal, debouncedSearch]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/assignments/', {
                params: { 
                    search: search || undefined,
                    limit: 1000
                }
            });
            setAssignments(response.data);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchModalData = async () => {
        try {
            const [empRes, devRes] = await Promise.all([
                api.get('/employees/', { params: { estado: 'activo' } }),
                api.get('/devices/', { params: { estado: 'disponible' } })
            ]);
            setEmployees(empRes.data);
            setDevices(devRes.data);
        } catch (error) {
            console.error('Error fetching modal data:', error);
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        if (!selectedEmployee || !selectedDevice) return;

        try {
            setIsSubmitting(true);
            await api.post('/assignments/', {
                employee_id: parseInt(selectedEmployee),
                device_id: parseInt(selectedDevice),
                fecha_asignacion: new Date().toISOString().split('T')[0],
                observaciones: observaciones
            });
            setShowModal(false);
            setSelectedEmployee('');
            setSelectedDevice('');
            setObservaciones('');
            fetchAssignments();
        } catch (error) {
            alert(error.response?.data?.detail || 'Error al crear asignación');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReturnAction = async (assignmentId) => {
        const obs = prompt('Observaciones de devolución:');
        if (obs === null) return;

        try {
            await api.put(`/assignments/${assignmentId}/return`, {
                observaciones: obs,
                fecha_devolucion: new Date().toISOString().split('T')[0]
            });
            fetchAssignments();
        } catch (error) {
            alert(error.response?.data?.detail || 'Error al devolver dispositivo');
        }
    };

    const downloadPDF = async (assignment) => {
        try {
            // Determinar tipo de documento: remisión si ya fue devuelto, sino entrega
            // Preferimos remision si existe, ya que suele contener info de entrega también o es el cierre
            const docType = assignment.fecha_devolucion ? 'remision' : 'entrega';
            
            // Usamos axios (api) para incluir el token de autenticación
            const response = await api.get(`/assignments/${assignment.id}/pdf/${docType}`, {
                responseType: 'blob'
            });
            
            // Crear URL temporal para el blob
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            
            // Abrir en nueva pestaña
            window.open(url, '_blank');
            
            // Opcional: limpiar URL después de un tiempo, pero window.open puede tardar
            // setTimeout(() => window.URL.revokeObjectURL(url), 100);
            
        } catch (error) {
            console.error('Error downloading PDF:', error);
            const msg = error.response?.data?.detail || 'Error descargando el documento.';
            alert(msg);
        }
    };

    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            const response = await api.get('/assignments/export', {
                params: { 
                    search: search || undefined
                },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'asignaciones.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting assignments:', error);
            alert('Error al exportar asignaciones.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Asignaciones</h1>
                    <p className="text-slate-500">Historial de entrega y devolución de equipos</p>
                </div>
                {hasRole(['admin', 'rrhh']) && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportExcel}
                            disabled={isExporting}
                            className="btn-secondary"
                        >
                            <FileDown size={20} />
                            <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'Exportar Excel'}</span>
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-primary"
                        >
                            <Plus size={20} />
                            <span>Nueva Asignación</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por empleado, dispositivo, IMEI o número..."
                    className="input-field !pl-10 w-full md:w-1/2 lg:w-1/3"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-blue-500">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Activas</p>
                        <p className="text-2xl font-bold text-slate-900">{assignments.filter(a => !a.fecha_devolucion).length}</p>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-green-500">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Devueltas</p>
                        <p className="text-2xl font-bold text-slate-900">{assignments.filter(a => a.fecha_devolucion).length}</p>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-primary-500">
                    <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Total Actas</p>
                        <p className="text-2xl font-bold text-slate-900">{assignments.length}</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Detalle Asignación</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Empleado / Cargo</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Fecha Entrega</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Estado</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [1, 2, 3, 4].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : assignments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                                        <History size={48} className="mx-auto mb-4 opacity-10" />
                                        <p>No hay historial de asignaciones</p>
                                    </td>
                                </tr>
                            ) : (
                                assignments.map((assignment) => (
                                    <tr key={assignment.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                                    <Smartphone size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{assignment.device?.marca} {assignment.device?.modelo}</p>
                                                    <p className="text-xs text-slate-500">IMEI: {assignment.device?.imei || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-900">{assignment.employee?.nombre_completo}</span>
                                                <span className="text-xs text-slate-500">{assignment.employee?.cargo}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar size={14} className="text-slate-400" />
                                                {assignment.fecha_asignacion ? new Date(assignment.fecha_asignacion).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {!assignment.fecha_devolucion ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                    <Clock size={12} /> EN USO
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                    <CheckCircle2 size={12} /> DEVUELTO
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => downloadPDF(assignment)}
                                                    className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-primary-600 transition-all"
                                                    title="Imprimir Acta"
                                                >
                                                    <Download size={18} />
                                                </button>
                                                {!assignment.fecha_devolucion && hasRole(['admin', 'rrhh']) && (
                                                    <button
                                                        onClick={() => handleReturnAction(assignment.id)}
                                                        className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-orange-600 transition-all font-bold"
                                                        title="Procesar Devolución"
                                                    >
                                                        <RotateCcw size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Assignment Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
                        <div className="bg-primary-600 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Plus size={24} />
                                </div>
                                <h3 className="text-xl font-bold">Nueva Asignación</h3>
                            </div>
                            <button onClick={() => setShowModal(false)} className="hover:bg-white/10 p-2 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAssignment} className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Seleccionar Empleado</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        className="input-field !pl-10"
                                        value={selectedEmployee}
                                        onChange={(e) => setSelectedEmployee(e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccione un empleado activo...</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.nombre_completo} ({emp.cargo})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Seleccionar Dispositivo Disponible</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        className="input-field !pl-10"
                                        value={selectedDevice}
                                        onChange={(e) => setSelectedDevice(e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccione un equipo disponible...</option>
                                        {devices.map(dev => (
                                            <option key={dev.id} value={dev.id}>{dev.marca} {dev.modelo} - {dev.numero_telefono || 'S/N'}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Observaciones de Entrega</label>
                                <textarea
                                    className="input-field min-h-[100px] py-3"
                                    placeholder="Estado físico del equipo, accesorios incluidos, etc."
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary flex-1 py-3"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !selectedEmployee || !selectedDevice}
                                    className="btn-primary flex-1 py-3"
                                >
                                    {isSubmitting ? 'Procesando...' : 'Confirmar Entrega'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assignments;
