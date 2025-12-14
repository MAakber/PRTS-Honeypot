
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArkButton, ArkPageHeader, ArkInput, ArkCard } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { FileText, Bell, Webhook, Database, Key, LayoutGrid, Clock, Share2, Save, Terminal, Shield, Plus, Copy, RefreshCw, Trash2, ExternalLink, Mail, HardDrive, Lock, Image, MapPin, Radio, Upload, User, LogIn, Activity, Users, X } from 'lucide-react';
import { useNotification } from './NotificationSystem';

const ConfigTab: React.FC<{ 
    label: string, 
    icon: React.ReactNode, 
    active: boolean, 
    onClick: () => void 
}> = ({ label, icon, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`
            flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all duration-200 
            md:border-l-2 md:border-b-0 border-b-2 w-full text-left whitespace-nowrap md:whitespace-normal
            ${active 
                ? 'bg-ark-active/20 text-ark-primary border-ark-primary md:shadow-[inset_-10px_0_20px_-10px_rgba(35,173,229,0.1)]' 
                : 'bg-transparent text-ark-subtext border-transparent hover:text-ark-text hover:bg-ark-active/5'
            }
        `}
    >
        <div className={active ? 'text-ark-primary' : 'text-ark-subtext'}>{icon}</div>
        <span>{label}</span>
    </button>
);

