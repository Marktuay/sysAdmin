import React, { useState, useEffect } from 'react';
import { X, Save, Smartphone } from 'lucide-react';

const DeviceModal = ({ isOpen, onClose, onSave, device }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        marca: '',
        modelo: '',
        imei: '',
        numero_telefono: '',
        costo_inicial: '',
        fecha_compra: '',
        estado_fisico: 'nuevo',
        estado: 'disponible'
    });

    const [showDepreciationAlert, setShowDepreciationAlert] = useState(false);
    const [residualValue, setResidualValue] = useState(0);
    const [isSimOnly, setIsSimOnly] = useState(false);

    const calculateDepreciation = (cost, dateStr) => {
        if (!cost || !dateStr) return 0;
        const purchaseDate = new Date(dateStr);
        const now = new Date();
        const diffTime = Math.abs(now - purchaseDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const monthsUsed = diffDays / 30; // Aproximación consistente con backend
        
        const vidaUtilMeses = 36;
        const depMensual = cost / vidaUtilMeses;
        const depAcumulada = depMensual * monthsUsed;
        
        let valor = cost - depAcumulada;
        return valor > 0 ? valor : 0;
    };

    useEffect(() => {
        if (device) {
            const isSim = device.marca === 'SIM CARD' || device.modelo === 'Línea Telefónica';
            setIsSimOnly(isSim);
            setFormData({
                marca: device.marca || '',
                modelo: device.modelo || '',
                imei: device.imei || '',
                numero_telefono: device.numero_telefono || '',
                costo_inicial: device.costo_inicial || '',
                fecha_compra: device.fecha_compra || '',
                estado_fisico: device.estado_fisico || 'nuevo',
                estado: device.estado || 'disponible'
            });
        } else {
            setIsSimOnly(false);
            setFormData({
                marca: '',
                modelo: '',
                imei: '',
                numero_telefono: '',
                costo_inicial: '',
                fecha_compra: new Date().toISOString().split('T')[0],
                estado_fisico: 'nuevo',
                estado: 'disponible'
            });
        }
    }, [device]);

    useEffect(() => {
        // Calcular valor residual si hay estado de daño o perdida (baja)
        if (formData.estado_fisico === 'dañado' || formData.estado === 'baja') {
            const val = calculateDepreciation(formData.costo_inicial, formData.fecha_compra);
            setResidualValue(val);
            setShowDepreciationAlert(true);
        } else {
            setShowDepreciationAlert(false);
        }
    }, [formData.estado_fisico, formData.estado, formData.costo_inicial, formData.fecha_compra]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Smartphone size={20} className="text-primary-600" />
                        {device ? 'Editar Dispositivo' : 'Nuevo Dispositivo'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {!device && (
                        <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <input
                                type="checkbox"
                                id="isSimOnly"
                                checked={isSimOnly}
                                onChange={(e) => {
                                    setIsSimOnly(e.target.checked);
                                    if (e.target.checked) {
                                        setFormData(prev => ({
                                            ...prev,
                                            marca: 'SIM CARD',
                                            modelo: 'Línea Telefónica',
                                            estado_fisico: 'nuevo',
                                            costo_inicial: 0,
                                            imei: '',
                                            estado: 'disponible'
                                        }));
                                    } else {
                                        setFormData(prev => ({
                                            ...prev,
                                            marca: '',
                                            modelo: ''
                                        }));
                                    }
                                }}
                                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <label htmlFor="isSimOnly" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                                Registrar solo línea (Sin equipo físico)
                            </label>
                        </div>
                    )}

                    {!isSimOnly && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Marca <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="marca"
                                    required={!isSimOnly}
                                    className="input-field"
                                    value={formData.marca}
                                    onChange={handleChange}
                                    placeholder="Ej. Samsung"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Modelo <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="modelo"
                                    required={!isSimOnly}
                                    className="input-field"
                                    value={formData.modelo}
                                    onChange={handleChange}
                                    placeholder="Ej. Galaxy S24+"
                                />
                            </div>
                        </div>
                    )}
                    
                    {!isSimOnly && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-sm font-medium text-slate-700">IMEI</label>
                            <input
                                type="text"
                                name="imei"
                                className="input-field"
                                value={formData.imei}
                                onChange={handleChange}
                                placeholder="Identificador único"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Número Telefónico</label>
                            <input
                                type="text"
                                name="numero_telefono"
                                className="input-field"
                                value={formData.numero_telefono}
                                onChange={handleChange}
                                placeholder="Ej. 88888888"
                            />
                        </div>
                        {!isSimOnly && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                             <label className="text-sm font-medium text-slate-700">Costo Inicial ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                name="costo_inicial"
                                required={!isSimOnly}
                                className="input-field"
                                value={formData.costo_inicial}
                                onChange={handleChange}
                            />
                        </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Fecha {isSimOnly ? 'Adquisición' : 'Compra'}</label>
                            <input
                                type="date"
                                name="fecha_compra"
                                required
                                className="input-field"
                                value={formData.fecha_compra}
                                onChange={handleChange}
                            />
                        </div>
                        {!isSimOnly && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                             <label className="text-sm font-medium text-slate-700">Estado Físico</label>
                            <select
                                name="estado_fisico"
                                className="input-field"
                                value={formData.estado_fisico}
                                onChange={handleChange}
                            >
                                <option value="nuevo">Nuevo</option>
                                <option value="usado">Usado</option>
                                <option value="dañado">Dañado</option>
                            </select>
                        </div>
                        )}
                    </div>

                    {!isSimOnly && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-sm font-medium text-slate-700">Estado Inventario</label>
                        <select
                            name="estado"
                            className="input-field"
                            value={formData.estado}
                            onChange={handleChange}
                        >
                            <option value="disponible">Disponible</option>
                            <option value="asignado">Asignado</option>
                            <option value="baja">De Baja</option>
                        </select>
                    </div>
                    )}

                    {showDepreciationAlert && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4 animate-in fade-in zoom-in duration-200">
                            <h4 className="text-red-800 font-bold flex items-center gap-2">
                                <span>⚠️</span> Cobro por {formData.estado === 'baja' ? 'Pérdida/Robo' : 'Daño'}
                            </h4>
                            <p className="text-red-700 text-sm mt-2">
                                El dispositivo ha sido reportado como <strong>{formData.estado === 'baja' ? 'DE BAJA' : 'DAÑADO'}</strong>.
                                <br/>
                                <br/>
                                Valor residual a cobrar al empleado:
                            </p>
                            <p className="text-3xl font-bold text-red-600 mt-2">
                                ${residualValue.toFixed(2)}
                            </p>
                            <p className="text-xs text-red-500 mt-1 opacity-75">
                                * Calculado según método de línea recta (36 meses) basado en fecha de compra: {formData.fecha_compra}.
                            </p>
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

export default DeviceModal;