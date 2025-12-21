
import React, { useState, useEffect } from 'react';
import { ArkButton, ArkLoading } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { Lang } from '../types';
import { Network, Database, Cloud, FileCode, Search, RefreshCw, X, Download, Trash2, Box, Eye, Calendar, Skull, Server, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useNotification } from './NotificationSystem';
import { ArkDateRangePicker } from './ArkDateRangePicker';

// Reusing Filter Components for consistency
const FilterInput: React.FC<{ label?: string, placeholder?: string, width?: string, children?: React.ReactNode }> = ({ label, placeholder, width = "w-full", children }) => (
    <div className={`flex items-center border border-ark-border bg-ark-panel h-[32px] ${width}`}>
        {label && (
            <div className="px-3 text-xs text-ark-subtext font-mono whitespace-nowrap border-r border-ark-border h-full flex items-center bg-ark-bg/30">
                {label}
            </div>
        )}
        <div className="flex-1 min-w-0 h-full flex items-center relative">
            {children || <input type="text" placeholder={placeholder} className="w-full h-full px-2 bg-transparent outline-none text-xs text-ark-text placeholder-ark-subtext/50" />}
        </div>
    </div>
);

const FilterSelect: React.FC<{ options: string[] }> = ({ options }) => (
    <select className="w-full h-full px-2 bg-transparent outline-none text-xs text-ark-text appearance-none cursor-pointer">
        {options.map((opt, i) => <option key={i}>{opt}</option>)}
    </select>
);

// Flow Diagram Component
const FlowDiagram: React.FC<{ lang: Lang }> = ({ lang }) => {
    return (
        <div className="hidden lg:flex items-center gap-2 select-none mr-4 self-center">
             {/* Attacker */}
             <div className="flex flex-col items-center gap-1 group">
                <Skull size={24} className="text-ark-text group-hover:text-ark-danger transition-colors" />
                <span className="text-[10px] text-ark-subtext font-mono">{t('sd_diagram_attacker', lang)}</span>
             </div>
             
             {/* Arrow */}
             <div className="w-12 h-[1px] bg-ark-danger relative">
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-ark-danger" />
             </div>

             {/* Honey Pot */}
             <div className="flex flex-col items-center gap-1 border border-ark-primary/50 p-2 rounded-sm bg-ark-bg relative">
                <div className="flex gap-1">
                    <Server size={16} className="text-ark-primary" />
                    <Server size={16} className="text-ark-primary" />
                    <Server size={16} className="text-ark-primary" />
                </div>
                <span className="text-[10px] text-ark-subtext font-mono">{t('sd_diagram_honey', lang)}</span>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-ark-primary animate-pulse whitespace-nowrap">{t('sd_diagram_extract', lang)}</div>
             </div>

             {/* Arrow Down-Up Path */}
             <svg width="40" height="40" className="text-ark-primary overflow-visible">
                 <path d="M 0 20 L 40 20" stroke="currentColor" fill="none" strokeWidth="1" />
                 <path d="M 20 20 L 20 40" stroke="currentColor" fill="none" strokeWidth="1" strokeDasharray="2 2" />
                 <path d="M 35 20 L 40 20 L 35 25" stroke="currentColor" fill="none" strokeWidth="1" />
             </svg>

             {/* Cloud DB */}
             <div className="flex flex-col items-center gap-1 group">
                 <Database size={24} className="text-ark-text group-hover:text-ark-primary transition-colors" />
                 <span className="text-[10px] text-ark-subtext font-mono">{t('sd_diagram_cloud', lang)}</span>
             </div>

             {/* Arrow */}
             <div className="w-12 h-[1px] bg-ark-primary relative">
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-ark-primary" />
                 <span className="absolute top-[-15px] left-1/2 -translate-x-1/2 text-[9px] text-ark-subtext">Link</span>
             </div>

             {/* Sandbox */}
             <div className="flex flex-col items-center gap-1 border border-ark-border p-2 rounded-sm bg-white/5">
                 <div className="flex gap-1">
                     <FileCode size={16} className="text-red-500" />
                     <FileText size={16} className="text-yellow-500" />
                     <FileCode size={16} className="text-blue-500" />
                 </div>
                 <span className="text-[10px] text-ark-subtext font-mono">{t('sd_diagram_sandbox', lang)}</span>
             </div>
        </div>
    );
}

