// src/lib/components/MessageModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';
import api from '../apis/axios';

export default function MessageModal({ demandeId, demandeTitle, isOpen, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen && demandeId) {
            fetchMessages();
        }
    }, [isOpen, demandeId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        try {
            const response = await api.get(`/api/messages/${demandeId}`);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        setLoading(true);
        try {
            await api.post(`/api/messages/${demandeId}`, { message: newMessage });
            setNewMessage('');
            fetchMessages();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-md h-96 flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-semibold">💬 Discussion - {demandeTitle}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-400 text-sm py-8">
                            Aucun message. Commencez la discussion!
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.user_id === JSON.parse(localStorage.getItem('user'))?.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-2 rounded-lg ${msg.user_id === JSON.parse(localStorage.getItem('user'))?.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                    <p className="text-xs font-medium mb-1">{msg.user?.name}</p>
                                    <p className="text-sm">{msg.message}</p>
                                    <p className="text-[10px] opacity-70 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Écrivez votre message..."
                        className="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <button onClick={handleSend} disabled={loading} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}