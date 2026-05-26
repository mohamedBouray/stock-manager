import React, { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "../../lib/apis/axios";

function ResetPassword() {
    const { token } = useParams(); 
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email"); 
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            await api.post("/api/reset-password", {
                token,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });

            setMessage("Mot de passe modifié avec succès ! Redirection vers la page de connexion...");
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError("Une erreur est survenue lors de la réinitialisation du mot de passe.");
            }
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

            {/* Reset Password Card */}
            <div className="bg-white rounded-[4px] shadow-md border-t-6 border-[#006233] border-b-3 border-[#c1272d] w-full max-w-[450px] p-7.5 my-7.5 box-border">
                <div className="text-center mb-6">
                    <div className="text-36px mb-2">🔒</div>
                    <h2 className="m-0 text-22px text-[#111] font-bold uppercase tracking-[0.5px]">Nouveau Mot de Passe</h2>
                    <p className="m-0 mt-1.5 text-13px text-[#777] font-medium">Saisissez vos nouveaux identifiants de sécurité</p>
                </div>

                {message && <div className="bg-[#d4edda] text-[#155724] p-2.5 rounded-[3px] mb-3.5 text-13px text-center font-medium">{message}</div>}
                {error && <div className="bg-[#f8d7da] text-[#721c24] p-2.5 rounded-[3px] mb-3.5 text-13px text-center font-medium">{error}</div>}

                <form onSubmit={handleReset} className="flex flex-col gap-4">
                    {/* New Password */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-13px font-semibold text-[#444]">Nouveau mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full p-2.5 border border-gray-300 rounded-[4px] outline-none focus:border-[#006233]"
                            required
                        />
                    </div>

                    {/* Confirm Password */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-13px font-semibold text-[#444]">Confirmation du mot de passe</label>
                        <input
                            type="password"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            placeholder="••••••••"
                            className="w-full p-2.5 border border-gray-300 rounded-[4px] outline-none focus:border-[#006233]"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#006233] text-white border border-[#004d26] p-3 text-15px font-bold rounded-[3px] cursor-pointer shadow-sm hover:bg-[#004d26] transition-colors mt-2 disabled:opacity-50 uppercase tracking-[0.5px]"
                    >
                        {loading ? "Mise à jour..." : "Modifier le mot de passe"}
                    </button>
                </form>
            </div>

            {/* Footer */}
            <div className="w-full text-center text-11px text-[#888] py-3.5 border-t border-[#e0e0e0] bg-[#f9f9f9]">
                Tous droits réservés &copy; {new Date().getFullYear()} - Application de Gestion de Stock & Magasin ISTAHT
            </div>
        </div>
    );
}

export default ResetPassword;