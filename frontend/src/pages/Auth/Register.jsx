// src/pages/Auth/Register.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/apis/axios";

function Register({ hasUsers }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "user",
    });
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
        const selectedRole = localStorage.getItem('selected_role');
        console.log("Rôle sélectionné:", selectedRole);
        
        if (selectedRole === 'magasinier') {
            setFormData(prev => ({ ...prev, role: 'magasinier' }));
        } else if (selectedRole === 'user') {
            setFormData(prev => ({ ...prev, role: 'user' }));
        }
        
        localStorage.removeItem('selected_role');
    }, []);

    const isFirstRegistration = !hasUsers;

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: "" });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccessMessage("");
        
        let dataToSend;
        if (isFirstRegistration) {
            dataToSend = { ...formData, role: "admin" };
        } else {
            dataToSend = formData;
        }
        
        console.log("Données envoyées au backend:", dataToSend);
        
        try {
            const response = await api.post("/api/register", dataToSend);
            
            const roleName = dataToSend.role === 'magasinier' ? 'Magasinier' : 
                           dataToSend.role === 'admin' ? 'Administrateur' : 'Demandeur';
            setSuccessMessage(`Compte ${roleName} créé avec succès ! Redirection en cours...`);
            
            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));
            }
            
            setTimeout(() => {
                if (response.data.user.email_verified_at === null) {
                    navigate("/verify-email", { replace: true, state: { email: formData.email } });
                } else {
                    const role = response.data.user.role;
                    if (role === 'admin') navigate("/admin/dashboard");
                    else if (role === 'magasinier') navigate("/magasinier/dashboard");
                    else navigate("/user/dashboard");
                }
            }, 1500);

        } catch (error) {
            console.error(error);
            if (error.response && error.response.data.errors) {
                setErrors(error.response.data.errors);
            } else if (error.response && error.response.data.message) {
                setErrors({ global: error.response.data.message });
            } else {
                setErrors({ global: "Une erreur est survenue. Veuillez réessayer." });
            }
        } finally {
            setLoading(false);
        }
    };

    const getRoleTitle = () => {
        if (isFirstRegistration) return "Initialisation du Système";
        const role = formData.role;
        if (role === 'magasinier') return "Création de compte Magasinier";
        return "Création de compte Demandeur";
    };

    const getRoleSubtitle = () => {
        if (isFirstRegistration) return "Configuration de l'administrateur principal";
        const role = formData.role;
        if (role === 'magasinier') return "Accès à la gestion des stocks, inventaire et alertes";
        return "Accès aux demandes internes et réservations";
    };

    return (
        <div className="bg-[#f4f6f9] min-h-screen flex flex-col items-center justify-between font-sans p-2.5 box-border" dir="ltr">
            {/* Header */}
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

            {/* Register Card */}
            <div className="bg-white rounded-[4px] shadow-md border-t-6 border-[#006233] border-b-3 border-[#c1272d] w-full max-w-[500px] p-7.5 my-7.5 box-border">
                <div className="text-center mb-[25px] border-b border-[#eee] pb-3.5">
                    <div className="text-48px mb-2">{formData.role === 'magasinier' ? '📦' : '📋'}</div>
                    <h2 className="text-22px text-[#111] font-bold uppercase tracking-[0.5px]">
                        {getRoleTitle()}
                    </h2>
                    <h3 className="mt-1.5 text-13px text-[#777] font-medium">
                        {getRoleSubtitle()}
                    </h3>
                </div>

                {successMessage && (
                    <div className="bg-[#d4edda] text-[#155724] p-2.5 rounded-[3px] mb-3.5 text-13px text-center font-medium">
                        {successMessage}
                    </div>
                )}
                {errors.global && (
                    <div className="bg-[#f8d7da] text-[#721c24] p-2.5 rounded-[3px] mb-3.5 text-13px text-center font-medium">
                        {errors.global}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-13px font-semibold text-[#444]">Nom Complet <span className="text-[#c1272d]">*</span></label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="p-2.5 text-14px border border-[#ccc] rounded-[3px] bg-[#fcfcfc] outline-none focus:border-[#006233]" placeholder="Nom complet" required />
                        {errors.name && <span className="text-[#c1272d] text-11px mt-0.5">{errors.name[0]}</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-13px font-semibold text-[#444]">Adresse Électronique <span className="text-[#c1272d]">*</span></label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="p-2.5 text-14px border border-[#ccc] rounded-[3px] bg-[#fcfcfc] outline-none focus:border-[#006233]" placeholder="email@example.com" required />
                        {errors.email && <span className="text-[#c1272d] text-11px mt-0.5">{errors.email[0]}</span>}
                    </div>

                    <input type="hidden" name="role" value={formData.role} />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-13px font-semibold text-[#444]">Mot de Passe <span className="text-[#c1272d]">*</span></label>
                        <div className="relative w-full flex items-center">
                            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="w-full p-2.5 pr-10 text-14px border border-[#ccc] rounded-[3px] bg-[#fcfcfc] outline-none focus:border-[#006233]" placeholder="••••••••" required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-gray-500 hover:text-[#006233] focus:outline-none bg-transparent border-none p-0 cursor-pointer">
                                {showPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                        </div>
                        {errors.password && <span className="text-[#c1272d] text-11px mt-0.5">{errors.password[0]}</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-13px font-semibold text-[#444]">Confirmation du Mot de Passe <span className="text-[#c1272d]">*</span></label>
                        <div className="relative w-full flex items-center">
                            <input type={showConfirmPassword ? "text" : "password"} name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} className="w-full p-2.5 pr-10 text-14px border border-[#ccc] rounded-[3px] bg-[#fcfcfc] outline-none focus:border-[#006233]" placeholder="••••••••" required />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 text-gray-500 hover:text-[#006233] focus:outline-none bg-transparent border-none p-0 cursor-pointer">
                                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="bg-[#006233] text-white border border-[#004d26] p-3 text-15px font-bold rounded-[3px] cursor-pointer mt-2.5 shadow-sm hover:bg-[#004d26] transition-colors duration-200 uppercase tracking-[0.5px] disabled:opacity-50">
                        {loading ? "Chargement..." : "Créer le compte"}
                    </button>
                </form>

                <div className="text-center mt-5 pt-4 border-t border-gray-200">
                    <span className="text-13px text-gray-500">Vous avez déjà un compte ? </span>
                    <button onClick={() => navigate("/login")} className="text-[#006233] text-13px font-bold hover:underline cursor-pointer bg-transparent border-none">Se connecter</button>
                </div>
            </div>

            <div className="w-full text-center text-11px text-[#888] py-3.5 border-t border-[#e0e0e0] bg-[#f9f9f9]">
                Tous droits réservés &copy; {new Date().getFullYear()} - Application de Gestion de Stock & Magasin ISTAHT
            </div>
        </div>
    );
}

export default Register;