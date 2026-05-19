import { useState } from "react";
export default function dashbaord() {
      const [isLoggingOut, setIsLoggingOut] = useState(false);
        const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    await api.post('/api/logout', {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } catch (e) {
                    console.error('Erreur déconnexion API:', e);
                }
            }
        } catch (e) {
            console.error('Erreur déconnexion:', e);
        } finally {
            // Clear all localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Force hard reload to clear all state
            window.location.href = '/login';
        }
    };
    return (
        <div>
            <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full bg-transparent border border-red-500/50 rounded-lg py-1.5 text-xs font-semibold text-red-300 cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 hover:bg-red-500/10 hover:border-red-500"
            >
            Deconnection
            </button>
        </div>
    );
}