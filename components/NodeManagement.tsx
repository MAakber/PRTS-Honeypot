
import React, { useState, useEffect } from 'react';
import { ArkButton, ArkLoading } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { Server, Skull, Monitor, AlertCircle, FileText, Plus, Search, RefreshCw, X, ChevronRight, Share2, Grid, List, MoreHorizontal, Pause, Play, Download, Settings, ShieldCheck } from 'lucide-react';
import { NodeStatus, Lang } from '../types';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useNotification } from './NotificationSystem';

// --- Sub-Components ---

const NodeTrafficSparkline: React.FC<{ data: any }> = ({ data }) => {
    let plotData: number[] = [];
    if (Array.isArray(data)) {
        plotData = data;
    } else if (typeof data === 'string') {
        try {
            plotData = JSON.parse(data);
        } catch (e) {
            plotData = [];
        }
    }
    
    const chartData = (Array.isArray(plotData) ? plotData : []).map((val, i) => ({ i, val }));
    return (
        <div className="h-8 w-32">
            <LineChart width={128} height={32} data={chartData}>
                <Line 
                    type="monotone" 
                    dataKey="val" 
                    stroke="var(--ark-primary)" 
                    strokeWidth={2} 
                    dot={false} 
                    isAnimationActive={false}
                />
            </LineChart>
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

const OS_ICON_MAP: Record<string, string> = {
    'alpine': 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Alpine_Linux.svg',
    'linux': 'https://upload.wikimedia.org/wikipedia/commons/3/35/Tux.svg',
    'ubuntu': 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo-ubuntu_no_text.svg',
    'debian': 'https://upload.wikimedia.org/wikipedia/commons/6/66/Openlogo-debian.svg',
    'centos': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/CentOS_logo.svg',
    'windows': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Windows_logo_-_2012.svg',
    'mac': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg'
};

const getOSIcon = (os: string) => {
    const lowerOS = os.toLowerCase();
    if (lowerOS.includes('windows')) return OS_ICON_MAP['windows'];
    if (lowerOS.includes('ubuntu')) return OS_ICON_MAP['ubuntu'];
    if (lowerOS.includes('debian')) return OS_ICON_MAP['debian'];
    if (lowerOS.includes('centos')) return OS_ICON_MAP['centos'];
    if (lowerOS.includes('alpine')) return OS_ICON_MAP['alpine'];
    if (lowerOS.includes('darwin') || lowerOS.includes('mac')) return OS_ICON_MAP['mac'];
    return OS_ICON_MAP['linux'];
};

const StatusReport: React.FC<{ lang: Lang, nodes: NodeStatus[] }> = ({ lang, nodes }) => {
    const offlineCount = nodes.filter(n => n.status === 'offline').length;

    return (
        <div className="bg-ark-panel border border-ark-border p-4 mb-4 flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-ark-text whitespace-nowrap">
                <FileText className="text-ark-primary" size={18} />
                {t('nm_report_title', lang)}
            </div>
            <div className="h-8 w-[1px] bg-ark-border hidden md:block" />
            <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-ark-subtext">{t('nm_report_status', lang)}</span>
                    {offlineCount > 0 ? (
                        <span className="text-red-500 flex items-center gap-1 font-bold bg-red-500/10 px-2 py-0.5 rounded-sm border border-red-500/30">
                            <AlertCircle size={14} /> {offlineCount} {t('nm_btn_offline', lang)}
                        </span>
                    ) : (
                        <span className="text-green-500 flex items-center gap-1 font-bold bg-green-500/10 px-2 py-0.5 rounded-sm border border-green-500/30">
                            <ShieldCheck size={14} /> {t('status_normal', lang)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// Flow Diagram (Mini)
const ArchitectureDiagram: React.FC<{ lang: Lang }> = ({ lang }) => (
    <div className="hidden 2xl:flex items-center gap-4 text-xs font-mono text-ark-subtext select-none opacity-80 scale-90 origin-right mr-4 self-center">
         <div className="flex flex-col items-center gap-1">
             <Skull size={24} className="text-ark-text" />
             <span>{t('nm_diagram_attacker', lang)}</span>
         </div>
         <div className="flex items-center text-ark-border">
             <span>-----</span>
             <span className="text-[10px]">{t('nm_diagram_try', lang)}</span>
             <span>----{'>'}</span>
         </div>
         <div className="flex flex-col gap-2">
             <div className="p-1 border border-ark-primary/50 bg-ark-bg rounded-sm flex items-center gap-1">
                 <Server size={14} className="text-ark-primary" />
                 <span>{t('nm_diagram_node', lang)}</span>
             </div>
             <div className="p-1 border border-ark-primary/50 bg-ark-bg rounded-sm flex items-center gap-1">
                 <Server size={14} className="text-ark-primary" />
                 <span>{t('nm_diagram_node', lang)}</span>
             </div>
         </div>
         <div className="h-16 w-[1px] bg-ark-border mx-2" />
         <div className="flex items-center text-ark-primary">
             <span>-----</span>
             <span>{'>'}</span>
         </div>
         <div className="flex flex-col items-center gap-1">
             <Monitor size={24} className="text-ark-text" />
             <span>{t('nm_diagram_mgt', lang)}</span>
         </div>
    </div>
);


export const NodeManagement: React.FC = () => {
    const { lang } = useApp();
    const { notify } = useNotification();
    const [nodes, setNodes] = useState<NodeStatus[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNodes = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const token = localStorage.getItem('prts_token');
            const response = await fetch('/api/v1/nodes', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setNodes(data);
            }
        } catch (error) {
            console.error("Failed to fetch nodes", error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchNodes();

        const handleNodeUpdate = (e: any) => {
            const updatedNode = e.detail;
            setNodes(prev => {
                // If we are currently loading, we might want to skip this or handle it carefully
                // but usually, we want the latest data.
                const index = prev.findIndex(n => n.id === updatedNode.id);
                if (index === -1) {
                    // If it's a new node not in our list, add it
                    return [updatedNode, ...prev];
                }
                
                // Update existing node
                const newNodes = [...prev];
                newNodes[index] = { ...newNodes[index], ...updatedNode };
                return newNodes;
            });
        };

        window.addEventListener('PRTS_NODE_UPDATE', handleNodeUpdate);
        
        // Auto-refresh every 30s as a fallback
        const interval = setInterval(() => fetchNodes(false), 30000);

        return () => {
            window.removeEventListener('PRTS_NODE_UPDATE', handleNodeUpdate);
            clearInterval(interval);
        };
    }, []);
    
    const sendCommand = async (nodeId: string, command: string) => {
        try {
            const token = localStorage.getItem('prts_token');
            const response = await fetch('/api/v1/nodes/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nodeId, command })
            });
            return response.ok;
        } catch (error) {
            console.error("Failed to send command", error);
            return false;
        }
    };

    const handleStart = async (node: NodeStatus) => {
        const success = await sendCommand(node.id, 'START');
        if (success) {
            notify('success', t('op_success', lang), `${t('op_node_start', lang)} (${node.name})`);
        } else {
            notify('error', t('op_failed', lang), `Failed to send START command to ${node.name}`);
        }
    };

    const handleStop = async (node: NodeStatus) => {
        const success = await sendCommand(node.id, 'STOP');
        if (success) {
            notify('warning', t('op_success', lang), `${t('op_node_stop', lang)} (${node.name})`);
        } else {
            notify('error', t('op_failed', lang), `Failed to send STOP command to ${node.name}`);
        }
    };

    const handleRestart = async (node: NodeStatus) => {
        const success = await sendCommand(node.id, 'RESTART');
        if (success) {
            notify('info', t('op_success', lang), `${t('op_node_restart', lang)} (${node.name})`);
        } else {
            notify('error', t('op_failed', lang), `Failed to send RESTART command to ${node.name}`);
        }
    };

    const handleDelete = (nodeName: string) => {
        notify('error', t('op_success', lang), `${t('op_node_delete', lang)} (${nodeName})`);
    };

    return (
        <div className="flex flex-col gap-4 pb-6 min-h-full">
            {/* Page Header */}
            <div className="bg-ark-panel border border-ark-border shadow-sm relative">
                 <div className="absolute top-0 left-0 w-1 h-full bg-ark-primary" />
                 
                 <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                     <div className="relative z-10 flex-1 w-full max-w-4xl">
                         <div className="flex items-center gap-4 mb-4">
                             <div className="p-2 bg-ark-active/20 rounded-sm text-ark-primary border border-ark-primary/20 shrink-0">
                                 <Grid size={20} className="md:w-6 md:h-6" />
                             </div>
                             <h2 className="text-lg md:text-xl font-bold text-ark-text">{t('nm_title', lang)}</h2>
                         </div>
                         
                         <div className="text-xs text-ark-text/80 font-mono leading-relaxed space-y-2 w-full">
                             <p className="break-words whitespace-normal">{t('nm_desc', lang)}</p>
                         </div>
                     </div>
                     
                     {/* Right Diagram */}
                     <ArchitectureDiagram lang={lang} />
                 </div>
            </div>

            {/* Status Report */}
            <StatusReport lang={lang} nodes={nodes} />

            {/* Main Content Area: Sidebar + Table */}
            <div className="flex flex-col lg:flex-row gap-4 flex-1">
                
                {/* Left Sidebar: Node Groups */}
                <div className="w-full lg:w-64 bg-ark-panel border border-ark-border flex flex-col shadow-sm flex-shrink-0">
                    <div className="p-3 border-b border-ark-border flex items-center justify-between">
                        <span className="text-sm font-bold text-ark-text">{t('nm_group_all', lang)}</span>
                        <span className="text-xs text-ark-subtext">({nodes.length})</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 max-h-[200px] lg:max-h-full">
                         <button className="w-full text-left px-3 py-2 text-xs font-mono text-ark-primary bg-ark-active/20 border-l-2 border-ark-primary hover:bg-ark-active/30 transition-colors">
                             {t('nm_group_all', lang)}
                         </button>
                         {nodes.map(node => (
                             <button key={node.id} className="w-full text-left px-3 py-2 text-xs font-mono text-ark-subtext hover:text-ark-text hover:bg-ark-active/10 border-l-2 border-transparent transition-colors flex items-center gap-2">
                                 <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                                 {node.name}
                             </button>
                         ))}
                    </div>
                    <div className="p-2 border-t border-ark-border">
                        <ArkButton variant="outline" size="sm" className="w-full justify-center">
                            <Plus size={14} className="mr-1" /> {t('nm_create_group', lang)}
                        </ArkButton>
                    </div>
                </div>

                {/* Right Area: Controls & Table */}
                <div className="flex-1 flex flex-col gap-4">
                    {/* Filter Toolbar */}
                    <div className="bg-ark-panel border border-ark-border p-3 shadow-sm">
                        <div className="flex flex-col xl:flex-row gap-3">
                             <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                 <FilterInput placeholder={t('nm_search_placeholder', lang)} />
                                 <FilterInput label={t('nm_filter_status', lang)}>
                                     <FilterSelect options={[t('filter_all', lang), 'Online', 'Offline']} />
                                 </FilterInput>
                                 <FilterInput label={t('nm_filter_template', lang)}>
                                      <FilterSelect options={[t('filter_all', lang)]} />
                                 </FilterInput>
                             </div>
                             <div className="flex gap-2 justify-end">
                                 <ArkButton variant="primary" size="sm" className="bg-ark-text text-ark-bg hover:bg-ark-primary hover:text-white">
                                     <Plus size={14} className="mr-1" /> {t('nm_add', lang)}
                                 </ArkButton>
                                 <ArkButton 
                                    variant="ghost" 
                                    className="h-[32px] w-[32px] p-0 flex items-center justify-center"
                                    onClick={fetchNodes}
                                    title={t('nm_btn_refresh', lang) || 'Refresh'}
                                 >
                                     <RefreshCw size={14} className={loading ? 'animate-spin text-ark-primary' : ''} />
                                 </ArkButton>
                             </div>
                        </div>
                    </div>

                    {/* Node List - Expanded View */}
                    <div className="flex-1 flex flex-col gap-4">
                        {loading ? (
                            <ArkLoading label="FETCHING_NODE_DATA" />
                        ) : nodes.length > 0 ? (
                            nodes.map(node => (
                                <div key={node.id} className="bg-ark-panel border border-ark-border shadow-sm group hover:border-ark-primary/50 transition-all duration-300">
                                    {/* Header / Main Info */}
                                    <div className="p-4 flex flex-col md:flex-row items-center gap-4 md:gap-8 border-b border-gray-700/30 bg-ark-bg/50">
                                        <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
                                            <div className={`w-2 h-12 ${node.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-ark-text flex items-center gap-2">
                                                    {node.name}
                                                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold border rounded-sm ${
                                                        node.status === 'online' ? 'border-green-500/30 text-green-500 bg-green-500/10' : 
                                                        'border-red-500/30 text-red-500 bg-red-500/10'
                                                    }`}>
                                                        {node.status}
                                                    </span>
                                                </h3>
                                                <p className="text-xs text-ark-subtext font-mono mt-0.5 flex items-center gap-3">
                                                    <span>ID: {node.id}</span>
                                                    <span>|</span>
                                                    <span className="flex items-center gap-1">
                                                        <img src={getOSIcon(node.os)} className="w-3 h-3 grayscale opacity-70" alt={node.os} />
                                                        {node.os.toUpperCase()}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Stats Grid - Horizontal */}
                                        <div className="flex flex-wrap gap-6 md:gap-12 items-center justify-start md:justify-end w-full md:w-auto text-xs font-mono text-ark-subtext">
                                            <div>
                                                <span className="block opacity-50 mb-1">{t('nm_label_uptime', lang)}</span>
                                                <span className="text-ark-text font-bold">{node.uptime || '0d 00h 00m'}</span>
                                            </div>
                                            <div>
                                                <span className="block opacity-50 mb-1">{t('nm_label_version', lang)}</span>
                                                <span className="text-ark-text font-bold">{node.version || 'v1.0.0'}</span>
                                            </div>
                                            <div>
                                                <span className="block opacity-50 mb-1">{t('nm_label_load', lang)}</span>
                                                <div className="w-24 h-2 bg-ark-border rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${node.load > 80 ? 'bg-red-500' : node.load > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                                        style={{ width: `${node.load}%` }} 
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="block opacity-50 mb-1">{t('nm_label_mem', lang)}</span>
                                                <div className="w-24 h-2 bg-ark-border rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${node.memoryUsage && node.memoryUsage > 80 ? 'bg-red-500' : node.memoryUsage && node.memoryUsage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                                        style={{ width: `${node.memoryUsage || 0}%` }} 
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="block opacity-50 mb-1">{t('nm_label_net', lang)}</span>
                                                <div className="flex flex-col gap-0.5 text-[10px]">
                                                    <span className="text-orange-500">↑ {node.netUp?.toFixed(2) || '0.00'} MB/s</span>
                                                    <span className="text-blue-500">↓ {node.netDown?.toFixed(2) || '0.00'} MB/s</span>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="block opacity-50 mb-1">{t('nm_filter_traffic', lang)}</span>
                                                <NodeTrafficSparkline data={node.trafficHistory} />
                                            </div>
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="flex items-center gap-2 border-l border-ark-border pl-4 ml-4">
                                             <button className="p-2 hover:bg-ark-active/20 rounded-sm text-ark-subtext hover:text-ark-primary transition-colors" title="Console">
                                                 <List size={16} />
                                             </button>
                                             <button className="p-2 hover:bg-ark-active/20 rounded-sm text-ark-subtext hover:text-ark-primary transition-colors" title="Settings">
                                                 <Settings size={16} />
                                             </button>
                                             <button className="p-2 hover:bg-ark-active/20 rounded-sm text-ark-subtext hover:text-ark-primary transition-colors" title="More">
                                                 <MoreHorizontal size={16} />
                                             </button>
                                        </div>
                                    </div>
                                    
                                    {/* Expanded Details - always visible for demo aesthetics */}
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono text-ark-subtext bg-ark-panel">
                                        <div>
                                            <span className="opacity-50 block mb-1">{t('nm_tbl_interface', lang)}:</span>
                                            <span className="text-ark-text">{node.interface || 'eth0'}</span>
                                        </div>
                                        <div>
                                            <span className="opacity-50 block mb-1">{t('nm_tbl_ip', lang)}:</span>
                                            <span className="text-ark-text">{node.ip}</span>
                                        </div>
                                        <div>
                                            <span className="opacity-50 block mb-1">{t('nm_tbl_mac', lang)}:</span>
                                            <span className="text-ark-text">{node.mac || '00:00:00:00:00:00'}</span>
                                        </div>
                                        <div>
                                            <span className="opacity-50 block mb-1">{t('nm_tbl_temp', lang)}:</span>
                                            <span className="text-ark-text">{node.temperature?.toFixed(1) || '0.0'}°C</span>
                                        </div>
                                        <div>
                                            <span className="opacity-50 block mb-1">{t('nm_tbl_firewall', lang)}:</span>
                                            <span className={`font-bold ${
                                                node.firewallStatus === 'active' ? 'text-green-500' : 
                                                node.firewallStatus === 'error' ? 'text-red-500' : 'text-ark-subtext'
                                            }`}>
                                                {node.firewallStatus ? t(`fw_${node.firewallStatus}`, lang) : t('fw_inactive', lang)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="opacity-50 block mb-1">{t('nm_col_template', lang)}:</span>
                                            <span className="text-ark-primary underline cursor-pointer">{node.template}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Action Bar */}
                                    <div className="bg-ark-active/5 p-2 flex justify-end gap-3 border-t border-ark-border">
                                        <button onClick={() => handleStart(node)} className="flex items-center gap-1 text-xs font-bold text-ark-subtext hover:text-ark-text transition-colors">
                                            <Play size={12} /> {t('nm_btn_start', lang)}
                                        </button>
                                        <button onClick={() => handleStop(node)} className="flex items-center gap-1 text-xs font-bold text-ark-subtext hover:text-ark-text transition-colors">
                                            <Pause size={12} /> {t('nm_btn_stop', lang)}
                                        </button>
                                        <button onClick={() => handleRestart(node)} className="flex items-center gap-1 text-xs font-bold text-ark-subtext hover:text-ark-text transition-colors">
                                            <RefreshCw size={12} /> {t('nm_restart', lang)}
                                        </button>
                                        <div className="w-[1px] h-4 bg-ark-border mx-2" />
                                        <button onClick={() => handleDelete(node.name)} className="flex items-center gap-1 text-xs font-bold text-red-500/70 hover:text-red-500 transition-colors">
                                            <X size={12} /> {t('nm_btn_delete', lang)}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-ark-panel border border-ark-border border-dashed p-20 opacity-50">
                                <Server size={48} className="text-ark-subtext mb-4" />
                                <p className="text-sm font-mono">{t('no_data', lang)}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