export const SampleDetection: React.FC = () => {
    const { lang, modules, toggleModule, authFetch } = useApp();
    const { notify } = useNotification();
    const enabled = modules.payload;
    const [dateRange, setDateRange] = useState({ start: '2025-11-07T00:00', end: '2025-12-06T23:59' });
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingSamples, setPendingSamples] = useState<Set<string>>(new Set());

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/v1/samples');
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch sample logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [authFetch]);

    const handleAnalysis = () => notify('info', t('op_success', lang), t('op_analysis_start', lang));
    const handleDownload = () => notify('success', t('op_success', lang), t('op_download_start', lang));
    const handleDelete = async (id: string) => {
        if (pendingSamples.has(id)) return;
        setPendingSamples(prev => new Set(prev).add(id));
        try {
            const response = await authFetch(`/api/v1/samples/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setLogs(prev => prev.filter(log => log.id !== id));
                notify('error', t('op_success', lang), t('op_item_deleted', lang));
            } else {
                notify('error', t('op_failed', lang), 'Failed to delete sample');
            }
        } catch (error) {
            notify('error', t('op_failed', lang), t('err_network', lang));
        } finally {
            setPendingSamples(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleToggle = () => {
        const newState = !enabled;
        toggleModule('payload');
        notify(newState ? 'success' : 'warning', t('op_success', lang), newState ? t('msg_module_on', lang) : t('msg_module_off', lang));
    };

    const getThreatColor = (level: string) => {
        switch(level) {
            case 'malicious': return 'bg-red-500 text-red-500 border-red-500';
            case 'suspicious': return 'bg-yellow-500 text-yellow-500 border-yellow-500';
            case 'safe': return 'bg-green-500 text-green-500 border-green-500';
            default: return 'bg-gray-500 text-gray-500 border-gray-500';
        }
    };

    const getThreatLabel = (level: string) => {
        switch(level) {
            case 'malicious': return t('sd_threat_malicious', lang).split('(')[0];
            case 'suspicious': return t('sd_threat_suspicious', lang).split('(')[0];
            case 'safe': return t('sd_threat_safe', lang).split('(')[0];
            default: return t('sd_threat_unknown', lang).split('(')[0];
        }
    }

    return (
        <div className="flex flex-col gap-4 pb-6 min-h-full">
            {/* Header */}
            <div className="bg-ark-panel border border-ark-border shadow-sm relative transition-all duration-300">
                 {/* Accent Line with Animation - Red color specific to this page */}
                 <div className={`absolute top-0 left-0 h-full bg-red-500 transition-all duration-300 ease-out ${enabled ? 'w-1 opacity-100' : 'w-0 opacity-0'}`} />
                 
                 <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                     <div className="relative z-10 flex-1 w-full max-w-4xl">
                         <div className="flex items-center gap-4 mb-4 flex-wrap">
                             <div className="p-2 bg-ark-active/20 rounded-sm text-red-500 border border-red-500/20 shrink-0">
                                 <Box size={20} className="md:w-6 md:h-6" />
                             </div>
                             <h2 className="text-lg md:text-xl font-bold text-ark-text">{t('sd_title', lang)}</h2>
                             {/* Toggle Switch */}
                             <button 
                                onClick={handleToggle}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 cursor-pointer ml-2 ${enabled ? 'bg-ark-primary' : 'bg-ark-subtext/30'}`}
                                aria-label="Toggle Sample Detection"
                             >
                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                             </button>
                         </div>
                         
                         <div className="space-y-4 w-full">
                             <p className="text-xs text-ark-text/80 font-mono leading-relaxed break-words whitespace-normal">
                                {t('sd_desc', lang)}
                             </p>
                         </div>
                     </div>

                     {/* Visual Flow */}
                     <FlowDiagram lang={lang} />
                 </div>
            </div>

            {/* Filter Section */}
            <div className="bg-ark-panel border border-ark-border p-4 shadow-sm space-y-4">
                 {/* Row 1: Inputs */}
                 <div className="flex flex-col xl:flex-row gap-3">
                     <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                         <div className="md:col-span-2 lg:col-span-1">
                            <ArkDateRangePicker value={dateRange} onChange={setDateRange} className="w-full" />
                         </div>
                         <FilterInput label={t('sd_filter_file', lang)} placeholder={t('filter_placeholder_search', lang)} />
                         <FilterInput label={t('sd_filter_honey', lang)}>
                             <FilterSelect options={[t('filter_all', lang)]} />
                         </FilterInput>
                         <FilterInput label={t('sd_filter_node', lang)}>
                             <FilterSelect options={[t('filter_all', lang)]} />
                         </FilterInput>
                         <div className="flex gap-2">
                             <FilterInput label={t('sd_filter_arch', lang)}>
                                 <FilterSelect options={[t('filter_all', lang)]} />
                             </FilterInput>
                             <FilterInput label={t('sd_filter_count', lang)}>
                                 <FilterSelect options={[t('filter_all', lang)]} />
                             </FilterInput>
                         </div>
                     </div>
                     <div className="flex gap-2">
                         <ArkButton variant="ghost" className="h-[32px] px-4 whitespace-nowrap">
                            <X size={14} className="mr-1" /> {t('filter_reset', lang)}
                         </ArkButton>
                     </div>
                 </div>

                 {/* Row 2: Status & Threat */}
                 <div className="flex flex-col md:flex-row gap-6 border-t border-ark-border/50 pt-4">
                     <div className="flex items-center gap-4">
                         <span className="text-xs font-mono text-ark-subtext font-bold">{t('sd_filter_status', lang)}:</span>
                         <div className="flex gap-1 bg-ark-bg p-1 rounded-sm border border-ark-border">
                             <button className="px-3 py-1 text-xs bg-white text-black shadow-sm rounded-sm font-bold">{t('sd_status_completed', lang)}</button>
                             <button className="px-3 py-1 text-xs text-ark-subtext hover:text-ark-text">{t('sd_status_analyzing', lang)}</button>
                         </div>
                     </div>
                     
                     <div className="h-8 w-[1px] bg-ark-border hidden md:block" />

                     <div className="flex items-center gap-4 overflow-x-auto">
                         <span className="text-xs font-mono text-ark-subtext font-bold whitespace-nowrap">{t('sd_filter_threat', lang)}:</span>
                         <div className="flex gap-2">
                             <button className="text-xs px-2 py-1 hover:text-ark-primary transition-colors text-ark-text font-bold border-b-2 border-ark-text">{t('sd_threat_all', lang)}</button>
                             <button className="text-xs px-2 py-1 hover:text-ark-primary transition-colors text-ark-subtext">{t('sd_threat_malicious', lang)}</button>
                             <button className="text-xs px-2 py-1 hover:text-ark-primary transition-colors text-ark-subtext">{t('sd_threat_suspicious', lang)}</button>
                             <button className="text-xs px-2 py-1 hover:text-ark-primary transition-colors text-ark-subtext">{t('sd_threat_safe', lang)}</button>
                             <button className="text-xs px-2 py-1 hover:text-ark-primary transition-colors text-ark-subtext">{t('sd_threat_unknown', lang)}</button>
                         </div>
                     </div>
                 </div>
            </div>

            {/* Toolbar Right Above Table */}
            <div className="flex justify-end">
                <ArkButton variant="ghost" size="sm" className="gap-2 border-ark-border hover:border-ark-text">
                    <FileText size={14} /> {t('export', lang)}
                </ArkButton>
            </div>

            {/* Table */}
            <div className="flex-1 flex flex-col min-h-[500px] bg-ark-panel border border-ark-border overflow-hidden shadow-sm relative">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <ArkLoading />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto custom-scrollbar flex-1">
                            <table className="w-full text-left text-sm min-w-[1400px]">
                                <thead className="bg-ark-active/10 text-ark-subtext font-mono text-xs font-bold uppercase shadow-sm border-b border-ark-border sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th className="p-4 whitespace-nowrap">{t('sd_col_info', lang)}</th>
                                        <th className="p-4 whitespace-nowrap w-[120px]">{t('sd_col_threat', lang)}</th>
                                        <th className="p-4 whitespace-nowrap">{t('sd_col_status', lang)}</th>
                                        <th className="p-4 whitespace-nowrap cursor-pointer hover:text-ark-primary select-none">{t('sd_col_count', lang)} ↕</th>
                                        <th className="p-4 whitespace-nowrap cursor-pointer hover:text-ark-primary select-none">{t('sd_col_time', lang)} ↕</th>
                                        <th className="p-4 whitespace-nowrap">{t('sd_col_attacker', lang)}</th>
                                        <th className="p-4 whitespace-nowrap">{t('sd_col_node', lang)}</th>
                                        <th className="p-4 whitespace-nowrap">{t('sd_col_hash', lang)}</th>
                                        <th className="p-4 whitespace-nowrap text-center">{t('sd_col_op', lang)}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ark-border font-mono text-xs">
                                    {logs.length > 0 ? (
                                        logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-ark-active/5 transition-colors group">
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-ark-text text-sm group-hover:text-ark-primary transition-colors cursor-pointer hover:underline">{log.fileName}</span>
                                                        <span className="text-[10px] text-ark-subtext mt-0.5">{log.fileSize} | {log.fileType}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 text-[10px] uppercase font-bold border rounded-sm ${getThreatColor(log.threatLevel)} bg-opacity-10`}>
                                                        {getThreatLabel(log.threatLevel)}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'completed' ? 'bg-green-500' : log.status === 'analyzing' ? 'bg-ark-primary animate-pulse' : 'bg-gray-500'}`} />
                                                        <span className="capitalize text-ark-text">{log.status}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-ark-text font-bold pl-8">{log.captureCount}</td>
                                                <td className="p-4 text-ark-subtext">{log.lastTime}</td>
                                                <td className="p-4 text-ark-text hover:text-ark-primary cursor-pointer">{log.attackerIp}</td>
                                                <td className="p-4 text-ark-subtext">{log.sourceNode}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 group/hash">
                                                        <span className="text-ark-subtext max-w-[100px] truncate">{log.sha256}</span>
                                                        <button className="opacity-0 group-hover/hash:opacity-100 text-ark-primary hover:text-ark-text transition-opacity" title={t('label_copy', lang)}>
                                                            <FileText size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button onClick={handleAnalysis} className="text-ark-subtext hover:text-ark-primary transition-colors" title={t('btn_submit_analysis', lang)}>
                                                            <Cloud size={16} />
                                                        </button>
                                                        <button onClick={handleDownload} className="text-ark-subtext hover:text-ark-primary transition-colors" title={t('cp_btn_download', lang)}>
                                                            <Download size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(log.id)} 
                                                            className={`text-ark-subtext hover:text-ark-danger transition-colors ${pendingSamples.has(log.id) ? 'opacity-50 cursor-wait' : ''}`}
                                                            title={t('mc_delete', lang)}
                                                            disabled={pendingSamples.has(log.id)}
                                                        >
                                                            {pendingSamples.has(log.id) ? (
                                                                <RefreshCw size={16} className="animate-spin" />
                                                            ) : (
                                                                <Trash2 size={16} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="p-20 text-center">
                                                <div className="flex flex-col items-center justify-center opacity-50 gap-4">
                                                    <div className="w-16 h-16 border-2 border-dashed border-ark-subtext rounded-full flex items-center justify-center bg-ark-active/5">
                                                        <Box size={32} className="text-ark-subtext" />
                                                    </div>
                                                    <span className="text-ark-subtext font-mono tracking-widest text-xs">{t('no_data', lang)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Pagination */}
                        <div className="p-3 border-t border-ark-border bg-ark-bg flex justify-end items-center gap-4 text-xs font-mono text-ark-subtext">
                            <span>{t('total_records', lang)} {logs.length}</span>
                            <div className="flex gap-1">
                                <button className="w-6 h-6 flex items-center justify-center border border-ark-border hover:border-ark-primary hover:text-ark-primary transition-colors disabled:opacity-50" disabled><ChevronLeft size={12} /></button>
                                <button className="w-6 h-6 flex items-center justify-center border border-ark-primary bg-ark-primary text-black font-bold">1</button>
                                <button className="w-6 h-6 flex items-center justify-center border border-ark-border hover:border-ark-primary hover:text-ark-primary transition-colors">2</button>
                                <button className="w-6 h-6 flex items-center justify-center border border-ark-border hover:border-ark-primary hover:text-ark-primary transition-colors">3</button>
                                <span className="mx-1">...</span>
                                <button className="w-6 h-6 flex items-center justify-center border border-ark-border hover:border-ark-primary hover:text-ark-primary transition-colors">8</button>
                                <button className="w-6 h-6 flex items-center justify-center border border-ark-border hover:border-ark-primary hover:text-ark-primary transition-colors"><ChevronRight size={12} /></button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
