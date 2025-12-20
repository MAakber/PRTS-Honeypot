
import React, { useState, useEffect } from 'react';
import { ArkButton, ArkLoading } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { Key, Users, X, FileText, ChevronRight, Share2, Building, ChevronLeft, Lock } from 'lucide-react';
import { ArkDateRangePicker } from './ArkDateRangePicker';
import { useNotification } from './NotificationSystem';

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

const TopList: React.FC<{ title: string, icon: React.ReactNode, data: { name: string, count: number }[] }> = ({ title, icon, data }) => (
    <div className="bg-ark-panel border border-ark-border p-4 flex-1 flex flex-col h-full min-h-[300px]">
        <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-ark-active/20 rounded-sm text-ark-subtext">
                {icon}
            </div>
            <h3 className="text-sm font-bold text-ark-text">{title}</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
             {data.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-ark-subtext opacity-50 gap-2">
                     <FileText size={32} />
                     <span className="text-xs font-mono">{t('no_data', 'en')}</span>
                 </div>
             ) : (
                 data.map((item, index) => (
                    <div key={index} className="group">
                        <div className="flex justify-between text-xs font-mono mb-1">
                            <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 flex items-center justify-center rounded-[2px] text-[10px] font-bold ${index < 3 ? 'bg-ark-primary text-black' : 'bg-ark-active/20 text-ark-subtext'}`}>
                                    {index + 1}
                                </span>
                                <span className="text-ark-text truncate max-w-[120px]" title={item.name}>{item.name}</span>
                            </div>
                            <span className="text-ark-primary">{item.count}</span>
                        </div>
                        <div className="h-1 w-full bg-ark-bg rounded-full overflow-hidden">
                             <div className="h-full bg-ark-subtext group-hover:bg-ark-primary transition-colors duration-300" style={{ width: `${(item.count / data[0].count) * 100}%` }} />
                        </div>
                    </div>
                 ))
             )}
        </div>
    </div>
);

export const AccountResources: React.FC = () => {
    const { lang, modules, toggleModule, authFetch } = useApp();
    const { notify } = useNotification();
    const enabled = modules.infoStealing;
    const [dateRange, setDateRange] = useState({ start: '2025-11-07T00:00', end: '2025-12-06T23:59' });
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        credentials: any[],
        topUsernames: any[],
        topPasswords: any[]
    }>({ credentials: [], topUsernames: [], topPasswords: [] });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await authFetch('/api/v1/stats/accounts');
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to fetch account resources", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [authFetch]);

    const handleToggle = () => {
        const newState = !enabled;
        toggleModule('infoStealing');
        notify(newState ? 'success' : 'warning', t('op_success', lang), newState ? t('msg_module_on', lang) : t('msg_module_off', lang));
    };

    return (
        <div className="flex flex-col gap-4 pb-6 min-h-full">
            {/* Header Section */}
            <div className="bg-ark-panel border border-ark-border shadow-sm relative transition-all duration-300">
                {/* Accent Line with Animation */}
                <div className={`absolute top-0 left-0 h-full bg-ark-primary transition-all duration-300 ease-out ${enabled ? 'w-1 opacity-100' : 'w-0 opacity-0'}`} />
                
                <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                    <div className="relative z-10 flex-1 w-full max-w-4xl">
                         <div className="flex items-center gap-4 mb-4 flex-wrap">
                             <div className="p-2 bg-ark-active/20 rounded-sm text-ark-primary border border-ark-primary/20 shrink-0">
                                 <Key size={20} className="md:w-6 md:h-6" />
                             </div>
                             <h2 className="text-lg md:text-xl font-bold text-ark-text">{t('ar_title', lang)}</h2>
                             {/* Toggle Switch */}
                             <button 
                                onClick={handleToggle}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 cursor-pointer ml-2 ${enabled ? 'bg-ark-primary' : 'bg-ark-subtext/30'}`}
                                aria-label="Toggle Account Resources"
                             >
                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                             </button>
                         </div>
                         
                         <div className="space-y-3 text-xs text-ark-text/80 font-mono leading-relaxed w-full">
                             <p className="break-words whitespace-normal">{t('ar_desc_1', lang)}</p>
                             <ul className="space-y-1 pl-4">
                                 <li className="flex items-start gap-2">
                                     <span className="text-ark-primary mt-0.5 shrink-0">•</span>
                                     <span className="break-words whitespace-normal">{t('ar_desc_2', lang)}</span>
                                 </li>
                                 <li className="flex items-start gap-2">
                                     <span className="text-ark-primary mt-0.5 shrink-0">•</span>
                                     <span className="break-words whitespace-normal">{t('ar_desc_3', lang)}</span>
                                 </li>
                             </ul>
                         </div>
                    </div>

                    {/* Illustration (Right Side) */}
                    <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-ark-subtext opacity-80 mr-4 self-center">
                         <div className="flex flex-col items-center gap-1">
                             <Users size={32} className="text-ark-danger" />
                             <span>Attacker</span>
                         </div>
                         <div className="h-[1px] w-12 bg-ark-border relative">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-ark-border rounded-full" />
                         </div>
                         <div className="bg-ark-bg border border-ark-border p-3 rounded-sm text-center shadow-sm">
                             <div className="text-ark-text font-bold mb-1">admin&admin</div>
                             <div className="text-red-500 mb-1">admin&hfish</div>
                             <div className="text-ark-subtext text-[10px]">hfish&hfish123</div>
                             <div className="text-[10px] text-ark-subtext mt-1">...</div>
                             <div className="mt-2 text-[10px] text-ark-subtext border-t border-ark-border pt-1">Attack Dictionary</div>
                         </div>
                         <div className="flex flex-col gap-1 items-start">
                             <div className="flex items-center gap-2">
                                 <div className="w-12 h-[1px] bg-ark-border relative">
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-ark-border" />
                                 </div>
                                 <div className="p-1 bg-ark-active/20 border border-ark-primary/30 rounded-sm">
                                     <Building size={16} className="text-ark-primary" />
                                 </div>
                             </div>
                             <div className="flex items-center gap-2">
                                 <div className="w-12 h-[1px] bg-ark-border relative">
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-ark-border" />
                                 </div>
                                 <div className="p-1 bg-ark-active/20 border border-ark-primary/30 rounded-sm">
                                     <Share2 size={16} className="text-ark-primary" />
                                 </div>
                             </div>
                             <span className="text-[10px] ml-14 mt-1">Nodes</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-ark-panel border border-ark-border p-4 shadow-sm space-y-3">
                <div className="flex flex-col xl:flex-row gap-3">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="lg:col-span-1">
                            <ArkDateRangePicker value={dateRange} onChange={setDateRange} className="w-full" />
                        </div>
                        <FilterInput label={t('ar_filter_search', lang)} width="lg:col-span-1" />
                        <FilterInput label={t('ar_filter_service', lang)}>
                             <FilterSelect options={[t('filter_all', lang), 'SSH', 'RDP', 'FTP', 'HTTP']} />
                        </FilterInput>
                    </div>
                    <ArkButton variant="ghost" className="h-[32px] w-full xl:w-auto px-6 whitespace-nowrap">
                        <X size={14} className="mr-1" /> {t('filter_reset', lang)}
                    </ArkButton>
                </div>
                
                {/* Status Toggles Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                     <FilterInput label={t('filter_ip_status', lang)}>
                         <div className="flex h-full w-full bg-ark-bg/20">
                             <div className="flex-1 flex items-center justify-center text-[10px] text-ark-subtext border-r border-ark-border/50 cursor-not-allowed opacity-50">Marked IP</div>
                         </div>
                    </FilterInput>
                     <FilterInput label={t('ar_filter_monitor', lang)}>
                         <div className="flex h-full w-full bg-ark-bg/20">
                             <div className="flex-1 flex items-center justify-center text-[10px] text-ark-subtext border-r border-ark-border/50 cursor-not-allowed opacity-50">Enterprise Monitored</div>
                         </div>
                    </FilterInput>
                    <FilterInput label={t('ar_filter_data', lang)}>
                         <div className="flex h-full w-full bg-ark-bg/20">
                             <div className="flex-1 flex items-center justify-center text-[10px] text-ark-subtext border-r border-ark-border/50 cursor-not-allowed opacity-50">Compromised Data</div>
                         </div>
                    </FilterInput>
                </div>
            </div>

            {/* Content Split */}
            <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-[500px]">
                {/* Left Side: Top Lists */}
                <div className="w-full xl:w-1/4 flex flex-col gap-4">
                    <TopList title={t('ar_top_users', lang)} icon={<Users size={16} />} data={data.topUsernames} />
                    <TopList title={t('ar_top_passwords', lang)} icon={<Lock size={16} />} data={data.topPasswords} />
                </div>

                {/* Right Side: Table */}
                <div className="flex-1 bg-ark-panel border border-ark-border flex flex-col overflow-hidden relative">
                    {loading && <ArkLoading label="FETCHING_CREDENTIAL_DATA" />}
                    
                    {/* Toolbar */}
                    <div className="p-2 border-b border-ark-border flex justify-end gap-2 bg-ark-active/5">
                        <ArkButton variant="ghost" size="sm" className="gap-2">
                             <FileText size={14} /> {t('export', lang)}
                        </ArkButton>
                        <ArkButton variant="primary" size="sm" className="gap-2 bg-ark-text text-ark-bg hover:bg-ark-primary hover:text-white">
                             <Building size={14} /> {t('ar_btn_monitor', lang)}
                        </ArkButton>
                    </div>

                    {/* Table Content */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left text-sm min-w-[800px]">
                            <thead className="bg-ark-active/10 text-ark-subtext font-mono text-xs font-bold uppercase shadow-sm border-b border-ark-border sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="p-4 whitespace-nowrap">{t('ar_col_username', lang)}</th>
                                    <th className="p-4 whitespace-nowrap">{t('ar_col_password', lang)}</th>
                                    <th className="p-4 whitespace-nowrap">{t('ar_col_service', lang)}</th>
                                    <th className="p-4 whitespace-nowrap cursor-pointer hover:text-ark-primary transition-colors select-none">{t('ar_col_count', lang)} ↓</th>
                                    <th className="p-4 whitespace-nowrap text-right pr-6">{t('ar_col_ip', lang)}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ark-border font-mono text-xs">
                                {data.credentials.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-ark-subtext opacity-50">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText size={48} />
                                                <span>{t('no_data', lang)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    data.credentials.map(item => (
                                        <tr key={item.id} className="hover:bg-ark-active/5 transition-colors group">
                                            <td className="p-4 font-bold text-ark-text">{item.username}</td>
                                            <td className="p-4 text-ark-primary font-mono">{item.password}</td>
                                            <td className="p-4 text-ark-subtext">{item.service}</td>
                                            <td className="p-4 text-ark-text font-bold">{item.count}</td>
                                            <td className="p-4 text-right pr-6 text-ark-subtext group-hover:text-ark-primary transition-colors">{item.ip}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Pagination */}
                    <div className="p-3 border-t border-ark-border bg-ark-bg flex justify-end items-center gap-4 text-xs font-mono text-ark-subtext">
                        <span>{t('total_records', lang)} {data.credentials.length}</span>
                        <div className="flex gap-1">
                            <button className="w-6 h-6 flex items-center justify-center border border-ark-border hover:border-ark-primary hover:text-ark-primary transition-colors disabled:opacity-50" disabled><ChevronLeft size={12} /></button>
                            <button className="w-6 h-6 flex items-center justify-center border border-ark-primary bg-ark-primary text-black font-bold">1</button>
                            <button className="w-6 h-6 flex items-center justify-center border border-ark-border hover:border-ark-primary hover:text-ark-primary transition-colors disabled:opacity-50" disabled><ChevronRight size={12} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
