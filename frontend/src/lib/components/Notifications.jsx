import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, XCircle, Info, Trash2, X } from 'lucide-react';
import api from '../apis/axios';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 10000);
        
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        
        return () => {
            clearInterval(interval);
            document.removeEventListener('mousedown', handler);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/api/notifications');
            setNotifications(response.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/api/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error(error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.post(`/api/notifications/${id}/read`);
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            console.error(error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/api/notifications/read-all');
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            console.error(error);
        }
    };

    const getIcon = (type) => {
        switch(type) {
            case 'demande_approuvee': return <CheckCircle size={16} className="text-green-500" />;
            case 'demande_refusee': return <XCircle size={16} className="text-red-500" />;
            case 'stock_alerte': return <Info size={16} className="text-orange-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    // Desktop dropdown
    if (!isMobile) {
        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 rounded-lg hover:bg-white/10 transition"
                >
                    <Bell size={18} className="text-white" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllAsRead} 
                                    className="text-xs text-blue-500 hover:text-blue-600 transition"
                                >
                                    Tout marquer lu
                                </button>
                            )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                    Aucune notification
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${!notif.is_read ? 'bg-blue-50' : ''}`}
                                        onClick={() => markAsRead(notif.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            {getIcon(notif.type)}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {new Date(notif.created_at).toLocaleString('fr-FR')}
                                                </p>
                                            </div>
                                            {!notif.is_read && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Mobile version - Modal fullscreen
    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="relative p-2 rounded-lg"
            >
                <Bell size={18} className="text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-white z-50 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
                        <h3 className="font-semibold text-gray-800 text-base">Notifications</h3>
                        <div className="flex items-center gap-3">
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllAsRead} 
                                    className="text-xs text-blue-500"
                                >
                                    Tout marquer lu
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="p-1">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <Bell size={48} className="text-gray-300 mb-3" />
                                <p className="text-gray-400">Aucune notification</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`px-4 py-3 border-b border-gray-100 active:bg-gray-50 transition ${!notif.is_read ? 'bg-blue-50' : ''}`}
                                    onClick={() => {
                                        markAsRead(notif.id);
                                        setIsOpen(false);
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        {getIcon(notif.type)}
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {new Date(notif.created_at).toLocaleString('fr-FR')}
                                            </p>
                                        </div>
                                        {!notif.is_read && (
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </>
    );
}