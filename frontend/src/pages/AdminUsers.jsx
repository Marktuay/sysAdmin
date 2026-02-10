import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
    Users,
    Search,
    Plus,
    Edit2,
    History,
    MoreVertical,
    Shield,
    Key,
    UserCheck,
    Lock
} from 'lucide-react';
import UserModal from '../components/UserModal';
import UserActivityModal from '../components/UserActivityModal';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const { hasRole } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Redirigir si no es admin, aunque Sidebar lo oculte
        if (!hasRole('admin')) {
            navigate('/');
            return;
        }
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users/');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setCurrentUser(null);
        setIsUserModalOpen(true);
    };

    const handleEdit = (user) => {
        setCurrentUser(user);
        setIsUserModalOpen(true);
    };

    const handleViewActivity = (user) => {
        setCurrentUser(user);
        setIsActivityModalOpen(true);
    };

    const handleSaveUser = async (data) => {
        try {
            // Eliminar password si está vacío en edición para no enviarlo o evitar error de validación
            const payload = { ...data };
            if (!payload.password && currentUser) {
                delete payload.password;
            }

            if (currentUser) {
                await api.put(`/users/${currentUser.id}`, payload);
            } else {
                await api.post('/users/', payload);
            }
            setIsUserModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            alert(error.response?.data?.detail || 'Error al guardar usuario');
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    const getRoleBadge = (role) => {
        // Asegurar que el rol sea minúsculas para buscar en styles
        const roleKey = role ? role.toLowerCase() : 'supervisor';
        const styles = {
            admin: 'bg-purple-100 text-purple-700',
            rrhh: 'bg-blue-100 text-blue-700',
            supervisor: 'bg-green-100 text-green-700',
            contabilidad: 'bg-orange-100 text-orange-700',
            auditoria: 'bg-slate-100 text-slate-700'
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${styles[roleKey] || styles['supervisor']}`}>
                <Shield size={10} />
                {role}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Administración de Usuarios</h1>
                    <p className="text-slate-500">Gestión de accesos y perfiles del sistema</p>
                </div>
                <button onClick={handleCreate} className="btn-primary">
                    <Plus size={20} />
                    <span>Nuevo Usuario</span>
                </button>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <Search className="text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por usuario o email..."
                    className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Usuario</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Email</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Rol</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Último Acceso</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400">Cargando...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400">No se encontraron usuarios</td></tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-slate-900">{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {/* Aquí podríamos mostrar last_login si lo tuviéramos en UserResponse, por ahora dejamos pendiente o usamos updated_at */}
                                            {new Date(user.updated_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleViewActivity(user)}
                                                    className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-600 transition-all"
                                                    title="Ver Historial"
                                                >
                                                    <History size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-primary-600 transition-all"
                                                    title="Editar Perfil"
                                                >
                                                    <Edit2 size={18} />
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

            <UserModal 
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSave={handleSaveUser}
                user={currentUser}
            />

            <UserActivityModal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                userId={currentUser?.id}
                userName={currentUser?.username}
            />
        </div>
    );
};

export default AdminUsers;
