import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../lib/apis/axios"; 

function VerifyEmail() {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || "l'adresse électronique sélectionnée";
    const [code, setCode] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");

        try {
            const token = localStorage.getItem("token");
            const response = await api.post("/api/email/verify-code", { code }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.message === "Success") {
                localStorage.setItem("user", JSON.stringify(response.data.user));
                setMessage("Votre compte a été vérifié avec succès ! Redirection...");
                const user = response.data.user;
                if (user.role === 'admin') navigate("/admin/dashboard");
                else if (user.role === 'magasinier') navigate("/magasinier/dashboard");
                else navigate("/user/dashboard");
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError("Une erreur est survenue lors de la vérification. Veuillez réessayer.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        setMessage("");
        setError("");
        try {
            const token = localStorage.getItem("token");
            await api.post("/api/email/resend-code", {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage("Un nouveau code de vérification a été envoyé à votre adresse.");
        } catch (err) {
            setError("Impossible d'envoyer le code. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#f4f6f9] min-h-screen flex flex-col items-center justify-between font-sans p-2.5 box-border" dir="ltr">
            {/* Header Administratif Officiel avec Logos */}
            <div className="w-full max-w-[1000px] flex justify-between items-center border-b-3 border-[#006233] py-4 px-4 bg-white shadow-sm rounded-[4px] mt-4">
                {/* Logo Ministère (Gauche) */}
                <div className="flex items-center justify-start w-1/3">
                    <img 
                        src="/image/LOGO.png" 
                        alt="Ministère du Tourisme" 
                        className="h-[75px] w-auto object-contain"
                    />
                </div>
                
                {/* Titre Central */}
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

                {/* Logo ISTAHT (Droite) */}
                <div className="flex items-center justify-end w-1/3">
                    <img 
                        src="/image/ISTAHT.png" 
                        alt="ISTAHT de Tanger" 
                        className="h-[75px] w-auto object-contain"
                    />
                </div>
            </div>

            {/* Card Content */}
            <div className="bg-white rounded-[4px] shadow-md border-t-6 border-[#006233] border-b-3 border-[#c1272d] w-full max-w-[550px] p-7.5 my-7.5 box-border text-center">
                <h2 className="m-0 text-22px text-[#111] font-bold mb-1.5 uppercase tracking-[0.5px]">Vérification par Code OTP</h2>
                <h3 className="m-0 text-13px text-[#777] font-medium mb-5">Validation de l'adresse électronique</h3>
                
                <p className="text-14px text-[#444] leading-6 mb-5">
                    Un code de vérification à 6 chiffres a été envoyé à l'adresse suivante :<br />
                    <b className="text-[#006233] inline-block mt-1">{email}</b>
                </p>

                {/* Form OTP Input */}
                <form onSubmit={handleVerify} className="mb-5">
                    <input 
                        type="text" 
                        maxLength="6"
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full text-center tracking-[10px] text-24px font-bold border-2 border-gray-300 p-2.5 rounded-[4px] mb-4 focus:border-[#006233] outline-none"
                        required
                    />
                    <button 
                        type="submit"
                        disabled={loading || code.length !== 6}
                        className="w-full bg-[#006233] text-white border border-[#004d26] p-3 text-14px font-bold rounded-[3px] cursor-pointer shadow-sm hover:bg-[#004d26] transition-colors disabled:opacity-50 uppercase tracking-[0.5px]"
                    >
                        {loading ? "Vérification..." : "Vérifier le Code"}
                    </button>
                </form>

                {message && <div className="bg-[#d4edda] text-[#155724] border border-[#c3e6cb] p-3 rounded-[3px] mb-4 text-13px font-medium">{message}</div>}
                {error && <div className="bg-[#f8d7da] text-[#721c24] border border-[#f5c6cb] p-3 rounded-[3px] mb-4 text-13px font-medium">{error}</div>}

                <div className="flex flex-col gap-3 mt-4 border-t border-[#eee] pt-4">
                    <button 
                        type="button"
                        onClick={handleResend} 
                        disabled={loading}
                        className="text-[#006233] text-13px font-bold hover:underline cursor-pointer bg-transparent border-none"
                    >
                        Renvoyer un nouveau code
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => navigate("/login")} 
                        className="bg-gray-100 text-gray-700 border border-gray-300 p-2.5 text-13px font-semibold rounded-[3px] cursor-pointer hover:bg-gray-200"
                    >
                        Retour à la page de connexion
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

export default VerifyEmail;