// Toggle Switch Component
const ToggleSwitch: React.FC<{ checked: boolean, onChange: () => void }> = ({ checked, onChange }) => (
    <div 
        onClick={onChange}
        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-300 ${checked ? 'bg-ark-primary' : 'bg-ark-subtext/30'}`}
    >
        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
);

// Mock Login Logs
const MOCK_LOGIN_LOGS = [
    { id: 1, time: '2025-12-06 10:23:45', ip: '192.168.1.50', status: 'success', device: 'Chrome 118 / Windows 10' },
    { id: 2, time: '2025-12-05 18:12:11', ip: '192.168.1.55', status: 'failure', device: 'Firefox 115 / Linux' },
    { id: 3, time: '2025-12-05 09:30:00', ip: '10.0.0.5', status: 'success', device: 'Safari / macOS' },
    { id: 4, time: '2025-12-04 14:22:33', ip: '192.168.1.50', status: 'success', device: 'Chrome 118 / Windows 10' },
    { id: 5, time: '2025-12-04 11:05:10', ip: '172.16.0.2', status: 'failure', device: 'Unknown / Android' },
];

export const SystemConfig: React.FC = () => {
    const { lang, user } = useApp();
    const { notify } = useNotification();
    const [activeTab, setActiveTab] = useState('notification');
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // API State
    const [apiEnabled, setApiEnabled] = useState(true);
    const [apiKeys, setApiKeys] = useState([
        { id: 'ak_1001', key: 'prts_sk_9a8b...1f2e', desc: 'Main Server Link', created: '2025/11/20', status: 'active' },
        { id: 'ak_1002', key: 'prts_sk_3c4d...5g6h', desc: 'Log Collector', created: '2025/11/22', status: 'active' },
        { id: 'ak_1003', key: 'prts_sk_7i8j...9k0l', desc: 'Dev Test', created: '2025/12/01', status: 'revoked' },
    ]);

    // Notif State
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [syslogEnabled, setSyslogEnabled] = useState(true);

    // Tracing State
    const [traceEnabled, setTraceEnabled] = useState(true);

    // Login Management State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // User Management State
    const [userList, setUserList] = useState([
        { id: 1, username: 'admin', role: 'admin', status: 'active', lastLogin: '2025-12-06 10:23:45' },
        { id: 2, username: 'operator01', role: 'operator', status: 'active', lastLogin: '2025-12-05 09:30:00' },
    ]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ username: '', password: '', role: 'admin' });

    // Database Connection State
    const [dbType, setDbType] = useState<'sqlite' | 'mysql'>('sqlite');
    const [mysqlConfig, setMysqlConfig] = useState({ host: '127.0.0.1', port: '3306', user: 'root', pass: '', db: 'prts_honeypot' });
    const [sqlitePath, setSqlitePath] = useState('./data/prts.db');

    const handleSave = () => {
        setIsSaving(true);
        // Simulate save operation
        setTimeout(() => {
            setIsSaving(false);
            notify('success', t('op_success', lang), t('op_save_success', lang));
        }, 1000);
    };

    const handleUpdateCredentials = () => {
        if (!newPassword || !confirmPassword) {
            notify('warning', t('op_failed', lang), t('val_pwd_empty', lang));
            return;
        }
        if (newPassword !== confirmPassword) {
            notify('error', t('op_failed', lang), t('val_pwd_mismatch', lang));
            return;
        }
        notify('success', t('op_success', lang), t('op_pwd_updated', lang));
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleGenerateKey = () => {
        const newKey = {
            id: `ak_${1000 + apiKeys.length + 1}`,
            key: `prts_sk_${Math.random().toString(36).substring(7)}...${Math.random().toString(36).substring(7)}`,
            desc: 'New Access Key',
            created: new Date().toLocaleDateString(),
            status: 'active'
        };
        setApiKeys([...apiKeys, newKey]);
        notify('success', t('op_success', lang), t('op_key_generated', lang));
    };

    const handleDeleteKey = (id: string) => {
        setApiKeys(apiKeys.filter(k => k.id !== id));
        notify('error', t('op_success', lang), t('op_item_deleted', lang));
    };
    
    const handleRevokeKey = (id: string) => {
        setApiKeys(apiKeys.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
        notify('warning', t('op_success', lang), t('op_key_revoked', lang));
    };

    const handleSync = () => {
        if (isSyncing) return;
        setIsSyncing(true);
        // Simulate real synchronization delay
        setTimeout(() => {
            setIsSyncing(false);
            notify('info', t('op_success', lang), t('op_sync_success', lang));
        }, 1500);
    };

    const handleCleanDb = () => {
        notify('warning', t('op_success', lang), t('op_db_cleaned', lang));
    };

    // User Management Handlers
    const handleDeleteUser = (id: number) => {
        setUserList(prev => prev.filter(u => u.id !== id));
        notify('error', t('op_success', lang), t('op_user_deleted', lang));
    };

    const handleCreateUser = () => {
        if (!newUserForm.username || !newUserForm.password) {
            notify('warning', t('op_failed', lang), t('val_user_req', lang));
            return;
        }
        const newUser = {
            id: userList.length + 1,
            username: newUserForm.username,
            role: newUserForm.role,
            status: 'active',
            lastLogin: '--'
        };
        setUserList([...userList, newUser]);
        setShowUserModal(false);
        setNewUserForm({ username: '', password: '', role: 'admin' });
        notify('success', t('op_success', lang), t('op_user_created', lang));
    };

    const tabs = [
        { id: 'intel', label: t('sc_tab_intel', lang), icon: <FileText size={18} /> },
        { id: 'notification', label: t('sc_tab_notification', lang), icon: <Bell size={18} /> },
        { id: 'api', label: t('sc_tab_api', lang), icon: <Webhook size={18} /> },
        { id: 'db', label: t('sc_tab_db', lang), icon: <Database size={18} /> },
        { id: 'login', label: t('sc_tab_login', lang), icon: <Key size={18} /> },
        { id: 'custom', label: t('sc_tab_custom', lang), icon: <LayoutGrid size={18} /> },
        { id: 'ntp', label: t('sc_tab_ntp', lang), icon: <Clock size={18} /> },
        { id: 'tracing', label: t('sc_tab_tracing', lang), icon: <Share2 size={18} /> },
    ];

    return (
        <div className="flex flex-col h-full bg-ark-bg border border-ark-border overflow-hidden">
            <ArkPageHeader 
                icon={<LayoutGrid size={24} />} 
                title={t('sc_title', lang)} 
                subtitle={t('sc_subtitle', lang)}
            />

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Sidebar / Top Menu */}
                <div className="w-full md:w-64 bg-ark-panel border-b md:border-b-0 md:border-r border-ark-border flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto custom-scrollbar shrink-0">
                    <div className="hidden md:block p-4 text-xs font-mono text-ark-subtext uppercase tracking-widest border-b border-ark-border bg-ark-bg/30">
                        {t('module_selection', lang)}
                    </div>
                    {tabs.map(tab => (
                        <div key={tab.id} className="min-w-[160px] md:min-w-0 flex-shrink-0">
                            <ConfigTab 
                                label={tab.label} 
                                icon={tab.icon} 
                                active={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                            />
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-ark-bg/50 p-4 md:p-8 overflow-y-auto custom-scrollbar relative">
                    
                    {/* ... (Existing tabs: Intel, API, Notification, DB) ... */}
                    {activeTab === 'intel' && (
                        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <ArkCard className="min-h-[400px]">
                                <div className="border-b border-ark-border pb-4 mb-6 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-ark-text flex items-center gap-2">
                                        <Shield size={20} className="text-ark-primary" />
                                        {t('sc_intel_header', lang)}
                                    </h3>
                                    <div className="text-xs font-mono text-ark-subtext px-2 py-1 border border-ark-border rounded-sm whitespace-nowrap">
                                        {t('status_active_upper', lang)}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 items-start md:items-center">
                                        <label className="text-sm font-bold text-ark-subtext md:text-right">{t('sc_intel_provider', lang)}</label>
                                        <div className="md:col-span-2">
                                            <div className="relative">
                                                <select className="w-full bg-transparent border-b-2 border-ark-border px-3 py-2 text-sm outline-none focus:border-ark-primary transition-colors text-ark-text appearance-none rounded-none">
                                                    <option>{t('sc_intel_source_threatbook', lang)}</option>
                                                </select>
                                                <div className="absolute right-0 bottom-0 h-[2px] w-0 bg-ark-primary transition-all duration-300 peer-focus:w-full"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 items-start md:items-center">
                                        <label className="text-sm font-bold text-ark-subtext md:text-right">{t('sc_intel_api_addr', lang)}</label>
                                        <div className="md:col-span-2">
                                            <ArkInput defaultValue="https://api.threatbook.cn" className="bg-transparent" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 items-start md:items-center">
                                        <label className="text-sm font-bold text-ark-subtext md:text-right">{t('sc_intel_api_key', lang)}</label>
                                        <div className="md:col-span-2">
                                            <ArkInput type="password" defaultValue="7d991********5ea26" className="bg-transparent" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 flex justify-end gap-3 pt-6 border-t border-ark-border/50">
                                    <ArkButton variant="ghost" size="sm">
                                        {t('sc_btn_test', lang)}
                                    </ArkButton>
                                    <ArkButton variant="primary" size="sm" onClick={handleSave} loading={isSaving}>
                                        <Save size={16} className="mr-2" /> {t('sc_btn_save', lang)}
                                    </ArkButton>
                                </div>
                            </ArkCard>
                        </div>
                    )}

                    {activeTab === 'api' && (
                         <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                             <ArkCard title={t('sc_api_title', lang)} sub={t('sc_api_subtitle', lang)}>
                                 <div className="space-y-6">
                                     <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border border-ark-border bg-ark-bg/30">
                                         <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto overflow-hidden">
                                             <div className="p-3 bg-ark-active/20 rounded-full text-ark-primary border border-ark-primary/30 shrink-0">
                                                 <Webhook size={20} />
                                             </div>
                                             <div className="flex flex-col items-center sm:items-start min-w-0 w-full text-center sm:text-left">
                                                 <h4 className="font-bold text-ark-text whitespace-nowrap">{t('sc_api_enable', lang)}</h4>
                                                 <div className="text-xs text-ark-subtext font-mono mt-1 flex flex-wrap justify-center sm:justify-start items-center gap-2 w-full">
                                                     <span className="whitespace-nowrap shrink-0">{t('sc_api_base_url', lang)}</span>
                                                     <div className="flex items-center gap-2 max-w-full min-w-0">
                                                         <span className="text-ark-primary bg-ark-active/10 px-1 rounded truncate select-all max-w-[180px] sm:max-w-none">https://prts.local:8080/api/v1</span>
                                                         <button className="hover:text-ark-primary transition-colors shrink-0"><Copy size={12} /></button>
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="shrink-0">
                                             <ToggleSwitch checked={apiEnabled} onChange={() => setApiEnabled(!apiEnabled)} />
                                         </div>
                                     </div>

                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div className="border border-ark-border p-4 hover:border-ark-primary/50 transition-colors">
                                             <h5 className="font-bold text-ark-text text-sm mb-2 flex items-center gap-2">
                                                 <Terminal size={14} className="text-ark-primary" /> Swagger UI
                                             </h5>
                                             <p className="text-xs text-ark-subtext font-mono mb-4">{t('sc_swagger_desc', lang)}</p>
                                             <a href="#" className="text-xs text-ark-primary hover:underline flex items-center gap-1 font-mono uppercase tracking-wider">
                                                 {t('sc_launch_terminal', lang)} <ExternalLink size={10} />
                                             </a>
                                         </div>
                                         <div className="border border-ark-border p-4 hover:border-ark-primary/50 transition-colors">
                                             <h5 className="font-bold text-ark-text text-sm mb-2 flex items-center gap-2">
                                                 <FileText size={14} className="text-ark-primary" /> Redoc
                                             </h5>
                                             <p className="text-xs text-ark-subtext font-mono mb-4">{t('sc_redoc_desc', lang)}</p>
                                             <a href="#" className="text-xs text-ark-primary hover:underline flex items-center gap-1 font-mono uppercase tracking-wider">
                                                 {t('sc_view_docs', lang)} <ExternalLink size={10} />
                                             </a>
                                         </div>
                                     </div>
                                 </div>
                             </ArkCard>

                             <ArkCard title={t('sc_api_key_mgmt', lang)}>
                                 <div className="flex justify-end mb-4">
                                     <ArkButton size="sm" onClick={handleGenerateKey}>
                                         <Plus size={14} className="mr-2" /> {t('sc_api_generate', lang)}
                                     </ArkButton>
                                 </div>
                                 
                                 <div className="overflow-x-auto border border-ark-border bg-ark-bg/20">
                                     <table className="w-full text-left text-sm whitespace-nowrap">
                                         <thead className="bg-ark-active/10 text-ark-subtext font-mono text-xs font-bold uppercase border-b border-ark-border">
                                             <tr>
                                                 <th className="p-3">{t('sc_api_table_key', lang)}</th>
                                                 <th className="p-3">{t('sc_api_table_desc', lang)}</th>
                                                 <th className="p-3">{t('sc_api_table_date', lang)}</th>
                                                 <th className="p-3">{t('sc_api_table_status', lang)}</th>
                                                 <th className="p-3 text-right">Actions</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-ark-border font-mono text-xs">
                                             {apiKeys.map(key => (
                                                 <tr key={key.id} className="hover:bg-ark-active/5 transition-colors">
                                                     <td className="p-3">
                                                         <div className="flex items-center gap-2">
                                                             <span className="font-bold text-ark-primary">{key.key}</span>
                                                             <button className="text-ark-subtext hover:text-ark-text"><Copy size={12} /></button>
                                                         </div>
                                                     </td>
                                                     <td className="p-3 text-ark-text">{key.desc}</td>
                                                     <td className="p-3 text-ark-subtext">{key.created}</td>
                                                     <td className="p-3">
                                                         <span className={`px-2 py-0.5 rounded-sm uppercase text-[10px] font-bold border ${key.status === 'active' ? 'border-green-500/30 bg-green-500/10 text-green-500' : 'border-red-500/30 bg-red-500/10 text-red-500'}`}>
                                                             {key.status === 'active' ? t('sc_api_status_active', lang) : t('sc_api_status_revoked', lang)}
                                                         </span>
                                                     </td>
                                                     <td className="p-3 text-right">
                                                         <div className="flex justify-end gap-2">
                                                             {key.status === 'active' && (
                                                                 <button onClick={() => handleRevokeKey(key.id)} className="p-1.5 hover:bg-ark-active/20 text-ark-subtext hover:text-ark-text transition-colors" title="Revoke">
                                                                     <RefreshCw size={14} />
                                                                 </button>
                                                             )}
                                                             <button onClick={() => handleDeleteKey(key.id)} className="p-1.5 hover:bg-ark-danger/20 text-ark-subtext hover:text-ark-danger transition-colors" title="Delete">
                                                                 <Trash2 size={14} />
                                                             </button>
                                                         </div>
                                                     </td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             </ArkCard>
                         </div>
                    )}

                    {activeTab === 'notification' && (
                        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <ArkCard title={t('sc_notif_title', lang)} sub={t('sc_notif_subtitle', lang)}>
                                <div className="space-y-8">
                                    {/* Email Section */}
                                    <div className="bg-ark-bg/20 p-4 border border-ark-border relative">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="flex items-center gap-2 font-bold text-ark-text"><Mail size={16} /> {t('sc_notif_email', lang)}</h4>
                                            <ToggleSwitch checked={emailEnabled} onChange={() => setEmailEnabled(!emailEnabled)} />
                                        </div>
                                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${emailEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
                                            <div className="space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_notif_smtp_server', lang)}</label>
                                                <ArkInput placeholder="smtp.example.com" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_notif_smtp_port', lang)}</label>
                                                <ArkInput placeholder="587" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_notif_smtp_user', lang)}</label>
                                                <ArkInput placeholder="admin@rhodes.com" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_notif_smtp_pass', lang)}</label>
                                                <ArkInput type="password" />
                                            </div>
                                            <div className="md:col-span-2 space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_notif_recipient', lang)}</label>
                                                <ArkInput placeholder="security@rhodes.com" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Syslog Section */}
                                    <div className="bg-ark-bg/20 p-4 border border-ark-border relative">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="flex items-center gap-2 font-bold text-ark-text"><Terminal size={16} /> {t('sc_notif_syslog', lang)}</h4>
                                            <ToggleSwitch checked={syslogEnabled} onChange={() => setSyslogEnabled(!syslogEnabled)} />
                                        </div>
                                        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${syslogEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
                                            <div className="md:col-span-2 space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_notif_syslog_server', lang)}</label>
                                                <ArkInput placeholder="192.168.1.50:514" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_notif_syslog_proto', lang)}</label>
                                                <select className="w-full bg-ark-bg border-b-2 border-ark-border px-3 py-2 text-sm text-ark-text font-mono">
                                                    <option>UDP</option>
                                                    <option>TCP</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <ArkButton onClick={handleSave} size="sm" loading={isSaving}><Save size={14} className="mr-2"/> {t('sc_btn_save', lang)}</ArkButton>
                                    </div>
                                </div>
                            </ArkCard>
                        </div>
                    )}

                    {activeTab === 'db' && (
                        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            
                            {/* New Connection Settings Card */}
                            <ArkCard title={t('sc_db_connection', lang)}>
                                <div className="space-y-6">
                                    <div className="flex flex-col space-y-2">
                                        <label className="text-xs font-mono text-ark-subtext">{t('sc_db_type', lang)}</label>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setDbType('sqlite')}
                                                className={`flex items-center gap-2 px-4 py-2 border rounded-sm transition-all ${dbType === 'sqlite' ? 'border-ark-primary bg-ark-active/20 text-ark-primary' : 'border-ark-border text-ark-subtext hover:text-ark-text'}`}
                                            >
                                                <HardDrive size={16} /> {t('sc_db_sqlite', lang)}
                                            </button>
                                            <button
                                                onClick={() => setDbType('mysql')}
                                                className={`flex items-center gap-2 px-4 py-2 border rounded-sm transition-all ${dbType === 'mysql' ? 'border-ark-primary bg-ark-active/20 text-ark-primary' : 'border-ark-border text-ark-subtext hover:text-ark-text'}`}
                                            >
                                                <Database size={16} /> {t('sc_db_mysql', lang)}
                                            </button>
                                        </div>
                                    </div>

                                    {dbType === 'sqlite' ? (
                                        <div className="space-y-1">
                                            <label className="text-xs font-mono text-ark-subtext">{t('sc_db_path', lang)}</label>
                                            <ArkInput value={sqlitePath} onChange={e => setSqlitePath(e.target.value)} />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_db_host', lang)}</label>
                                                <ArkInput value={mysqlConfig.host} onChange={e => setMysqlConfig({...mysqlConfig, host: e.target.value})} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_db_port', lang)}</label>
                                                <ArkInput value={mysqlConfig.port} onChange={e => setMysqlConfig({...mysqlConfig, port: e.target.value})} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_db_user', lang)}</label>
                                                <ArkInput value={mysqlConfig.user} onChange={e => setMysqlConfig({...mysqlConfig, user: e.target.value})} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_db_pass', lang)}</label>
                                                <ArkInput type="password" value={mysqlConfig.pass} onChange={e => setMysqlConfig({...mysqlConfig, pass: e.target.value})} />
                                            </div>
                                            <div className="md:col-span-2 space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_db_name', lang)}</label>
                                                <ArkInput value={mysqlConfig.db} onChange={e => setMysqlConfig({...mysqlConfig, db: e.target.value})} />
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-end pt-4 border-t border-ark-border/50">
                                         <ArkButton onClick={handleSave} size="sm" loading={isSaving}><Save size={14} className="mr-2"/> {t('sc_btn_save', lang)}</ArkButton>
                                    </div>
                                </div>
                            </ArkCard>

                            <ArkCard title={t('sc_db_title', lang)} sub={t('sc_db_subtitle', lang)}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-ark-bg/30 p-4 border border-ark-border flex items-center gap-4">
                                        <div className="p-3 bg-ark-active/20 rounded-full text-ark-primary"><HardDrive size={24}/></div>
                                        <div>
                                            <p className="text-xs text-ark-subtext uppercase">{t('sc_db_size', lang)}</p>
                                            <p className="text-xl font-bold font-mono">24.5 GB</p>
                                        </div>
                                    </div>
                                    <div className="bg-ark-bg/30 p-4 border border-ark-border flex items-center gap-4">
                                        <div className="p-3 bg-ark-active/20 rounded-full text-ark-primary"><Database size={24}/></div>
                                        <div>
                                            <p className="text-xs text-ark-subtext uppercase">{t('sc_db_records', lang)}</p>
                                            <p className="text-xl font-bold font-mono">14,205,991</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-bold text-ark-text mb-4 border-b border-ark-border pb-2">{t('sc_db_retention', lang)}</h4>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-ark-subtext">30 Days</span>
                                            <input type="range" min="7" max="365" defaultValue="180" className="flex-1 accent-ark-primary" />
                                            <span className="text-sm text-ark-subtext">365 Days</span>
                                        </div>
                                        <p className="text-center font-mono text-ark-primary font-bold mt-2">180 {t('sc_db_days', lang)}</p>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-ark-text mb-4 border-b border-ark-border pb-2">{t('sc_db_maintenance', lang)}</h4>
                                        <div className="flex gap-4">
                                            <ArkButton variant="outline" onClick={handleCleanDb} className="flex-1 justify-center">
                                                <Trash2 size={14} className="mr-2"/> {t('sc_db_clean', lang)}
                                            </ArkButton>
                                            <ArkButton variant="primary" onClick={handleSave} loading={isSaving} className="flex-1 justify-center">
                                                <Save size={14} className="mr-2"/> {t('sc_db_backup', lang)}
                                            </ArkButton>
                                        </div>
                                    </div>
                                </div>
                            </ArkCard>
                        </div>
                    )}

                    {/* Login Management with User Management */}
                    {activeTab === 'login' && (
                        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Account Settings Card */}
                                <ArkCard title={t('sc_login_account_title', lang)} contentClassName="flex flex-col gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-mono text-ark-subtext">{t('sc_login_current_user', lang)}</label>
                                        <div className="flex items-center gap-2 bg-ark-active/10 p-2 border border-ark-border rounded-sm">
                                            <User size={16} className="text-ark-primary"/>
                                            <span className="text-sm font-bold text-ark-text">{user?.username || 'admin'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-mono text-ark-subtext">{t('sc_login_new_pwd', lang)}</label>
                                        <ArkInput type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-mono text-ark-subtext">{t('sc_login_confirm_pwd', lang)}</label>
                                        <ArkInput type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <ArkButton onClick={handleUpdateCredentials} size="sm"><Save size={14} className="mr-2"/> {t('sc_login_update_btn', lang)}</ArkButton>
                                    </div>
                                </ArkCard>

                                {/* Security Policy Card */}
                                <ArkCard title={t('sc_login_title', lang)} sub={t('sc_login_subtitle', lang)}>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_login_max_retry', lang)}</label>
                                                <ArkInput type="number" defaultValue="5" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_login_lockout', lang)}</label>
                                                <ArkInput type="number" defaultValue="30" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_login_session', lang)}</label>
                                                <ArkInput type="number" defaultValue="120" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-mono text-ark-subtext">{t('sc_login_url', lang)}</label>
                                                <div className="flex items-center">
                                                    <span className="text-xs text-ark-subtext mr-2">/admin/</span>
                                                    <ArkInput defaultValue="login_v2" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4 border-t border-ark-border">
                                            <h4 className="font-bold text-ark-text mb-2 flex items-center gap-2"><Lock size={16}/> {t('sc_login_whitelist', lang)}</h4>
                                            <textarea className="w-full bg-ark-bg border border-ark-border p-3 text-sm font-mono text-ark-text h-20 focus:border-ark-primary outline-none" placeholder="192.168.1.0/24"></textarea>
                                        </div>

                                        <div className="flex justify-end">
                                            <ArkButton onClick={handleSave} size="sm" loading={isSaving}><Save size={14} className="mr-2"/> {t('sc_btn_save', lang)}</ArkButton>
                                        </div>
                                    </div>
                                </ArkCard>
                            </div>

                            {/* User Management Card */}
                            <ArkCard title={t('sc_user_mgmt_title', lang)}>
                                <div className="flex justify-end mb-4">
                                    <ArkButton size="sm" onClick={() => setShowUserModal(true)}>
                                        <Plus size={14} className="mr-2" /> {t('sc_user_create_btn', lang)}
                                    </ArkButton>
                                </div>
                                <div className="overflow-x-auto border border-ark-border bg-ark-bg/20">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-ark-active/10 text-ark-subtext font-mono text-xs font-bold uppercase border-b border-ark-border">
                                            <tr>
                                                <th className="p-3 pl-4">{t('sc_user_col_username', lang)}</th>
                                                <th className="p-3">{t('sc_user_col_role', lang)}</th>
                                                <th className="p-3">{t('sc_user_col_status', lang)}</th>
                                                <th className="p-3">{t('sc_user_col_last_login', lang)}</th>
                                                <th className="p-3 text-right pr-4">{t('sc_user_col_action', lang)}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-ark-border font-mono text-xs">
                                            {userList.map(u => (
                                                <tr key={u.id} className="hover:bg-ark-active/5 transition-colors">
                                                    <td className="p-3 pl-4 font-bold text-ark-text">{u.username}</td>
                                                    <td className="p-3 text-ark-subtext">{u.role === 'admin' ? t('sc_user_role_admin', lang) : t('sc_user_role_operator', lang)}</td>
                                                    <td className="p-3">
                                                        <span className="px-2 py-0.5 rounded-sm uppercase text-[10px] font-bold border border-green-500/30 bg-green-500/10 text-green-500">
                                                            {t('sc_user_status_active', lang)}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-ark-subtext">{u.lastLogin}</td>
                                                    <td className="p-3 text-right pr-4">
                                                        {u.username !== 'admin' && (
                                                            <button 
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                className="p-1.5 hover:bg-ark-danger/20 text-ark-subtext hover:text-ark-danger transition-colors rounded-sm"
                                                                title={t('mc_delete', lang)}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </ArkCard>

                            {/* Create User Modal - Portal to Body */}
                            {showUserModal && createPortal(
                                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-ark-text">
                                    <div className="w-full max-w-sm bg-ark-panel border border-ark-primary/50 shadow-[0_0_30px_rgba(35,173,229,0.2)] relative">
                                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-ark-primary" />
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-ark-primary" />
                                        
                                        <div className="p-6">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-bold text-ark-text uppercase tracking-widest flex items-center gap-2">
                                                    <Users size={20} className="text-ark-primary" /> {t('sc_user_modal_title', lang)}
                                                </h3>
                                                <button onClick={() => setShowUserModal(false)} className="text-ark-subtext hover:text-ark-text"><X size={20}/></button>
                                            </div>
                                            
                                            <div className="space-y-4 mb-8">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-mono text-ark-subtext">{t('sc_user_col_username', lang)}</label>
                                                    <ArkInput 
                                                        value={newUserForm.username} 
                                                        onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-mono text-ark-subtext">{t('ar_col_password', lang)}</label>
                                                    <ArkInput 
                                                        type="password" 
                                                        value={newUserForm.password} 
                                                        onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-mono text-ark-subtext">{t('sc_user_col_role', lang)}</label>
                                                    <select 
                                                        className="w-full bg-ark-bg border-b-2 border-ark-border px-3 py-2 text-sm text-ark-text font-mono opacity-50 cursor-not-allowed"
                                                        value="admin"
                                                        disabled
                                                    >
                                                        <option value="admin">{t('sc_user_role_admin', lang)}</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-3">
                                                <ArkButton variant="ghost" className="flex-1 justify-center" onClick={() => setShowUserModal(false)}>
                                                    {t('btn_cancel', lang)}
                                                </ArkButton>
                                                <ArkButton variant="primary" className="flex-1 justify-center" onClick={handleCreateUser}>
                                                    {t('btn_confirm', lang)}
                                                </ArkButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>,
                                document.body
                            )}

                            {/* Login Logs Card */}
                            <ArkCard title={t('sc_login_logs_title', lang)} contentClassName="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-ark-active/10 text-ark-subtext font-mono text-xs font-bold uppercase border-b border-ark-border">
                                            <tr>
                                                <th className="p-3 pl-4">{t('sc_login_log_time', lang)}</th>
                                                <th className="p-3">{t('sc_login_log_ip', lang)}</th>
                                                <th className="p-3">{t('sc_login_log_device', lang)}</th>
                                                <th className="p-3 text-right pr-4">{t('sc_login_log_status', lang)}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-ark-border font-mono text-xs">
                                            {MOCK_LOGIN_LOGS.map(log => (
                                                <tr key={log.id} className="hover:bg-ark-active/5 transition-colors">
                                                    <td className="p-3 pl-4 text-ark-subtext">{log.time}</td>
                                                    <td className="p-3 font-bold text-ark-text">{log.ip}</td>
                                                    <td className="p-3 text-ark-subtext">{log.device}</td>
                                                    <td className="p-3 text-right pr-4">
                                                        <span className={`px-2 py-0.5 rounded-sm uppercase text-[10px] font-bold border ${log.status === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-500' : 'border-red-500/30 bg-red-500/10 text-red-500'}`}>
                                                            {log.status === 'success' ? t('status_success', lang) : t('status_failure', lang)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </ArkCard>
                        </div>
                    )}

                    {/* ... (Existing tabs: Custom, NTP, Tracing) ... */}
                    {activeTab === 'custom' && (
                        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <ArkCard title={t('sc_custom_title', lang)} sub={t('sc_custom_subtitle', lang)}>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-xs font-mono text-ark-subtext">{t('sc_custom_name', lang)}</label>
                                            <ArkInput defaultValue="PRTS HONEYPOT" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-mono text-ark-subtext">{t('sc_custom_copyright', lang)}</label>
                                            <ArkInput defaultValue="© 2025 RHODES ISLAND" />
                                        </div>
                                    </div>

                                    <div className="border border-ark-border border-dashed p-8 flex flex-col items-center justify-center gap-4 bg-ark-bg/20 cursor-pointer hover:bg-ark-bg/40 transition-colors">
                                        <Image size={48} className="text-ark-subtext"/>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-ark-text">{t('sc_custom_logo', lang)}</p>
                                            <p className="text-xs text-ark-subtext">PNG, JPG, SVG (Max 2MB)</p>
                                        </div>
                                        <ArkButton size="sm" variant="ghost"><Upload size={14} className="mr-2"/> {t('sc_custom_upload', lang)}</ArkButton>
                                    </div>

                                    <div className="flex justify-end">
                                        <ArkButton onClick={handleSave} size="sm" loading={isSaving}><Save size={14} className="mr-2"/> {t('sc_btn_save', lang)}</ArkButton>
                                    </div>
                                </div>
                            </ArkCard>
                        </div>
                    )}

                    {activeTab === 'ntp' && (
                        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <ArkCard title={t('sc_ntp_title', lang)} sub={t('sc_ntp_subtitle', lang)}>
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="flex-1 w-full space-y-6">
                                        <div className="space-y-1">
                                            <label className="text-xs font-mono text-ark-subtext">{t('sc_ntp_server', lang)}</label>
                                            <ArkInput defaultValue="pool.ntp.org" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-mono text-ark-subtext">{t('sc_ntp_interval', lang)}</label>
                                            <ArkInput type="number" defaultValue="60" />
                                        </div>
                                        <ArkButton onClick={handleSync} className="w-full justify-center" disabled={isSyncing}>
                                            <RefreshCw size={14} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`}/> 
                                            {isSyncing ? t('btn_syncing', lang) : t('sc_ntp_sync_now', lang)}
                                        </ArkButton>
                                    </div>
                                    <div className="w-full md:w-64 bg-ark-bg border border-ark-border p-4 flex flex-col items-center justify-center gap-2 text-center h-full">
                                        <Clock size={32} className="text-ark-primary mb-2" />
                                        <div className="text-sm font-bold text-ark-text">{t('sc_ntp_status', lang)}</div>
                                        <div className="text-xs text-green-500 font-mono">Synchronized</div>
                                        <div className="w-full h-[1px] bg-ark-border my-2"/>
                                        <div className="text-xs text-ark-subtext">{t('sc_ntp_offset', lang)}</div>
                                        <div className="text-xl font-bold font-mono text-ark-text">+0.002s</div>
                                    </div>
                                </div>
                            </ArkCard>
                        </div>
                    )}

                    {activeTab === 'tracing' && (
                        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <ArkCard title={t('sc_trace_title', lang)} sub={t('sc_trace_subtitle', lang)}>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 border border-ark-border bg-ark-bg/20">
                                        <div>
                                            <h4 className="font-bold text-ark-text">{t('sc_trace_enable', lang)}</h4>
                                            <p className="text-xs text-ark-subtext font-mono">{t('sc_trace_auto_desc', lang)}</p>
                                        </div>
                                        <ToggleSwitch checked={traceEnabled} onChange={() => setTraceEnabled(!traceEnabled)} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-xs font-mono text-ark-subtext">{t('sc_trace_provider', lang)}</label>
                                            <select className="w-full bg-ark-bg border-b-2 border-ark-border px-3 py-2 text-sm text-ark-text font-mono">
                                                <option>IP-API Pro</option>
                                                <option>MaxMind GeoIP</option>
                                                <option>ThreatBook Intelligence</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-mono text-ark-subtext">{t('sc_trace_apikey', lang)}</label>
                                            <ArkInput type="password" defaultValue="*****************" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-mono text-ark-subtext">{t('sc_trace_visual', lang)}</label>
                                            <select className="w-full bg-ark-bg border-b-2 border-ark-border px-3 py-2 text-sm text-ark-text font-mono">
                                                <option>Cesium 3D Globe</option>
                                                <option>2D Vector Map</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <ArkButton onClick={handleSave} size="sm" loading={isSaving}><Save size={14} className="mr-2"/> {t('sc_btn_save', lang)}</ArkButton>
                                    </div>
                                </div>
                            </ArkCard>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
