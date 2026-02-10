import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await api.post('/auth/login', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const { access_token } = response.data;
            localStorage.setItem('token', access_token);

            // Obtener datos del usuario actual
            const userResponse = await api.get('/auth/me');
            const userData = userResponse.data;

            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.detail || 'Error al iniciar sesión'
            };
        }
    };

    const logout = async () => {
        try {
            // Intentar registrar logout en backend (fire and forget)
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Error logging out on server:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const hasRole = (roles) => {
        if (!user) return false;
        if (Array.isArray(roles)) {
            return roles.includes(user.role);
        }
        return user.role === roles;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, hasRole, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
