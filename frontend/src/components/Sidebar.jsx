import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Smartphone,
    History,
    FileText,
    LogOut,
    Menu,
    X,
    User as UserIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/', roles: ['admin', 'rrhh', 'supervisor', 'contabilidad', 'auditoria'] },
        { name: 'Empleados', icon: <Users size={20} />, path: '/employees', roles: ['admin', 'rrhh', 'supervisor', 'contabilidad', 'auditoria'] },
        { name: 'Dispositivos', icon: <Smartphone size={20} />, path: '/devices', roles: ['admin', 'rrhh', 'supervisor', 'contabilidad', 'auditoria'] },
        { name: 'Líneas Libres', icon: <Smartphone size={20} className="text-green-500" />, path: '/available-lines', roles: ['admin', 'rrhh', 'supervisor'] },
        { name: 'Asignaciones', icon: <History size={20} />, path: '/assignments', roles: ['admin', 'rrhh'] },
        { name: 'Reportes', icon: <FileText size={20} />, path: '/reports', roles: ['admin', 'contabilidad', 'auditoria'] },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed top-0 left-0 bottom-0 bg-white border-r border-slate-200 w-64 z-50 transition-transform duration-300 lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-xl text-primary-600">
                            <Smartphone className="text-primary-500" />
                            <span>SysAdmin</span>
                        </div>
                        <button onClick={toggleSidebar} className="lg:hidden text-slate-500">
                            <X size={20} />
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="p-6 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                                <UserIcon size={20} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-semibold text-slate-900 truncate">{user?.username || 'Usuario'}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{user?.role}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {filteredItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all",
                                    isActive
                                        ? "bg-primary-50 text-primary-700 shadow-sm"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                                onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-slate-100">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg font-medium text-red-600 hover:bg-red-50 transition-all"
                        >
                            <LogOut size={20} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
