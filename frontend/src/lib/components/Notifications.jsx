// src/lib/components/Notifications.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, XCircle, Info, Trash2 } from 'lucide-react';
import api from '../apis/axios';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 10000);
        
        return () => clearInterval(interval);
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
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition"
            >
                <Bell size={18} className="text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-xs text-blue-500 hover:text-blue-600">
                                Tout marquer lu
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm">Aucune notification</div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${!notif.is_read ? 'bg-blue-50' : ''}`}
                                    onClick={() => markAsRead(notif.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        {getIcon(notif.type)}
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                                        </div>
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