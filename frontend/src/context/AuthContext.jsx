import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../lib/apis/axios';

const AuthContext = createContext();
// CCC
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        const userString = localStorage.getItem('user');
        if (userString && token) {
            try {
                setUser(JSON.parse(userString));
            } catch (e) {
                console.error(e);
            }
        }
        setLoading(false);
    }, [token]);

    const login = (userData, userToken) => {
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
    };

    const logout = async () => {
        try {
            await api.post('/api/logout');
        } catch (e) {
            console.error(e);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
            window.location.href = '/login';
        }
    };

    const updateUser = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, loading, token, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};