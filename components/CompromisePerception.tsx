
import React, { useState, useEffect } from 'react';
import { ArkCard, ArkButton, ArkLoading } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { Inbox, ChevronRight, Calendar, Download, Upload, FileText, Activity, Globe, Plus, Box, RefreshCw } from 'lucide-react';
import { ArkDateRangePicker } from './ArkDateRangePicker';
import { useNotification } from './NotificationSystem';

const DecoyAnimation = () => {
    const { lang } = useApp();
    return (
        <div className="relative w-64 h-32 flex-shrink-0 hidden lg:block mr-4 select-none pointer-events-none self-center">
            <svg className="w-full h-full" viewBox="0 0 200 100">
                {/* Connecting Lines */}
                <path d="M 30 50 L 80 30" stroke="var(--ark-border)" strokeWidth="1" strokeDasharray="3 3" />
                <path d="M 80 30 L 130 50" stroke="var(--ark-primary)" strokeWidth="1" />
                <path d="M 130 50 L 180 30" stroke="var(--ark-border)" strokeWidth="1" strokeDasharray="3 3" />

                {/* Node 1: Attacker */}
                <circle cx="30" cy="50" r="3" fill="var(--ark-bg)" stroke="var(--ark-subtext)" strokeWidth="2" />
                
                {/* Node 2: Entry */}
                <circle cx="80" cy="30" r="4" fill="var(--ark-bg)" stroke="var(--ark-primary)" strokeWidth="2" />
                
                {/* Node 3: Decoy (Trap) */}
                <g>
                   <rect x="120" y="40" width="20" height="20" fill="var(--ark-active-bg)" stroke="var(--ark-danger)" strokeWidth="2" transform="rotate(45 130 50)" />
                   <path d="M 125 50 L 135 50 M 130 45 L 130 55" stroke="var(--ark-danger)" strokeWidth="1.5" />
                   {/* Pulse Effect */}
                   <circle cx="130" cy="50" r="15" fill="none" stroke="var(--ark-danger)" strokeWidth="1" className="animate-ping" style={{ opacity: 0.5 }} />
                </g>

                {/* Node 4: Target */}
                <circle cx="180" cy="30" r="3" fill="var(--ark-bg)" stroke="var(--ark-subtext)" strokeWidth="2" />
            </svg>
            
            <div className="absolute top-[20px] left-[65px] text-[9px] font-mono text-ark-primary bg-ark-bg px-1 border border-ark-primary/30">{t('cp_diagram_entry', lang)}</div>
            <div className="absolute top-[55px] left-[110px] text-[9px] font-mono text-ark-danger bg-ark-bg px-1 border border-ark-danger/30 blink">{t('cp_diagram_trap', lang)}</div>
        </div>
    );
};

