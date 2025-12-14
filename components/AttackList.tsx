
import React, { useState } from 'react';
import { ArkCard, ArkButton, ArkBadge } from './ArknightsUI';
import { MOCK_ATTACKS } from '../constants';
import { AttackLog } from '../types';
import { X, Search, Download, ChevronDown, RefreshCw, PlusSquare, MinusSquare, Copy, Eye, Globe, Server, Activity, ArrowRight, ShieldAlert, FileText } from 'lucide-react';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { ImageWorldMap } from './WorldMap';
import { useNotification } from './NotificationSystem';
import { ArkDateRangePicker } from './ArkDateRangePicker';

const FilterGroup: React.FC<{ label: string, children: React.ReactNode, className?: string }> = ({ label, children, className = "" }) => (
    <div className={`flex items-center border border-ark-border bg-ark-panel h-[32px] ${className}`}>
        <div className="px-3 text-xs text-ark-subtext font-mono whitespace-nowrap border-r border-ark-border h-full flex items-center bg-ark-bg/30 min-w-fit">
            {label}
        </div>
        <div className="flex-1 min-w-0 h-full flex items-center relative">
            {children}
        </div>
    </div>
);

const AttackListVisual = () => {
    return (
        <div className="relative w-48 h-32 hidden lg:flex items-center justify-center select-none pointer-events-none mr-4">
             {/* Simple visualization of logging */}
             <div className="flex flex-col gap-2 w-full pr-12 relative overflow-hidden">
                 <div className="flex items-center gap-2 animate-pulse">
                     <div className="w-2 h-2 bg-red-500 rounded-full"/>
                     <div className="h-1 w-24 bg-red-500/20 rounded-full"/>
                 </div>
                 <div className="flex items-center gap-2 animate-pulse delay-75">
                     <div className="w-2 h-2 bg-orange-500 rounded-full"/>
                     <div className="h-1 w-16 bg-orange-500/20 rounded-full"/>
                 </div>
                 <div className="flex items-center gap-2 animate-pulse delay-150">
                     <div className="w-2 h-2 bg-yellow-500 rounded-full"/>
                     <div className="h-1 w-20 bg-yellow-500/20 rounded-full"/>
                 </div>
             </div>
             
             {/* Shield/Log Icon */}
             <div className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-ark-panel border border-ark-primary rounded-sm shadow-lg z-10">
                 <FileText size={24} className="text-ark-primary" />
                 <div className="absolute -top-1 -right-1 w-2 h-2 bg-ark-danger rounded-full animate-ping" />
             </div>
        </div>
    )
}

