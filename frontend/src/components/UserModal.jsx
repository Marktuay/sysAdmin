import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Shield, Key } from 'lucide-react';

const UserModal = ({ isOpen, onClose, onSave, user }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'supervisor'
    });

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username,
                email: user.email,
                role: user.role,
                password: '' // Password empty on edit
            });
        } else {
            setFormData({
                username: '',
                email: '',
                password: '',
                role: 'supervisor'
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <User size={20} className="text-primary-600" />
                        {user ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Nombre de Usuario</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                name="username"
                                required
                                className="input-field !pl-10"
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="email"
                                name="email"
                                required
                                className="input-field !pl-10"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Rol</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                name="role"
                                className="input-field !pl-10"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="admin">Administrador</option>
                                <option value="rrhh">Recursos Humanos</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="contabilidad">Contabilidad</option>
                                <option value="auditoria">Auditoría</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                            {user ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                        </label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                name="password"
                                required={!user}
                                className="input-field !pl-10"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={user ? "Dejar vacío para mantener actual" : "Mínimo 6 caracteres"}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
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

export default UserModal;