export const CompromisePerception: React.FC = () => {
    const { lang, modules, toggleModule, authFetch } = useApp();
    const { notify } = useNotification();
    const [activeTab, setActiveTab] = useState<'data' | 'mgmt'>('data');
    const enabled = modules.persistence;
    const [dateRange, setDateRange] = useState({ start: '2025-11-06T00:00', end: '2025-12-05T23:59' });
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingDeploys, setPendingDeploys] = useState<Set<number>>(new Set());
    const [pendingDownloads, setPendingDownloads] = useState<Set<number>>(new Set());

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/v1/decoys');
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch decoy logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [authFetch]);

    const getStatusStyle = (status: string) => {
        if (status === 'Compromised') return 'text-red-500 bg-red-500/10 border-red-500/30';
        return 'text-ark-subtext bg-ark-subtext/10 border-ark-subtext/30';
    };

    const handleDeploy = async (template: any) => {
        if (pendingDeploys.has(template.id)) return;
        setPendingDeploys(prev => new Set(prev).add(template.id));
        try {
            const response = await authFetch('/api/v1/decoys', {
                method: 'POST',
                body: JSON.stringify({ name: template.name, type: template.type })
            });
            if (response.ok) {
                notify('success', t('op_success', lang), `${t('op_deploy_success', lang)}: ${template.name}`);
                fetchLogs(); // Refresh logs to show new decoy
            } else {
                notify('error', t('op_failed', lang), 'Failed to deploy decoy');
            }
        } catch (error) {
            notify('error', t('op_failed', lang), t('err_network', lang));
        } finally {
            setPendingDeploys(prev => {
                const next = new Set(prev);
                next.delete(template.id);
                return next;
            });
        }
    };

    const handleDownload = async (template: any) => {
        if (pendingDownloads.has(template.id)) return;
        setPendingDownloads(prev => new Set(prev).add(template.id));
        
        try {
            notify('success', t('op_success', lang), `${t('op_download_start', lang)}: ${template.name}`);
        } finally {
            setPendingDownloads(prev => {
                const next = new Set(prev);
                next.delete(template.id);
                return next;
            });
        }
    };

    const handleToggle = () => {
        const newState = !enabled;
        toggleModule('persistence');
        notify(newState ? 'success' : 'warning', t('op_success', lang), newState ? t('msg_module_on', lang) : t('msg_module_off', lang));
    };

    const DECOY_TEMPLATES = [
        { id: 1, type: 'file', name: 'passwords.txt', desc: t('cp_decoy_file_desc', lang), icon: <FileText size={24} /> },
        { id: 2, type: 'process', name: 'mysql_backup.exe', desc: t('cp_decoy_process_desc', lang), icon: <Activity size={24} /> },
        { id: 3, type: 'network', name: 'vpn_config.ovpn', desc: t('cp_decoy_net_desc', lang), icon: <Globe size={24} /> },
        { id: 4, type: 'file', name: 'salary_2024.xlsx', desc: t('cp_decoy_file_desc', lang), icon: <FileText size={24} /> },
    ];

    return (
        <div className="flex flex-col gap-4 pb-20 md:pb-6 min-h-full">
             {/* Description Header */}
             <div className="bg-ark-panel border border-ark-border shadow-sm relative transition-all duration-300">
                {/* Accent Line with Animation */}
                <div className={`absolute top-0 left-0 h-full bg-ark-primary transition-all duration-300 ease-out ${enabled ? 'w-1 opacity-100' : 'w-0 opacity-0'}`} />
                
                <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                    <div className="relative z-10 flex-1 w-full max-w-4xl">
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                            <div className="p-2 bg-ark-active/20 rounded-sm text-ark-primary border border-ark-primary/20 shrink-0">
                                <Inbox size={20} className="md:w-6 md:h-6" />
                            </div>
                            <h2 className="text-lg md:text-xl font-bold text-ark-text">
                                {t('cp_title', lang)}
                            </h2>
                            {/* Toggle Switch */}
                            <button 
                                onClick={handleToggle}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 cursor-pointer ml-2 ${enabled ? 'bg-ark-primary' : 'bg-ark-subtext/30'}`}
                                aria-label="Toggle Compromise Perception"
                            >
                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        
                        <div className="space-y-3 text-xs text-ark-text/80 font-mono leading-relaxed w-full">
                            <p className="break-words whitespace-normal">{t('cp_desc_main', lang)}</p>
                            <p className="break-words whitespace-normal">{t('cp_desc_sub', lang)}</p>
                            <ul className="space-y-2 pl-1">
                                <li className="flex items-start gap-2">
                                    <span className="text-ark-primary mt-0.5 shrink-0">•</span>
                                    <span className="break-words whitespace-normal">{t('cp_point_1', lang)}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-ark-primary mt-0.5 shrink-0">•</span>
                                    <span className="break-words whitespace-normal">{t('cp_point_2', lang)}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-ark-primary mt-0.5 shrink-0">•</span>
                                    <span className="break-words whitespace-normal">{t('cp_point_3', lang)}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Side Animation */}
                    <DecoyAnimation />
                </div>
             </div>

             {/* Tab Navigation */}
             <div className="flex border-b border-ark-border bg-ark-panel sticky top-0 z-20 shadow-sm overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('data')}
                    className={`px-6 py-3 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'data' ? 'text-ark-primary bg-ark-active/20' : 'text-ark-subtext hover:text-ark-text hover:bg-ark-active/5'}`}
                >
                    {t('cp_tab_data', lang)}
                    {activeTab === 'data' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-ark-primary" />}
                </button>
                <button 
                    onClick={() => setActiveTab('mgmt')}
                    className={`px-6 py-3 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'mgmt' ? 'text-ark-primary bg-ark-active/20' : 'text-ark-subtext hover:text-ark-text hover:bg-ark-active/5'}`}
                >
                    {t('cp_tab_mgmt', lang)}
                    {activeTab === 'mgmt' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-ark-primary" />}
                </button>
             </div>

             {activeTab === 'data' ? (
                 <>
                    {/* Filter Bar */}
                    <div className="bg-ark-panel border border-ark-border p-4 shadow-sm">
                        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                            <div className="flex flex-wrap gap-4 items-center w-full xl:w-auto">
                                {/* Name Input */}
                                <div className="flex items-center bg-ark-bg border border-ark-border rounded-sm overflow-hidden min-w-[200px] flex-1 sm:flex-none">
                                    <span className="bg-ark-bg px-3 py-1.5 text-xs font-mono text-ark-subtext border-r border-ark-border whitespace-nowrap shrink-0">{t('cp_filter_name', lang)}</span>
                                    <input type="text" placeholder={t('filter_placeholder_search', lang)} className="bg-transparent px-3 py-1.5 text-sm text-ark-text outline-none w-full min-w-[120px]" />
                                </div>

                                {/* IP Input */}
                                <div className="flex items-center bg-ark-bg border border-ark-border rounded-sm overflow-hidden min-w-[200px] flex-1 sm:flex-none">
                                    <span className="bg-ark-bg px-3 py-1.5 text-xs font-mono text-ark-subtext border-r border-ark-border whitespace-nowrap shrink-0">{t('cp_filter_source', lang)}</span>
                                    <input type="text" placeholder={t('filter_placeholder_search', lang)} className="bg-transparent px-3 py-1.5 text-sm text-ark-text outline-none w-full min-w-[120px]" />
                                </div>

                                {/* Status Toggle */}
                                <div className="flex items-center border border-ark-border rounded-sm overflow-hidden flex-shrink-0 max-w-full overflow-x-auto">
                                    <span className="bg-ark-bg px-3 py-1.5 text-xs font-mono text-ark-subtext border-r border-ark-border shrink-0 sticky left-0">{t('cp_filter_status', lang)}</span>
                                    <div className="flex bg-ark-bg">
                                        <button className="px-3 py-1.5 text-xs hover:bg-ark-active transition-colors text-ark-subtext hover:text-ark-text border-r border-ark-border whitespace-nowrap">{t('cp_status_compromised', lang)}</button>
                                        <button className="px-3 py-1.5 text-xs hover:bg-ark-active transition-colors text-ark-subtext hover:text-ark-text whitespace-nowrap">{t('cp_status_untriggered', lang)}</button>
                                    </div>
                                </div>

                                {/* Disposal Toggle */}
                                <div className="flex items-center border border-ark-border rounded-sm overflow-hidden flex-shrink-0 max-w-full overflow-x-auto">
                                    <span className="bg-ark-bg px-3 py-1.5 text-xs font-mono text-ark-subtext border-r border-ark-border shrink-0 sticky left-0">{t('cp_filter_disposal', lang)}</span>
                                    <div className="flex bg-ark-bg">
                                        <button className="px-3 py-1.5 text-xs hover:bg-ark-active transition-colors text-ark-subtext hover:text-ark-text border-r border-ark-border whitespace-nowrap">{t('cp_disposal_handled', lang)}</button>
                                        <button className="px-3 py-1.5 text-xs hover:bg-ark-active transition-colors text-ark-subtext hover:text-ark-text whitespace-nowrap">{t('cp_disposal_pending', lang)}</button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Date Range Picker */}
                            <ArkDateRangePicker value={dateRange} onChange={setDateRange} className="w-full xl:w-auto" />
                        </div>
                    </div>

                    {/* Table Area */}
                    <div className="flex-1 flex flex-col min-h-[500px] bg-ark-panel border border-ark-border overflow-hidden shadow-sm">
                        {loading ? (
                            <ArkLoading label="FETCHING_DECOY_DATA" />
                        ) : (
                            <div className="overflow-auto custom-scrollbar flex-1">
                                <table className="w-full text-left text-sm min-w-[1400px]">
                                    <thead className="bg-ark-active/10 text-ark-subtext font-mono text-xs uppercase shadow-sm border-b border-ark-border sticky top-0 z-10 backdrop-blur-md">
                                        <tr>
                                            <th className="p-4 font-bold whitespace-nowrap">{t('cp_col_type', lang)}</th>
                                            <th className="p-4 font-bold whitespace-nowrap">{t('cp_col_status', lang)}</th>
                                            <th className="p-4 font-bold whitespace-nowrap">{t('cp_col_device', lang)}</th>
                                            <th className="p-4 font-bold whitespace-nowrap">{t('cp_col_source', lang)}</th>
                                            <th className="p-4 font-bold whitespace-nowrap">{t('cp_col_time', lang)}</th>
                                            <th className="p-4 font-bold whitespace-nowrap">{t('cp_col_result', lang)}</th>
                                            <th className="p-4 font-bold whitespace-nowrap">{t('cp_col_decoy', lang)}</th>
                                            <th className="p-4 font-bold whitespace-nowrap">{t('cp_col_deploy_time', lang)}</th>
                                            <th className="p-4 font-bold whitespace-nowrap">{t('cp_col_node', lang)}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ark-border font-mono text-xs">
                                        {logs.length > 0 ? (
                                            logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-ark-active/5 transition-colors group">
                                                    <td className="p-4 font-bold text-ark-text">{log.type}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-0.5 border text-[10px] rounded-sm uppercase font-bold ${getStatusStyle(log.status)}`}>
                                                            {log.status === 'Compromised' ? t('cp_status_compromised', lang) : t('cp_status_untriggered', lang)}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-ark-text">{log.device}</td>
                                                    <td className="p-4 text-ark-subtext">{log.sourceIp}</td>
                                                    <td className="p-4 text-ark-subtext">{log.time}</td>
                                                    <td className="p-4 text-ark-text">{log.result}</td>
                                                    <td className="p-4 text-ark-primary">{log.decoyName}</td>
                                                    <td className="p-4 text-ark-subtext">{log.deployTime}</td>
                                                    <td className="p-4 text-ark-text">{log.node}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={9} className="p-32 text-center">
                                                    <div className="flex flex-col items-center justify-center opacity-50 gap-6">
                                                        <div className="w-20 h-20 border-2 border-dashed border-ark-subtext rounded-lg flex items-center justify-center bg-ark-active/5">
                                                            <Inbox size={40} className="text-ark-subtext" />
                                                        </div>
                                                        <span className="text-ark-subtext font-mono tracking-widest text-sm">{t('no_data', lang)}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        {/* Footer / Pagination Placeholder */}
                        <div className="p-3 border-t border-ark-border bg-ark-bg flex justify-end items-center gap-4 text-xs text-ark-subtext font-mono">
                            <span>{t('total_count', lang)} {logs.length}</span>
                            <div className="flex gap-1">
                                <button className="px-2 py-1 border border-ark-border disabled:opacity-50" disabled>&lt;</button>
                                <button className="px-2 py-1 border border-ark-border disabled:opacity-50" disabled>&gt;</button>
                            </div>
                        </div>
                    </div>
                 </>
             ) : (
                 // Management Tab Content
                 <div className="flex-1 overflow-auto custom-scrollbar p-1">
                     <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-bold text-ark-text">{t('cp_mgmt_title', lang)}</h3>
                         <ArkButton variant="primary" size="sm" onClick={() => handleDeploy({ id: 0, name: 'New Custom Decoy', type: 'custom' })}>
                             <Plus size={16} className="mr-1" /> {t('cp_btn_create', lang)}
                         </ArkButton>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                         {DECOY_TEMPLATES.map(decoy => (
                             <ArkCard key={decoy.id} className="hover:border-ark-primary transition-colors">
                                 <div className="flex items-start gap-4">
                                     <div className="p-3 bg-ark-active/20 rounded-sm text-ark-primary border border-ark-primary/20">
                                         {decoy.icon}
                                     </div>
                                     <div className="flex-1">
                                         <div className="flex justify-between items-start">
                                             <h4 className="font-bold text-ark-text text-sm mb-1">{decoy.name}</h4>
                                             <span className="text-[10px] font-mono text-ark-subtext uppercase border border-ark-border px-1.5 py-0.5 rounded-sm">{decoy.type}</span>
                                         </div>
                                         <p className="text-xs text-ark-subtext font-mono mb-4 min-h-[32px]">{decoy.desc}</p>
                                         <div className="flex gap-2 justify-end">
                                             <button 
                                                onClick={() => handleDownload(decoy)}
                                                className={`p-1.5 text-ark-subtext hover:text-ark-primary hover:bg-ark-active/10 rounded-sm transition-colors border border-transparent hover:border-ark-border ${pendingDownloads.has(decoy.id) ? 'opacity-50 cursor-wait' : ''}`}
                                                title={t('cp_btn_download', lang)}
                                                disabled={pendingDownloads.has(decoy.id)}
                                             >
                                                 {pendingDownloads.has(decoy.id) ? (
                                                     <RefreshCw size={16} className="animate-spin" />
                                                 ) : (
                                                     <Download size={16} />
                                                 )}
                                             </button>
                                             <button 
                                                onClick={() => handleDeploy(decoy)}
                                                className={`flex items-center gap-1 px-3 py-1.5 bg-ark-active/20 text-ark-primary hover:bg-ark-primary hover:text-white transition-colors text-xs font-bold uppercase rounded-sm border border-ark-primary/30 ${pendingDeploys.has(decoy.id) ? 'opacity-50 cursor-wait' : ''}`}
                                                disabled={pendingDeploys.has(decoy.id)}
                                             >
                                                 {pendingDeploys.has(decoy.id) ? (
                                                     <RefreshCw size={14} className="animate-spin" />
                                                 ) : (
                                                     <Upload size={14} />
                                                 )}
                                                 {t('cp_btn_deploy', lang)}
                                             </button>
                                         </div>
                                     </div>
                                 </div>
                             </ArkCard>
                         ))}
                         
                         {/* Placeholder Card for "More" */}
                         <div className="border-2 border-dashed border-ark-border rounded-sm flex flex-col items-center justify-center p-8 text-ark-subtext hover:text-ark-primary hover:border-ark-primary/50 transition-colors cursor-pointer group">
                             <Box size={32} className="mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                             <span className="text-xs font-mono uppercase tracking-widest">{t('cp_btn_create', lang)}</span>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
};
