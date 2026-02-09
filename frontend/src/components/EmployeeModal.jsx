import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, History } from 'lucide-react';
import api from '../services/api';

const EmployeeModal = ({ isOpen, onClose, onSave, employee }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        nombre_completo: '',
        cargo: '',
        departamento: '',
        ubicacion: '',
        empresa: '',
        estado: 'activo',
        new_plan_id: '',
        initial_plan_id: ''
    });
    
    const [plans, setPlans] = useState([]);
    const [history, setHistory] = useState([]);
    const [currentPlan, setCurrentPlan] = useState(null);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await api.get('/plans/');
                setPlans(response.data);
            } catch (error) {
                console.error("Error fetching plans", error);
            }
        };
        fetchPlans();
    }, []);

    useEffect(() => {
        if (employee) {
            setFormData({
                nombre_completo: employee.nombre_completo || '',
                cargo: employee.cargo || '',
                departamento: employee.departamento || '',
                ubicacion: employee.ubicacion || '',
                empresa: employee.empresa || '',
                estado: employee.estado || 'activo',
                new_plan_id: '' // Start empty unless user changes it
            });

            // Parse current plan from text if available (hacky but works given list structure)
            // Ideally we pass full object logic, but let's see. 
            // In list logic we have: linea_actual = "Number - Plan Name ($Cost)"
            // But we can also fetch detail to get real plan ID.
            fetchEmployeeDetail(employee.id);

        } else {
             setFormData({
                nombre_completo: '',
                cargo: '',
                departamento: '',
                ubicacion: '',
                empresa: '',
                estado: 'activo',
                initial_plan_id: ''
            });
            setHistory([]);
            setCurrentPlan(null);
        }
    }, [employee]);

    const fetchEmployeeDetail = async (id) => {
        try {
            const response = await api.get(`/employees/${id}`);
            const data = response.data;
            
            // Check for active assignment/plan
            if (data.dispositivos_asignados && data.dispositivos_asignados.length > 0) {
                 // We need to fetch the device details to see the plan_id safely, 
                 // or maybe we rely on history/context.
                 // For now, let's look at recent history or assignments.
                 // Actually the endpoint returns list of devices but not their plan IDs in "dispositivos_asignados".
                 // We might need to fetch the device itself or upgrade the endpoint.
                 // Quick fix: User can select a NEW plan. We don't necessarily need to pre-select current perfectly if complex.
                 // But better UX: let's try to find it.
                 // Actually, let's just show history and allow picking a plan.
            }

            const historyRes = await api.get(`/employees/${id}/history`);
            setHistory(historyRes.data);
            
            // Try to find the plan of the active device.
            // Since we don't have it easily in the simple schema, we will just allow selecting a "New Plan".
            
        } catch (error) {
            console.error("Error details", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">
                        {employee ? 'Editar Empleado' : 'Nuevo Empleado'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Nombre Completo <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="nombre_completo"
                            required
                            className="input-field"
                            value={formData.nombre_completo}
                            onChange={handleChange}
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Cargo</label>
                            <input
                                type="text"
                                name="cargo"
                                className="input-field"
                                value={formData.cargo}
                                onChange={handleChange}
                                placeholder="Ej. Supervisor"
                            />
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-medium text-slate-700">Departamento</label>
                            <input
                                type="text"
                                name="departamento"
                                className="input-field"
                                value={formData.departamento}
                                onChange={handleChange}
                                placeholder="Ej. Ventas"
                            />
                        </div>
                    </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Ubicación</label>
                            <input
                                type="text"
                                name="ubicacion"
                                className="input-field"
                                value={formData.ubicacion}
                                onChange={handleChange}
                                placeholder="Ej. Oficina Central"
                            />
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-medium text-slate-700">Empresa</label>
                            <input
                                type="text"
                                name="empresa"
                                className="input-field"
                                value={formData.empresa}
                                onChange={handleChange}
                                placeholder="Ej. New Century"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Estado</label>
                        <select
                            name="estado"
                            className="input-field"
                            value={formData.estado}
                            onChange={handleChange}
                        >
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                        </select>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                            <label className="text-sm font-medium text-slate-700 block">
                                {employee ? 'Actualizar Plan (Dispositivo Actual)' : 'Plan Inicial'}
                            </label>
                            <div className="text-xs text-slate-500 mb-2">
                                {employee 
                                    ? 'Seleccione un plan para actualizar el dispositivo activo.' 
                                    : 'Seleccione un plan para asignar inmediatamente (creará un dispositivo genérico).'
                                }
                            </div>
                            <select
                                name={employee ? "new_plan_id" : "initial_plan_id"}
                                className="input-field"
                                value={employee ? formData.new_plan_id : formData.initial_plan_id}
                                onChange={handleChange}
                            >
                                <option value="">-- {employee ? 'Mantener Plan Actual' : 'Sin Plan Inicial'} --</option>
                                {plans.map(plan => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.nombre} (${plan.costo_mensual})
                                    </option>
                                ))}
                            </select>
                    </div>
                    
                    {employee && history.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <History size={16}/> Historial de Asignaciones
                            </h3>
                            <div className="bg-slate-50 rounded-lg p-3 max-h-40 overflow-y-auto text-xs">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-slate-400 border-b border-slate-200">
                                            <th className="pb-2 font-medium">Dispositivo</th>
                                            <th className="pb-2 font-medium">Asignado</th>
                                            <th className="pb-2 font-medium">Devuelto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((h) => (
                                            <tr key={h.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-100">
                                                <td className="py-2">{h.device_name}</td>
                                                <td className="py-2">{h.fecha_asignacion}</td>
                                                <td className="py-2">{h.fecha_devolucion || <span className="text-green-600 font-bold">Activo</span>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary">
                            <Save size={18} />
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeModal;