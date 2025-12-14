

import React, { useState } from 'react';
import { ArkCard, ArkButton, ArkPageHeader } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { Bell, Info, AlertTriangle, Trash2, MailOpen, FileText } from 'lucide-react';
import { useNotification } from './NotificationSystem';

export const MessageCenter: React.FC = () => {
    const { lang, messages, markAllRead, deleteMessage, toggleRead } = useApp();
    const { notify } = useNotification();
    const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'security'>('all');

    const filteredMessages = messages.filter(msg => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !msg.read;
        return msg.type === filter;
    });

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'security': return <AlertTriangle className="text-ark-danger" size={18} />;
            case 'report': return <FileText className="text-ark-primary" size={18} />;
            default: return <Info className="text-ark-subtext" size={18} />;
        }
    };

    const handleDelete = (id: string) => {
        deleteMessage(id);
        notify('success', t('op_success', lang), t('op_item_deleted', lang));
    };

    return (
        <div className="flex flex-col h-full bg-ark-bg border border-ark-border overflow-hidden">
            <ArkPageHeader 
                icon={<Bell size={24} />} 
                title={t('mc_title', lang)} 
                subtitle={t('mc_subtitle', lang)}
                extra={
                    <ArkButton variant="ghost" size="sm" onClick={markAllRead}>
                        <MailOpen size={14} className="mr-2" /> {t('mc_mark_all_read', lang)}
                    </ArkButton>
                }
            />

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Sidebar Filter */}
                <div className="w-full md:w-64 bg-ark-panel border-b md:border-b-0 md:border-r border-ark-border p-4 flex flex-row md:flex-col gap-2 overflow-x-auto shrink-0">
                    <button 
                        onClick={() => setFilter('all')}
                        className={`text-left px-4 py-3 text-sm font-bold border-l-2 transition-all flex justify-between items-center ${filter === 'all' ? 'bg-ark-active/20 text-ark-primary border-ark-primary' : 'bg-transparent text-ark-subtext border-transparent hover:bg-ark-active/10 hover:text-ark-text'}`}
                    >
                        {t('mc_filter_all', lang)}
                        <span className="text-xs bg-ark-bg px-2 py-0.5 rounded-full opacity-70">{messages.length}</span>
                    </button>
                    <button 
                        onClick={() => setFilter('unread')}
                        className={`text-left px-4 py-3 text-sm font-bold border-l-2 transition-all flex justify-between items-center ${filter === 'unread' ? 'bg-ark-active/20 text-ark-primary border-ark-primary' : 'bg-transparent text-ark-subtext border-transparent hover:bg-ark-active/10 hover:text-ark-text'}`}
                    >
                        {t('mc_filter_unread', lang)}
                        <span className="text-xs bg-ark-bg px-2 py-0.5 rounded-full opacity-70">{messages.filter(m => !m.read).length}</span>
                    </button>
                    <div className="h-[1px] bg-ark-border my-2 hidden md:block"></div>
                    <button 
                        onClick={() => setFilter('system')}
                        className={`text-left px-4 py-3 text-sm font-bold border-l-2 transition-all ${filter === 'system' ? 'bg-ark-active/20 text-ark-primary border-ark-primary' : 'bg-transparent text-ark-subtext border-transparent hover:bg-ark-active/10 hover:text-ark-text'}`}
                    >
                        {t('mc_filter_system', lang)}
                    </button>
                    <button 
                        onClick={() => setFilter('security')}
                        className={`text-left px-4 py-3 text-sm font-bold border-l-2 transition-all ${filter === 'security' ? 'bg-ark-active/20 text-ark-primary border-ark-primary' : 'bg-transparent text-ark-subtext border-transparent hover:bg-ark-active/10 hover:text-ark-text'}`}
                    >
                        {t('mc_filter_security', lang)}
                    </button>
                </div>

                {/* Message List */}
                <div className="flex-1 bg-ark-bg/30 p-4 md:p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {filteredMessages.length > 0 ? filteredMessages.map(msg => (
                            <ArkCard key={msg.id} className={`transition-all duration-300 ${!msg.read ? 'border-l-4 border-l-ark-primary shadow-sm' : 'opacity-80 hover:opacity-100'}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-full shrink-0 ${msg.type === 'security' ? 'bg-red-500/10' : 'bg-ark-active/20'}`}>
                                        {getTypeIcon(msg.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`text-base font-bold ${!msg.read ? 'text-ark-text' : 'text-ark-subtext'}`}>
                                                {msg.title}
                                                {!msg.read && <span className="ml-2 w-2 h-2 inline-block bg-ark-primary rounded-full animate-pulse"></span>}
                                            </h3>
                                            <span className="text-xs font-mono text-ark-subtext whitespace-nowrap ml-4">{msg.time}</span>
                                        </div>
                                        <p className="text-sm text-ark-text/80 leading-relaxed mb-3">
                                            {msg.content}
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-mono uppercase tracking-wider text-ark-subtext bg-ark-bg px-2 py-0.5 rounded-sm border border-ark-border">
                                                {msg.type === 'system' ? t('mc_type_system', lang) : msg.type === 'security' ? t('mc_type_security', lang) : t('mc_type_report', lang)}
                                            </span>
                                            <div className="flex-1"></div>
                                            <button 
                                                onClick={() => toggleRead(msg.id)}
                                                className="text-xs text-ark-primary hover:underline font-mono"
                                            >
                                                {msg.read ? t('mc_mark_unread', lang) : t('mc_mark_read', lang)}
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(msg.id)}
                                                className="text-ark-subtext hover:text-ark-danger transition-colors flex items-center gap-1 text-xs"
                                            >
                                                <Trash2 size={14} /> {t('mc_delete', lang)}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </ArkCard>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-20 text-ark-subtext opacity-50">
                                <Bell size={48} className="mb-4" />
                                <p className="font-mono text-lg">{t('mc_empty', lang)}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};