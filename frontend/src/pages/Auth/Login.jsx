// src/pages/Auth/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, X, Shield, Ban } from 'lucide-react';
import api from "../../lib/apis/axios";

// Modal pour compte bloqué
function BlockedModal({ isOpen, onClose, email }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-fadeIn border border-red-100">
                <button 
                    onClick={onClose} 
                    className="cursor-pointer absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                >
                    <X size={20}/>
                </button>
                
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-full bg-red-100">
                        <Ban className="text-red-600" size={24}/>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Compte bloqué</h3>
                </div>
                
                <div className="space-y-3">
                    <p className="text-gray-600 text-sm">
                        ⛔ Votre compte <strong className="text-red-600">{email}</strong> a été bloqué par l'administrateur.
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={16} className="text-red-600 mt-0.5" />
                            <div className="text-xs text-red-700">
                                <p className="font-semibold mb-1">Actions recommandées :</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Contactez l'administrateur du système</li>
                                    <li>Email : <span className="font-mono">admin@istaht.ma</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-3 justify-end mt-6">
                    <button 
                        onClick={onClose} 
                        className="cursor-pointer flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium"
                    >
                        Fermer
                    </button>
                    <button 
                        onClick={() => window.location.href = 'mailto:admin@istaht.ma'} 
                        className="cursor-pointer flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all shadow-md"
                    >
                        Contacter le support
                    </button>
                </div>
            </div>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}} .animate-fadeIn{animation:fadeIn .2s ease-out}`}</style>
        </div>
    );
}

function Login({ hasUsers }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [blockedModalOpen, setBlockedModalOpen] = useState(false);
    const [blockedEmail, setBlockedEmail] = useState("");

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('blocked') === 'true') {
            const userString = localStorage.getItem('user');
            if (userString) {
                try {
                    const user = JSON.parse(userString);
                    setBlockedEmail(user.email || '');
                    setBlockedModalOpen(true);
                } catch (e) {}
            }
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } else if (params.get('forbidden') === 'true') {
            setError("⛔ Accès non autorisé. Veuillez vous reconnecter.");
        }
    }, [location]);

    if (hasUsers === false) {
        navigate("/register", { replace: true });
        return null;
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await api.post("/api/login", {
                email,
                password,
            });

            if (response.data.token) {
                if (response.data.user.is_blocked === true) {
                    setBlockedEmail(email);
                    setBlockedModalOpen(true);
                    setLoading(false);
                    return;
                }

                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));

                if (response.data.user.email_verified_at === null) {
                    navigate("/verify-email", { state: { email: response.data.user.email } });
                } else {
                    const role = response.data.user.role;
                    if (role === 'admin') {
                        navigate("/admin/dashboard");
                    } else if (role === 'magasinier') {
                        navigate("/magasinier/dashboard");
                    } else {
                        navigate("/user/dashboard");
                    }
                }
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data) {
                if (err.response.status === 403 || 
                    err.response.data.message?.includes("bloqué")) {
                    setBlockedEmail(email);
                    setBlockedModalOpen(true);
                } else if (err.response.data.message) {
                    setError(err.response.data.message);
                } else {
                    setError("Adresse électronique ou mot de passe incorrect.");
                }
            } else {
                setError("Adresse électronique ou mot de passe incorrect.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#f4f6f9] min-h-screen flex flex-col items-center justify-between font-sans p-2.5 box-border" dir="ltr">
            <BlockedModal 
                isOpen={blockedModalOpen}
                onClose={() => setBlockedModalOpen(false)}
                email={blockedEmail}
            />

            {/* Header - reste identique */}
            <div className="w-full max-w-[1000px] flex justify-between items-center border-b-3 border-[#006233] py-4 px-4 bg-white shadow-sm rounded-[4px] mt-4">
                <div className="flex items-center justify-start w-1/3">
                    <img src="/image/LOGO.png" alt="Ministère du Tourisme" className="h-[75px] w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
                </div>
                <div className="flex flex-col items-center w-1/3 text-center">
                    <div className="text-16px font-bold text-[#006233] uppercase tracking-[0.5px]">
                        Plateforme de Gestion de Magasin
                    </div>
                    <div className="text-13px text-[#555] font-semibold mt-1">
                        Contrôle des Stocks & Logistique
                    </div>
                    <div className="text-11px text-[#888] italic mt-0.5">
                        ISTAHT TANGER
                    </div>
                </div>
                <div className="flex items-center justify-end w-1/3">
                    <img src="/image/ISTAHT.png" alt="ISTAHT de Tanger" className="h-[75px] w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
                </div>
            </div>

            {/* Login Card - reste identique */}
            <div className="bg-white rounded-[4px] shadow-md border-t-6 border-[#006233] border-b-3 border-[#c1272d] w-full max-w-[450px] p-7.5 my-7.5 box-border">
                <div className="text-center mb-6">
                    <h2 className="text-22px text-[#111] font-bold uppercase tracking-[0.5px]">Connexion</h2>
                    <h3 className="text-13px text-[#777] font-medium">Authentification à votre espace</h3>
                </div>

                {error && (
                    <div className="bg-[#f8d7da] text-[#721c24] border border-[#f5c6cb] p-3 rounded-[3px] mb-4 text-13px text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-13px font-semibold text-[#444]">Adresse Électronique</label>
                        <input
                            type="email"
                            placeholder="example@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-[4px] outline-none focus:border-[#006233]"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-13px font-semibold text-[#444]">Mot de passe</label>
                            <span 
                                onClick={() => navigate("/forgot-password")} 
                                className="text-12px text-[#006233] hover:underline cursor-pointer font-medium"
                            >
                                Mot de passe oublié ?
                            </span>
                        </div>
                        
                        <div className="relative w-full flex items-center">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2.5 pr-10 border border-gray-300 rounded-[4px] outline-none focus:border-[#006233]"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 text-gray-500 hover:text-[#006233] focus:outline-none bg-transparent border-none p-0 cursor-pointer"
                            >
                                {showPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#006233] text-white border border-[#004d26] p-3 text-15px font-bold rounded-[3px] cursor-pointer shadow-sm hover:bg-[#004d26] transition-colors mt-2 disabled:opacity-50 uppercase tracking-[0.5px]"
                    >
                        {loading ? "Connexion en cours..." : "Se connecter"}
                    </button>
                </form>

                <div className="text-center mt-5 pt-4 border-t border-gray-200">
                    <span className="text-13px text-gray-500">Vous n'avez pas de compte ? </span>
                    <button
                        type="button"
                        onClick={() => navigate("/choose-role")}
                        className="text-[#006233] text-13px font-bold hover:underline cursor-pointer bg-transparent border-none"
                    >
                        Créer un compte
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="w-full text-center text-11px text-[#888] py-3.5 border-t border-[#e0e0e0] bg-[#f9f9f9]">
                Tous droits réservés &copy; {new Date().getFullYear()} - Application de Gestion de Stock & Magasin ISTAHT
            </div>
        </div>
    );
}

export default Login;