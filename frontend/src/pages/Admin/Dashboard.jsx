// src/pages/Admin/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/apis/axios';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");
            await api.post("/api/logout", {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login", { replace: true });
        }
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold text-[#1A237E] mb-4">
                    Dashboard Administrateur
                </h1>
                <p className="text-gray-600 mb-4">
                    Bienvenue, {user?.name || 'Administrateur'} !
                </p>
                <p className="text-gray-500 mb-6">
                    Vous avez accès à l'ensemble des fonctionnalités de gestion.
                </p>
                <button
                    onClick={handleLogout}
                    className="bg-[#C0392B] text-white px-4 py-2 rounded-lg hover:bg-[#a11f24] transition-colors"
                >
                    Se déconnecter
                </button>
            </div>
        </div>
    );
}