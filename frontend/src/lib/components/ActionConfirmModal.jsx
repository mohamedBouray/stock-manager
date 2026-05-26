import React from 'react';
import { AlertCircle, X, Trash2, Ban, CheckCircle, Edit, Key, Archive, Download, RefreshCw } from 'lucide-react';

const ActionConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    type = 'danger', 
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    icon: CustomIcon,
    darkMode = false 
}) => {
    if (!isOpen) return null;

    // Configuration selon le type
    const config = {
        danger: {
            iconBg: darkMode ? 'bg-red-900/30' : 'bg-red-100',
            iconColor: darkMode ? 'text-red-400' : 'text-red-600',
            confirmBtn: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
            defaultIcon: Trash2
        },
        warning: {
            iconBg: darkMode ? 'bg-orange-900/30' : 'bg-orange-100',
            iconColor: darkMode ? 'text-orange-400' : 'text-orange-600',
            confirmBtn: 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800',
            defaultIcon: AlertCircle
        },
        success: {
            iconBg: darkMode ? 'bg-emerald-900/30' : 'bg-emerald-100',
            iconColor: darkMode ? 'text-emerald-400' : 'text-emerald-600',
            confirmBtn: 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800',
            defaultIcon: CheckCircle
        },
        info: {
            iconBg: darkMode ? 'bg-blue-900/30' : 'bg-blue-100',
            iconColor: darkMode ? 'text-blue-400' : 'text-blue-600',
            confirmBtn: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
            defaultIcon: AlertCircle
        }
    };

    const cfg = config[type] || config.danger;
    const Icon = CustomIcon || cfg.defaultIcon;

    const modalBgClass = darkMode ? 'bg-[#1A1A1A]' : 'bg-white';
    const textTitleClass = darkMode ? 'text-gray-100' : 'text-gray-900';
    const textMessageClass = darkMode ? 'text-gray-400' : 'text-gray-600';
    const closeButtonClass = darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600';
    const cancelButtonClass = darkMode 
        ? 'border-[#333] text-gray-300 hover:bg-[#252525]' 
        : 'border-gray-300 text-gray-700 hover:bg-gray-50';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`relative ${modalBgClass} rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-fadeIn border ${darkMode ? 'border-[#2A2A2A]' : 'border-gray-100'}`}>
                <button 
                    onClick={onClose} 
                    className={`cursor-pointer absolute top-4 right-4 ${closeButtonClass} transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525]`}
                >
                    <X size={20}/>
                </button>
                
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-full ${cfg.iconBg}`}>
                        <Icon className={cfg.iconColor} size={24}/>
                    </div>
                    <h3 className={`text-lg font-bold ${textTitleClass}`}>{title}</h3>
                </div>
                
                <p className={`${textMessageClass} mb-6 text-sm`}>{message}</p>
                
                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={onClose} 
                        className={`cursor-pointer px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${cancelButtonClass}`}
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={() => { 
                            onConfirm(); 
                            onClose(); 
                        }} 
                        className={`cursor-pointer px-5 py-2.5 ${cfg.confirmBtn} text-white rounded-xl font-medium text-sm transition-all shadow-md`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActionConfirmModal;