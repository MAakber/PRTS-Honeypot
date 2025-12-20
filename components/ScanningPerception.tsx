
import React, { useState, useEffect } from 'react';
import { ArkButton, ArkLoading } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { RefreshCw, Settings, Activity, ChevronRight, Clock, MapPin, Network } from 'lucide-react';
import { ArkDateRangePicker } from './ArkDateRangePicker';
import { useNotification } from './NotificationSystem';

const ScanningAnimation = () => {
    const { lang } = useApp();
    return (
        <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0 hidden lg:block opacity-90 mr-4 self-center select-none pointer-events-none">
            {/* Radar Base */}
            <div className="absolute inset-0 border border-ark-primary/30 rounded-full" />
            <div className="absolute inset-[15%] border border-ark-primary/20 rounded-full" />
            <div className="absolute inset-[30%] border border-ark-primary/10 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-1 bg-ark-primary rounded-full" />
            </div>

            {/* Sweep */}
            <div 
                className="absolute inset-0 rounded-full border-t border-ark-primary/50 bg-gradient-to-r from-transparent via-ark-primary/10 to-transparent" 
                style={{ animation: 'spin 3s linear infinite' }} 
            />
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>

            {/* Signals */}
            <div className="absolute top-[20%] right-[25%] w-1.5 h-1.5 bg-ark-danger rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute bottom-[30%] left-[25%] w-1.5 h-1.5 bg-ark-primary rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-[60%] right-[20%] w-1 h-1 bg-ark-subtext rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            
            {/* Data Text */}
            <div className="absolute -right-6 top-0 text-[9px] font-mono text-ark-primary/70 animate-pulse">{t('sp_radar_scanning', lang)}</div>
            <div className="absolute -left-2 bottom-0 text-[9px] font-mono text-ark-subtext/50">{t('sp_radar_active', lang)}</div>
        </div>
    );
};

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

export const ScanningPerception: React.FC = () => {
    const { lang, modules, toggleModule, authFetch } = useApp();
    const { notify } = useNotification();
    const enabled = modules.scanning;
    const [dateRange, setDateRange] = useState({ start: '2023-10-24T00:00', end: '2023-10-24T23:59' });
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/v1/scans');
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch scan logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [authFetch]);

    const handleToggle = () => {
        const newState = !enabled;
        toggleModule('scanning');
        notify(newState ? 'success' : 'warning', t('op_success', lang), newState ? t('msg_module_on', lang) : t('msg_module_off', lang));
    };

    return (
        <div className="flex flex-col gap-4 pb-20 md:pb-6 min-h-full">
             {/* Header Section */}
             <div className="bg-ark-panel border border-ark-border shadow-sm relative transition-all duration-300">
                 {/* Accent Line with Animation */}
                 <div className={`absolute top-0 left-0 h-full bg-ark-primary transition-all duration-300 ease-out ${enabled ? 'w-1 opacity-100' : 'w-0 opacity-0'}`} />
                 
                 <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                     <div className="relative z-10 flex-1 w-full max-w-4xl">
                         {/* Title Row */}
                         <div className="flex items-center mb-4 w-full">
                             <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                                 <div className="p-2 bg-ark-active/20 rounded-sm text-ark-primary border border-ark-primary/20 shrink-0">
                                    <Activity size={20} className="md:w-6 md:h-6" />
                                 </div>
                                 <h2 className="text-lg md:text-xl font-bold text-ark-text">
                                    {t('scanning_perception', lang)}
                                 </h2>
                                 
                                 {/* Toggle Switch - Positioned right next to title */}
                                 <button 
                                    onClick={handleToggle}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 cursor-pointer ml-2 ${enabled ? 'bg-ark-primary' : 'bg-ark-subtext/30'}`}
                                    aria-label="Toggle Scanning Perception"
                                 >
                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                 </button>
                             </div>
                         </div>
                         
                         {/* Description Content */}
                         <div className="text-xs text-ark-text/80 font-mono leading-relaxed w-full pl-1">
                             <div className="space-y-2 mb-3">
                                 <div className="flex items-start gap-2">
                                    <span className="text-ark-primary mt-0.5 shrink-0">•</span> 
                                    <p className="break-words whitespace-normal">{t('scan_desc_1', lang)}</p>
                                 </div>
                                 <div className="flex items-start gap-2">
                                    <span className="text-ark-primary mt-0.5 shrink-0">•</span>
                                    <p className="break-words whitespace-normal">{t('scan_desc_2', lang)}</p>
                                 </div>
                                 <div className="flex items-start gap-2">
                                    <span className="text-ark-primary mt-0.5 shrink-0">•</span>
                                    <p className="break-words whitespace-normal">{t('scan_desc_3', lang)}</p>
                                 </div>
                                 <div className="flex items-start gap-2">
                                    <span className="text-ark-primary mt-0.5 shrink-0">•</span>
                                    <p className="break-words whitespace-normal">{t('scan_desc_4', lang)}</p>
                                 </div>
                             </div>
                         </div>
                     </div>

                     {/* Right Side Animation (Desktop Only) */}
                     <ScanningAnimation />
                 </div>
             </div>

             {/* Filters */}
             <div className="bg-ark-panel border border-ark-border p-4 shadow-sm relative transition-all duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                   <div className="md:col-span-2 lg:col-span-1">
                       <ArkDateRangePicker value={dateRange} onChange={setDateRange} className="w-full" />
                   </div>
                   <FilterInput label={t('filter_scanning_ip', lang)} placeholder={t('filter_placeholder_search', lang)} />
                   <FilterInput label={t('filter_scanning_node', lang)}>
                       <FilterSelect options={[t('filter_all', lang)]} />
                   </FilterInput>
                   <FilterInput label={t('filter_scanning_type', lang)}>
                       <FilterSelect options={[t('filter_all', lang)]} />
                   </FilterInput>
                   <FilterInput label={t('filter_scanning_port', lang)} placeholder="80, 443" />
                   <FilterInput label={t('filter_scanning_time', lang)}>
                       <FilterSelect options={[t('filter_all', lang)]} />
                   </FilterInput>
                </div>
                 {/* Actions */}
                 <div className="flex justify-end mt-4 pt-3 border-t border-ark-border border-dashed">
                     <div className="flex gap-2 w-full md:w-auto">
                         <ArkButton variant="ghost" size="sm" className="gap-2 flex-1 md:flex-none justify-center">
                             <Settings size={14} /> {t('btn_scanning_config', lang)}
                         </ArkButton>
                         <ArkButton variant="primary" size="sm" className="gap-2 flex-1 md:flex-none justify-center">
                             <RefreshCw size={14} /> {t('refresh', lang)}
                         </ArkButton>
                     </div>
                 </div>
             </div>

             {/* List Content */}
             <div className="flex-1 flex flex-col min-h-[500px] bg-ark-panel border border-ark-border overflow-hidden shadow-sm">
                 {loading ? (
                     <ArkLoading label="FETCHING_SCAN_DATA" />
                 ) : (
                     <>
                         {/* Mobile Card View */}
                         <div className="md:hidden flex-1 overflow-auto custom-scrollbar p-0">
                             {logs.map(log => (
                                 <div key={log.id} className="border-b border-ark-border p-4 hover:bg-ark-active/5 transition-colors">
                                     <div className="flex justify-between items-start mb-2">
                                         <div className="flex flex-col">
                                             <span className="font-bold text-ark-text text-sm">{log.ip}</span>
                                             <span className="text-[10px] text-ark-subtext font-mono mt-0.5">{log.start}</span>
                                         </div>
                                         <span className={`px-2 py-0.5 border text-[10px] rounded-sm uppercase font-bold ${
                                             log.threat === 'Malicious' ? 'border-red-500/50 text-red-500 bg-red-500/10' :
                                             log.threat === 'High Risk' ? 'border-orange-500/50 text-orange-500 bg-orange-500/10' :
                                             log.threat === 'Suspicious' ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' :
                                             'border-ark-subtext/50 text-ark-subtext bg-ark-subtext/10'
                                         }`}>
                                             {log.threat === 'Malicious' ? t('sp_threat_malicious', lang) :
                                              log.threat === 'High Risk' ? t('sp_threat_high', lang) :
                                              log.threat === 'Suspicious' ? t('sp_threat_suspicious', lang) :
                                              log.threat === 'Low' ? t('sp_threat_low', lang) :
                                              log.threat}
                                         </span>
                                     </div>

                                     <div className="grid grid-cols-2 gap-3 text-xs text-ark-subtext mb-3">
                                         <div className="flex items-center gap-1.5 overflow-hidden">
                                             <MapPin size={12} className="shrink-0" />
                                             <span className="truncate">{log.node} ({log.location})</span>
                                         </div>
                                         <div className="flex items-center gap-1.5 justify-end">
                                             <Clock size={12} className="shrink-0" />
                                             <span>{log.duration}</span>
                                         </div>
                                     </div>

                                     <div className="bg-ark-bg/50 rounded-sm p-2 flex items-center justify-between text-xs border border-ark-border/50">
                                         <div className="flex items-center gap-2">
                                             <span className="bg-ark-active/20 text-ark-primary px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{log.type}</span>
                                             <span className="text-ark-text font-mono">{log.count} Pkts</span>
                                         </div>
                                         <div className="flex items-center gap-1 text-ark-subtext max-w-[40%]">
                                             <Network size={12} />
                                             <span className="truncate">{log.ports}</span>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                         </div>

                         {/* Desktop Table View */}
                         <div className="hidden md:block overflow-auto custom-scrollbar flex-1">
                             <table className="w-full text-left text-sm min-w-[1200px]">
                                 <thead className="bg-ark-active/10 text-ark-subtext font-mono text-xs uppercase shadow-sm border-b border-ark-border sticky top-0 z-10 backdrop-blur-md">
                                     <tr>
                                         <th className="p-4 font-bold whitespace-nowrap w-[200px]">{t('scan_ip', lang)}</th>
                                         <th className="p-4 font-bold whitespace-nowrap">{t('threat_info', lang)}</th>
                                         <th className="p-4 font-bold whitespace-nowrap">{t('scanned_node', lang)}</th>
                                         <th className="p-4 font-bold whitespace-nowrap text-center">{t('scan_type', lang)}</th>
                                         <th className="p-4 font-bold whitespace-nowrap text-right">{t('scan_count', lang)}</th>
                                         <th className="p-4 font-bold whitespace-nowrap">{t('scanned_port', lang)}</th>
                                         <th className="p-4 font-bold whitespace-nowrap">{t('start_time', lang)}</th>
                                         <th className="p-4 font-bold whitespace-nowrap">{t('duration', lang)}</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-ark-border font-mono text-xs">
                                     {logs.map(log => (
                                         <tr key={log.id} className="hover:bg-ark-active/5 transition-colors group">
                                             <td className="p-4">
                                                 <div className="flex items-center gap-2">
                                                     <span className="font-bold text-ark-text group-hover:text-ark-primary transition-colors">{log.ip}</span>
                                                 </div>
                                             </td>
                                             <td className="p-4">
                                                 <span className={`px-2 py-0.5 border text-[10px] rounded-sm uppercase ${
                                                     log.threat === 'Malicious' ? 'border-red-500/50 text-red-500 bg-red-500/10' :
                                                     log.threat === 'High Risk' ? 'border-orange-500/50 text-orange-500 bg-orange-500/10' :
                                                     log.threat === 'Suspicious' ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' :
                                                     'border-ark-subtext/50 text-ark-subtext bg-ark-subtext/10'
                                                 }`}>
                                                     {log.threat === 'Malicious' ? t('sp_threat_malicious', lang) :
                                                      log.threat === 'High Risk' ? t('sp_threat_high', lang) :
                                                      log.threat === 'Suspicious' ? t('sp_threat_suspicious', lang) :
                                                      log.threat === 'Low' ? t('sp_threat_low', lang) :
                                                      log.threat}
                                                 </span>
                                             </td>
                                             <td className="p-4">
                                                 <div className="flex flex-col">
                                                     <span className="text-ark-text">{log.node}</span>
                                                     <div className="flex items-center gap-1 text-[10px] text-ark-subtext">
                                                         <MapPin size={10} /> {log.location}
                                                     </div>
                                                 </div>
                                             </td>
                                             <td className="p-4 text-center">
                                                 <span className="font-bold bg-ark-active/20 px-2 py-1 rounded text-ark-primary">{log.type}</span>
                                             </td>
                                             <td className="p-4 text-right font-bold text-ark-text">{log.count}</td>
                                             <td className="p-4 text-ark-subtext truncate max-w-[200px]" title={log.ports}>{log.ports}</td>
                                             <td className="p-4 text-ark-subtext">{log.start}</td>
                                             <td className="p-4 text-ark-text flex items-center gap-1">
                                                 <Clock size={12} className="text-ark-subtext" /> {log.duration}
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     </>
                 )}
                 {/* Footer */}
                 <div className="p-3 border-t border-ark-border bg-ark-bg flex justify-between items-center text-xs text-ark-subtext font-mono">
                     <span className="hidden md:inline">{t('display_order', lang)} {t('sort_time', lang)}</span>
                     <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <span>{t('total_count', lang)} {logs.length}</span>
                        <div className="flex gap-1">
                            <button className="px-2 py-1 border border-ark-border disabled:opacity-50 hover:bg-ark-active hover:text-ark-primary transition-colors" disabled>&lt;</button>
                            <button className="px-2 py-1 border border-ark-border disabled:opacity-50 hover:bg-ark-active hover:text-ark-primary transition-colors" disabled>&gt;</button>
                        </div>
                     </div>
                 </div>
             </div>
        </div>
    );
};
