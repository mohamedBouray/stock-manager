
import React from 'react';
import { useNavigate } from 'react-router-dom';
// CCC
export default function ChooseRole() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'user',
      name: 'Demandeur',
      icon: '📋',
      description: 'Accès aux demandes internes et réservations',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    },
    {
      id: 'magasinier',
      name: 'Magasinier',
      icon: '📦',
      description: 'Accès à la gestion des stocks, inventaire et alertes',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700'
    }
  ];

  const handleSelectRole = (roleId) => {
    // Sauvegarder le rôle choisi dans localStorage temporairement
    localStorage.setItem('selected_role', roleId);
    // Rediriger vers register
    navigate('/register');
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

      {/* Choose Role Card */}
      <div className="bg-white rounded-[4px] shadow-md border-t-6 border-[#006233] border-b-3 border-[#c1272d] w-full max-w-[800px] p-7.5 my-7.5 box-border">
        <div className="text-center mb-8">
          <div className="text-48px mb-3">👋</div>
          <h2 className="text-24px font-bold text-[#111] uppercase tracking-[0.5px]">Choisissez votre profil</h2>
          <p className="text-13px text-[#777] font-medium mt-2">
            Sélectionnez le type de compte que vous souhaitez créer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleSelectRole(role.id)}
              className={`group relative p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${role.bgColor} ${role.borderColor}`}
            >
              <div className="text-center">
                <div className="text-56px mb-4">{role.icon}</div>
                <h3 className={`text-xl font-bold mb-2 ${role.textColor}`}>{role.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-sm ${role.textColor} font-medium`}>
                  <span>Créer un compte</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Back to Login */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <span className="text-13px text-gray-500">Vous avez déjà un compte ? </span>
          <button
            onClick={() => navigate("/login")}
            className="text-[#006233] text-13px font-bold hover:underline cursor-pointer bg-transparent border-none"
          >
            Se connecter
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