export const AttackList: React.FC = () => {
  const { lang, modules, toggleModule } = useApp();
  const { notify } = useNotification();
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '2025-11-30T00:00', end: '2025-12-06T23:59' });

  const enabled = modules.attack;

  const handleToggle = () => {
      const newState = !enabled;
      toggleModule('attack');
      notify(newState ? 'success' : 'warning', t('op_success', lang), newState ? t('msg_module_on', lang) : t('msg_module_off', lang));
  };

  // Data Mocking
  const displayLogs = [...MOCK_ATTACKS, ...MOCK_ATTACKS, ...MOCK_ATTACKS].map((log, i) => {
      let locKey = 'unknown';
      if (log.location.includes('Shanghai')) locKey = 'city_shanghai';
      else if (log.location.includes('Moscow')) locKey = 'city_moscow';
      else if (log.location.includes('California')) locKey = 'city_california';
      else if (log.location.includes('Internal')) locKey = 'city_internal';
      
      return {
          ...log,
          id: `${log.id}-${i}`,
          serviceName: log.method === 'SSH' ? 'SSH Monitoring' : 
                       log.method === 'HTTP' ? 'Elasticsearch' : 
                       log.method === 'SMB' ? 'SMB Port' : 'Service Probe',
          port: log.method === 'SSH' ? '22' : log.method === 'HTTP' ? '9200' : '445',
          victimNode: 'Internal Node (26.44.0.122)',
          country: t(locKey as any, lang),
      };
  });

  const handleDownload = (log: AttackLog) => {
      notify('success', t('op_success', lang), t('op_download_start', lang));
  };

  const toggleExpand = (id: string) => {
      setExpandedLogId(prev => prev === id ? null : id);
  };

  const gridClass = "grid grid-cols-[160px_180px_200px_140px_1fr_80px] gap-4 items-center";

  return (
    <div className="flex flex-col h-full min-h-[800px] gap-4 pb-20 md:pb-6">
      
      {/* New Header Section */}
      <div className="bg-ark-panel border border-ark-border shadow-sm relative transition-all duration-300">
         {/* Accent Line with Animation */}
         <div className={`absolute top-0 left-0 h-full bg-ark-primary transition-all duration-300 ease-out ${enabled ? 'w-1 opacity-100' : 'w-0 opacity-0'}`} />
         
         <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
             <div className="relative z-10 flex-1 w-full max-w-4xl">
                 <div className="flex items-center gap-4 mb-4 flex-wrap">
                     <div className="p-2 bg-ark-active/20 rounded-sm text-ark-primary border border-ark-primary/20 shrink-0">
                         <ShieldAlert size={20} className="md:w-6 md:h-6" />
                     </div>
                     <h2 className="text-lg md:text-xl font-bold text-ark-text">{t('al_title', lang)}</h2>
                     
                     {/* Toggle Switch */}
                     <button 
                        onClick={handleToggle}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 cursor-pointer ml-2 ${enabled ? 'bg-ark-primary' : 'bg-ark-subtext/30'}`}
                        aria-label="Toggle Attack Module"
                     >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                     </button>
                 </div>
                 
                 <div className="space-y-3 text-xs text-ark-text/80 font-mono leading-relaxed w-full">
                     <p className="break-words whitespace-normal">{t('al_desc', lang)}</p>
                     <ul className="space-y-1 pl-4">
                         <li className="flex items-start gap-2">
                             <span className="text-ark-primary mt-0.5 shrink-0">•</span>
                             <span className="break-words whitespace-normal">{t('al_point_1', lang)}</span>
                         </li>
                         <li className="flex items-start gap-2">
                             <span className="text-ark-primary mt-0.5 shrink-0">•</span>
                             <span className="break-words whitespace-normal">{t('al_point_2', lang)}</span>
                         </li>
                         <li className="flex items-start gap-2">
                             <span className="text-ark-primary mt-0.5 shrink-0">•</span>
                             <span className="break-words whitespace-normal">{t('al_point_3', lang)}</span>
                         </li>
                     </ul>
                 </div>
             </div>

             {/* Right Side Visual */}
             <AttackListVisual />
         </div>
      </div>

      {/* Map Section */}
      <ArkCard className="flex-shrink-0" title={t('attack_source_dist', lang)}>
        <div className="w-full h-[300px]">
           <ImageWorldMap />
        </div>
      </ArkCard>

      {/* Filters */}
      <div className="bg-ark-panel border border-ark-border p-4 shadow-sm relative transition-all duration-300 mb-4 group hover:border-ark-primary/50">
         <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 relative z-10">
                <div className="col-span-1">
                    <ArkDateRangePicker value={dateRange} onChange={setDateRange} className="w-full" />
                </div>
                <FilterGroup label={t('filter_attacker_ip', lang)}>
                    <input type="text" placeholder={t('filter_placeholder_search', lang)} className="w-full h-full px-2 bg-transparent outline-none text-xs text-ark-text placeholder-ark-subtext/50" />
                </FilterGroup>
                <FilterGroup label={t('filter_location', lang)}>
                    <input type="text" placeholder={t('filter_placeholder_search', lang)} className="w-full h-full px-2 bg-transparent outline-none text-xs text-ark-text placeholder-ark-subtext/50" />
                </FilterGroup>
                <FilterGroup label={t('filter_threat_tags', lang)}>
                    <input type="text" placeholder={t('filter_placeholder_tags', lang)} className="w-full h-full px-2 bg-transparent outline-none text-xs text-ark-text placeholder-ark-subtext/50" />
                </FilterGroup>
                <FilterGroup label={t('filter_honeypot_scenario', lang)}>
                    <select className="w-full h-full px-2 bg-transparent outline-none text-xs text-ark-text appearance-none">
                        <option>{t('filter_all', lang)}(7501)</option>
                    </select>
                     <ChevronDown size={12} className="absolute right-2 text-ark-subtext pointer-events-none" />
                </FilterGroup>
                <div className="flex gap-2">
                    <FilterGroup className="flex-1" label={t('filter_honeypot_type', lang)}>
                        <select className="w-full h-full px-2 bg-transparent outline-none text-xs text-ark-text appearance-none">
                            <option>{t('filter_all', lang)}</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 text-ark-subtext pointer-events-none" />
                    </FilterGroup>
                    <button className="flex items-center justify-center px-3 h-[32px] border border-ark-border hover:border-ark-primary hover:text-ark-primary transition-colors text-xs text-ark-subtext bg-ark-bg/30 min-w-fit">
                        <X size={14} className="mr-1" />
                    </button>
                </div>
            </div>

            <div 
                className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isFiltersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
                <div className="overflow-hidden">
                    <div className={`space-y-3 border-t border-ark-border/50 pt-3 mt-2 transition-all duration-500 transform ${isFiltersOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                        <div className="text-xs text-ark-subtext font-mono">{t('filter_advanced', lang)}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <FilterGroup label={t('filter_attack_log', lang)}>
                                <input type="text" placeholder={t('filter_placeholder_search', lang)} className="w-full h-full px-2 bg-transparent outline-none text-xs text-ark-text placeholder-ark-subtext/50" />
                            </FilterGroup>
                            <FilterGroup label={t('filter_behavior_type', lang)}>
                                <select className="w-full h-full px-2 bg-transparent outline-none text-xs text-ark-text appearance-none">
                                    <option>{t('filter_all', lang)}</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-2 text-ark-subtext pointer-events-none" />
                            </FilterGroup>
                            <FilterGroup label={t('filter_behavior_level', lang)}>
                                <select className="w-full h-full px-2 bg-transparent outline-none text-xs text-ark-text appearance-none">
                                    <option>{t('filter_all', lang)}</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-2 text-ark-subtext pointer-events-none" />
                            </FilterGroup>
                            <FilterGroup label={t('filter_login_status', lang)}>
                                <div className="flex h-full w-full divide-x divide-ark-border">
                                    <button className="flex-1 hover:bg-ark-active/10 transition-colors text-xs text-ark-subtext">{t('status_success', lang)}</button>
                                    <button className="flex-1 hover:bg-ark-active/10 transition-colors text-xs text-ark-subtext">{t('status_failure', lang)}</button>
                                </div>
                            </FilterGroup>
                        </div>
                    </div>
                </div>
            </div>
         </div>
         <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10">
             <button 
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="bg-ark-panel border border-ark-border border-t-0 rounded-b-xl px-12 py-0.5 cursor-pointer shadow-sm hover:border-ark-primary hover:text-ark-primary transition-all duration-300 flex items-center justify-center group/btn active:scale-95"
             >
                <ChevronDown size={14} className={`text-ark-subtext transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isFiltersOpen ? 'rotate-180' : ''} group-hover/btn:text-ark-primary`} />
             </button>
         </div>
      </div>

      {/* List Header Controls */}
      <div className="flex flex-wrap justify-end items-center gap-4 mt-2 text-sm text-ark-subtext">
          <span className="font-mono">{t('display_order', lang)}</span>
          <div className="flex border border-ark-border rounded-sm overflow-hidden">
             <button className="px-3 py-1 bg-ark-text text-ark-bg font-bold">{t('sort_time', lang)}</button>
             <button className="px-3 py-1 bg-ark-panel hover:bg-ark-active transition-colors">{t('sort_count', lang)}</button>
          </div>
          <button className="flex items-center gap-1 hover:text-ark-primary transition-colors">
              <RefreshCw size={14} /> {t('refresh', lang)}
          </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 flex flex-col min-h-[400px] border border-ark-border dark:border-gray-800 bg-ark-panel overflow-hidden relative shadow-sm">
         <div className="flex-1 overflow-auto custom-scrollbar">
             
             {/* Mobile View */}
             <div className="md:hidden">
                 {displayLogs.map((log) => {
                     const isExpanded = expandedLogId === log.id;
                     return (
                         <div key={log.id} className="border-b border-ark-border dark:border-gray-800 p-4 transition-colors hover:bg-ark-active/5">
                             <div className="flex justify-between items-start mb-2" onClick={() => toggleExpand(log.id)}>
                                 <div className="flex items-center gap-2">
                                     <span className="font-bold text-ark-text">{log.sourceIp}</span>
                                     <span className="text-[10px] bg-ark-subtext/10 px-1 text-ark-subtext border border-ark-border rounded-sm">{log.country}</span>
                                 </div>
                                 <span className="text-xs font-mono text-ark-subtext">{log.timestamp.split(' ')[1]}</span>
                             </div>
                             <div className="grid grid-cols-2 gap-2 text-xs text-ark-subtext mb-2" onClick={() => toggleExpand(log.id)}>
                                 <div className="flex items-center gap-1.5 truncate">
                                     <Server size={12} />
                                     <span>{log.port} ({log.method})</span>
                                 </div>
                                 <div className="flex items-center gap-1.5 truncate">
                                     <Activity size={12} />
                                     <span>{log.payload}</span>
                                 </div>
                             </div>
                             <div className="flex justify-between items-center mt-3">
                                 <button onClick={() => toggleExpand(log.id)} className="text-xs text-ark-primary flex items-center gap-1 font-mono">
                                     {isExpanded ? <MinusSquare size={12} /> : <PlusSquare size={12} />} 
                                     {t('label_details', lang)}
                                 </button>
                                 <button onClick={() => handleDownload(log)} className="p-1.5 text-ark-subtext hover:text-ark-primary bg-ark-active/10 rounded-sm">
                                     <Download size={14} />
                                 </button>
                             </div>
                             {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-ark-border/30 animate-in slide-in-from-top-2 duration-200">
                                    <div className="font-mono text-xs space-y-2 text-ark-subtext bg-black/20 p-3 rounded-sm">
                                        <div className="flex flex-col gap-1">
                                            <span className="opacity-50">{t('al_full_time', lang)}</span>
                                            <span className="text-ark-text">{log.timestamp}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="opacity-50">{t('col_payload', lang)}:</span>
                                            <span className="text-ark-danger break-all">{log.payload}</span>
                                        </div>
                                    </div>
                                </div>
                             )}
                         </div>
                     );
                 })}
             </div>

             {/* Desktop View */}
             <div className="hidden md:block min-w-[1000px]">
                 <div className="sticky top-0 z-20 bg-ark-panel border-b border-ark-border dark:border-gray-800">
                     <div className={`${gridClass} p-3 text-xs font-mono text-ark-subtext font-bold uppercase tracking-wider bg-ark-active/10 backdrop-blur-sm`}>
                        <div className="pl-2">{t('header_time', lang)}</div>
                        <div>{t('header_attacker_ip', lang)}</div>
                        <div>{t('header_victim_node', lang)}</div>
                        <div>{t('header_connected_port', lang)}</div>
                        <div>{t('header_attack_behavior', lang)}</div>
                        <div className="text-center">{t('header_action', lang)}</div>
                     </div>
                 </div>

                 <div className="divide-y divide-ark-border/50 dark:divide-gray-800">
                     {displayLogs.map((log) => {
                         const isExpanded = expandedLogId === log.id;
                         return (
                            <div key={log.id} className="transition-colors bg-ark-panel hover:bg-ark-active/5 group">
                                <div className={`${gridClass} p-3 text-sm cursor-pointer`} onClick={() => toggleExpand(log.id)}>
                                    <div className="font-mono text-ark-subtext text-xs whitespace-nowrap flex items-center gap-2 pl-2">
                                        <div className={`text-ark-subtext transition-colors ${isExpanded ? 'text-ark-primary' : ''}`}>
                                            {isExpanded ? <MinusSquare size={14} /> : <PlusSquare size={14} />}
                                        </div>
                                        {log.timestamp}
                                    </div>
                                    <div className="font-bold text-ark-text">
                                        <div className="flex items-center gap-2">
                                            <span className="hover:text-ark-primary hover:underline">{log.sourceIp}</span>
                                            <span className="text-[10px] bg-ark-subtext/10 px-1 text-ark-subtext border border-ark-border">{log.country}</span>
                                        </div>
                                    </div>
                                    <div className="text-ark-subtext truncate" title={log.victimNode}>{log.victimNode}</div>
                                    <div className="font-mono text-ark-text">{log.port} <span className="text-ark-subtext text-xs">({log.method})</span></div>
                                    <div className="text-ark-subtext truncate pr-4 font-mono text-xs" title={log.payload}>{log.payload}</div>
                                    <div className="flex justify-center">
                                        <button onClick={(e) => { e.stopPropagation(); handleDownload(log); }} className="p-1.5 text-ark-subtext hover:text-ark-primary hover:bg-ark-active/20 rounded-sm transition-colors" title={t('btn_download_pcap', lang)}>
                                            <Download size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                    <div className="overflow-hidden">
                                        <div className={`bg-ark-active/5 border-t border-ark-border dark:border-gray-800 p-4 transition-opacity duration-300 delay-100 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                                            <div className="flex items-center justify-between mb-3 border-b border-ark-border dark:border-gray-800 pb-2">
                                                <span className="font-bold text-ark-text text-sm flex items-center gap-2">
                                                    <Eye size={14} className="text-ark-primary" /> {t('label_details', lang)}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <ArkButton size="sm" variant="ghost" className="h-6 text-[10px] px-2">
                                                        <ArrowRight size={10} className="mr-1" /> {t('btn_analyze', lang)}
                                                    </ArkButton>
                                                    <ArkButton size="sm" variant="ghost" className="h-6 text-[10px] px-2">
                                                        <Copy size={10} className="mr-1" /> {t('label_copy', lang)}
                                                    </ArkButton>
                                                </div>
                                            </div>
                                            <div className="font-mono text-xs space-y-2 text-ark-subtext">
                                                <div className="grid grid-cols-[100px_1fr]"><span>{t('col_timestamp', lang)}:</span><span className="text-ark-text">{log.timestamp}</span></div>
                                                <div className="grid grid-cols-[100px_1fr]"><span>{t('col_payload', lang)}:</span><span className="text-ark-danger break-all">{log.payload}</span></div>
                                                <div className="grid grid-cols-[100px_1fr]"><span>{t('label_raw_data', lang)}</span><span className="text-ark-subtext opacity-70 break-all">0000 45 00 00 3c 1c 46 40 00 40 06 b1 e6 c0 a8 00 08 ...</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                         );
                     })}
                 </div>
                 
                 {/* Table Footer Indicator to ensure clean ending */}
                 <div className="p-2 border-t border-ark-border/50 dark:border-gray-800 text-center">
                     <span className="text-[10px] text-ark-subtext opacity-30 font-mono tracking-widest uppercase">{t('al_end_logs', lang)}</span>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};
