// src/pages/Admin/LogsSysteme.jsx
import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, Download, Trash2, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function LogsSysteme() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const fetchLogs = async () => {
        try {
            const params = filter !== 'all' ? { action_type: filter } : {};
            const response = await api.get('/api/admin/logs', { params });
            setLogs(response.data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getLevelIcon = (action) => {
        if (action.includes('error') || action.includes('failed')) return <XCircle size={14} className="text-red-500" />;
        if (action.includes('success') || action.includes('created')) return <CheckCircle size={14} className="text-green-500" />;
        if (action.includes('warning') || action.includes('alert')) return <AlertCircle size={14} className="text-yellow-500" />;
        return <Info size={14} className="text-blue-500" />;
    };

    const filteredLogs = logs.filter(log =>
        search === '' ||
        log.details?.toLowerCase().includes(search.toLowerCase()) ||
        log.action?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">📋 Logs système</h1>
                <p className="text-sm text-gray-500 mt-1">Historique des activités et événements</p>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-3 mb-6">
                <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>Tous</button>
                <button onClick={() => setFilter('login')} className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Connexions</button>
                <button onClick={() => setFilter('security')} className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'security' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}>Sécurité</button>
                <button onClick={() => setFilter('profile')} className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'profile' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>Profils</button>
                <div className="flex-1 max-w-xs relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-sm" />
                </div>
                <button className="px-3 py-1.5 border rounded-lg text-sm flex items-center gap-1"><Download size={14} /> Exporter</button>
            </div>

            {/* Tableau des logs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Utilisateur</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Détails</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">IP</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Aucun log trouvé</td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">{log.user?.name || 'Système'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getLevelIcon(log.action)}
                                                <span>{log.action}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 max-w-md truncate">{log.details || '-'}</td>
                                        <td className="px-6 py-4 text-xs font-mono">{log.ip_address || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}