
import React, { useState, useEffect } from 'react';
import { ArkCard, ArkHexagon, ArkLoading } from './ArknightsUI';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DASHBOARD_TREND_DATA } from '../constants';
import { Globe, User, Server, Camera, Database, LayoutTemplate, Activity, Cpu, HardDrive, Wifi, ArrowUp, ArrowDown, Zap, Monitor, Shield, ShieldCheck, Filter, ShieldAlert } from 'lucide-react';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { useNavigate } from 'react-router-dom';
import { ImageWorldMap } from './WorldMap';

// --- Sub-components ---

const StatBlock: React.FC<{ label: string, value: number, total: number, color: string, icon: React.ElementType }> = ({ label, value, total, color, icon: Icon }) => {
    return (
        <div className="flex items-center gap-4 px-6 py-4 flex-1 transition-all relative overflow-hidden group hover:bg-ark-active/5">
            {/* Icon Box */}
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-ark-active/10 border border-ark-border relative clip-corner-br group-hover:border-[rgba(35,173,229,0.5)] transition-colors" style={{ borderColor: color ? color : undefined }}>
                <Icon size={24} style={{ color }} />
                <div className="absolute top-0 right-0 w-1 h-1 bg-current opacity-50" style={{ color }} />
                <div className="absolute bottom-0 left-0 w-1 h-1 bg-current opacity-50" style={{ color }} />
            </div>

            {/* Text Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold font-mono text-ark-text leading-none">{value}</span>
                    <span className="text-xs font-mono text-ark-subtext">/ {total}</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-ark-subtext font-bold truncate group-hover:text-ark-text transition-colors">{label}</div>
                {/* Progress Line */}
                <div className="h-[2px] w-full bg-ark-border mt-2 relative overflow-hidden">
                     <div className="absolute inset-y-0 left-0 transition-all duration-1000 group-hover:opacity-100" style={{ width: `${total > 0 ? (value/total)*100 : 0}%`, backgroundColor: color }} />
                </div>
            </div>
        </div>
    );
};

const AttackChain: React.FC<{ lang: string, stats: any }> = ({ lang, stats }) => {
    const navigate = useNavigate();
    const { modules } = useApp();

    const getColor = (isActive: boolean, activeColor: string) => {
        return isActive ? activeColor : 'var(--ark-subtext)';
    };

    return (
        <div className="flex flex-col xl:flex-row items-center justify-center gap-6 py-4 w-full px-4 md:px-8">
             <div className="flex-shrink-0">
                 <ArkHexagon 
                    label={t('chain_attack_ip', lang as any)} 
                    value={stats?.totalSources?.toString() || "0"} 
                    size="lg" 
                    icon={<Globe size={24} />} 
                    color={getColor(modules.attackSource, 'var(--ark-primary)')}
                    onClick={() => navigate('/threat-entities/sources')}
                    className={!modules.attackSource ? 'opacity-70 grayscale' : ''}
                 />
             </div>
             
             {/* Divider Line: Hidden on tablet/mobile, visible on XL screens */}
             <div className="hidden xl:block h-[1px] flex-1 bg-gradient-to-r from-transparent via-ark-primary/50 to-transparent mx-4" />
             
             <div className="flex gap-3 flex-wrap justify-center">
                 <ArkHexagon 
                    label={t('chain_scanning', lang as any)} 
                    value={stats?.totalScans?.toString() || "0"} 
                    size="md" 
                    color={getColor(modules.scanning, '#eab308')}
                    onClick={() => navigate('/threat-perception/scanning')}
                    className={!modules.scanning ? 'opacity-70 grayscale' : ''}
                 />
                 <ArkHexagon 
                    label={t('chain_attack', lang as any)} 
                    value={stats?.totalAttacks?.toString() || "0"} 
                    size="md" 
                    color={getColor(modules.attack, '#f97316')}
                    onClick={() => navigate('/threat-perception/list')}
                    className={!modules.attack ? 'opacity-70 grayscale' : ''}
                 />
                 <ArkHexagon 
                    label={t('chain_info_stealing', lang as any)} 
                    value={stats?.totalCredentials?.toString() || "0"} 
                    size="md" 
                    color={getColor(modules.infoStealing, '#ef4444')}
                    onClick={() => navigate('/threat-entities/accounts')}
                    className={!modules.infoStealing ? 'opacity-70 grayscale' : ''}
                 />
                 <ArkHexagon 
                    label={t('chain_payload', lang as any)} 
                    value="0" 
                    size="md" 
                    color={getColor(modules.payload, '#a855f7')}
                    onClick={() => navigate('/threat-perception/samples')}
                    className={!modules.payload ? 'opacity-70 grayscale' : ''}
                 />
                 <ArkHexagon 
                    label={t('chain_persistence', lang as any)} 
                    value="0" 
                    size="md" 
                    color={getColor(modules.persistence, '#ec4899')}
                    onClick={() => navigate('/threat-perception/compromise')}
                    className={!modules.persistence ? 'opacity-70 grayscale' : ''}
                 />
             </div>
        </div>
    );
};

const HackerProfileCard: React.FC<{ profile: any, lang: string }> = ({ profile, lang }) => {
    const tags = typeof profile.tags === 'string' ? profile.tags.split(',') : (profile.tags || []);
    return (
        <div className="flex items-center gap-3 p-3 border-b border-ark-border hover:bg-ark-active/20 transition-colors last:border-0 group cursor-pointer text-xs">
            <div className="w-8 h-8 bg-ark-subtext/10 rounded-sm flex items-center justify-center flex-shrink-0 border border-ark-border group-hover:border-ark-primary transition-colors">
                <User size={14} className="text-ark-subtext group-hover:text-ark-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-ark-text group-hover:text-ark-primary transition-colors">{profile.ip}</span>
                    <span className="text-[9px] text-ark-subtext font-mono bg-ark-bg px-1 rounded-sm border border-ark-border">{profile.lastSeen || profile.firstTime}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-ark-subtext truncate">
                         <Globe size={10} />
                         <span>{profile.location || profile.country}</span>
                    </div>
                    <div className="flex gap-1">
                        {tags.slice(0,1).map((tag: string) => (
                             <span key={tag} className="text-[9px] text-ark-danger uppercase font-bold tracking-tight">
                                 {tag === 'multi_capture' ? t('tag_capture', lang as any) : (tag === 'scan' ? t('btn_scan', lang as any) : tag)}
                             </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const HoneypotCard: React.FC<{ stat: any }> = ({ stat }) => {
    const icons = {
        tcp: <Activity size={20} />,
        redis: <Database size={20} />,
        esxi: <Server size={20} />,
        coremail: <LayoutTemplate size={20} />,
        elastic: <Activity size={20} />,
        camera: <Camera size={20} />,
        ssh: <Server size={20} />,
        http: <Globe size={20} />,
        mysql: <Database size={20} />
    };

    return (
        <div className="bg-ark-bg/50 border border-ark-border p-3 flex flex-col items-center justify-center text-center hover:bg-ark-active/10 hover:border-ark-primary transition-all cursor-pointer group rounded-sm">
            <div className="text-ark-subtext group-hover:text-ark-primary transition-colors mb-2 group-hover:scale-110 duration-300">
                {icons[stat.type?.toLowerCase() as keyof typeof icons] || <Shield size={20} />}
            </div>
            <span className="text-[10px] text-ark-subtext font-mono uppercase mb-1 tracking-wider">{stat.name}</span>
            <span className="text-xl font-bold text-ark-text font-mono leading-none">{stat.count}</span>
        </div>
    );
};

// --- Active Defense Widget ---
const ActiveDefenseWidget: React.FC<{ stats: any }> = ({ stats }) => {
    const { lang } = useApp();
    const navigate = useNavigate();

    return (
        <ArkCard 
            title={t('ad_title', lang)} 
            className="flex-shrink-0 border-ark-primary/30"
            contentClassName="flex flex-col gap-2 p-3"
            sub="SYS.DEFENSE.MATRIX"
        >
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => navigate('/active-defense/level')}
                    className="flex items-center justify-between p-2 bg-ark-bg/50 border border-ark-border hover:border-ark-primary/50 hover:bg-ark-active/10 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-sm bg-ark-active/20 text-green-500 group-hover:text-white group-hover:bg-green-500 transition-colors">
                            <Activity size={14} />
                        </div>
                        <span className="text-xs font-bold text-ark-subtext group-hover:text-ark-text uppercase">{t('ad_level_title', lang)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-green-500 font-bold">STANDARD</span>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    </div>
                </button>

                <button 
                    onClick={() => navigate('/active-defense/access')}
                    className="flex items-center justify-between p-2 bg-ark-bg/50 border border-ark-border hover:border-ark-primary/50 hover:bg-ark-active/10 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-sm bg-ark-active/20 text-ark-primary group-hover:text-white group-hover:bg-ark-primary transition-colors">
                            <ShieldCheck size={14} />
                        </div>
                        <span className="text-xs font-bold text-ark-subtext group-hover:text-ark-text uppercase">{t('ad_access_title', lang)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-ark-primary">{stats?.totalAccessRules || 0} RULES</span>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    </div>
                </button>

                <button 
                    onClick={() => navigate('/active-defense/auto')}
                    className="flex items-center justify-between p-2 bg-ark-bg/50 border border-ark-border hover:border-ark-primary/50 hover:bg-ark-active/10 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-sm bg-ark-active/20 text-orange-500 group-hover:text-white group-hover:bg-orange-500 transition-colors">
                            <Zap size={14} />
                        </div>
                        <span className="text-xs font-bold text-ark-subtext group-hover:text-ark-text uppercase">{t('ad_auto_title', lang)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-orange-500">{stats?.activeDefenseStrategies || 0} ACTIVE</span>
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                    </div>
                </button>

                <button 
                    onClick={() => navigate('/active-defense/filter')}
                    className="flex items-center justify-between p-2 bg-ark-bg/50 border border-ark-border hover:border-ark-primary/50 hover:bg-ark-active/10 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-sm bg-ark-active/20 text-blue-400 group-hover:text-white group-hover:bg-blue-400 transition-colors">
                            <Filter size={14} />
                        </div>
                        <span className="text-xs font-bold text-ark-subtext group-hover:text-ark-text uppercase">{t('ad_filter_title', lang)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-blue-400">{stats?.totalTrafficHits || 0} HITS</span>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    </div>
                </button>
            </div>
        </ArkCard>
    );
};

// --- System Monitor Components ---

const MonitorChart: React.FC<{
    label: string;
    icon: React.ElementType;
    value?: string | number;
    unit?: string;
    customValue?: React.ReactNode;
    data: any[];
    lines: { key: string; color: string }[];
    height?: number;
    sub?: string;
}> = ({ label, icon: Icon, value, unit, customValue, data, lines, height = 50, sub }) => {
    return (
        <div className="bg-ark-bg border border-ark-border p-3 relative group overflow-hidden transition-colors hover:border-[rgba(35,173,229,0.5)] flex flex-col">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="flex items-center gap-1.5 text-ark-subtext mb-0.5">
                        <Icon size={12} className="text-ark-primary" />
                        <span className="font-mono text-[10px] font-bold tracking-wider text-ark-text uppercase">{label}</span>
                    </div>
                    {sub && <span className="text-[9px] font-mono text-ark-subtext/60 tracking-tight uppercase pl-4 block">{sub}</span>}
                </div>
                
                {customValue ? (
                    customValue
                ) : (
                    <div className="font-mono leading-none flex items-baseline gap-0.5">
                        <span className="text-lg font-bold text-ark-text">{value}</span>
                        <span className="text-[9px] text-ark-subtext">{unit}</span>
                    </div>
                )}
            </div>
            
            <div style={{ height: height }} className="w-full relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                 <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={data}>
                        {lines.map((line, idx) => (
                             <Line 
                                key={idx}
                                type="monotone"
                                dataKey={line.key} 
                                stroke={line.color} 
                                strokeWidth={2} 
                                dot={false}
                                isAnimationActive={false}
                             />
                        ))}
                    </LineChart>
                 </ResponsiveContainer>
            </div>
        </div>
    );
};

const SystemMonitor: React.FC = () => {
    const { lang, authFetch } = useApp();
    const navigate = useNavigate();
    const [nodes, setNodes] = useState<any[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [history, setHistory] = useState(() => Array(20).fill(0).map((_, i) => ({ 
        time: i, 
        cpu: 0, 
        mem: 0,
        up: 0,
        down: 0
    })));

    const [current, setCurrent] = useState({ cpu: 0, mem: 0, memTotal: 0, up: 0, down: 0, temp: 42, uptime: '0d 00h 00m', name: '---', status: 'offline' });

    useEffect(() => {
        const handleNodeUpdate = (e: any) => {
            const node = e.detail;
            
            // Update nodes list for the selector
            setNodes(prev => {
                const exists = prev.find(n => n.id === node.id);
                if (!exists) return [...prev, node];
                return prev.map(n => n.id === node.id ? node : n);
            });

            // If no node is selected, lock onto the first one that reports
            if (!selectedNodeId) {
                setSelectedNodeId(node.id);
            }

            // Only update display if it's the selected node
            if (selectedNodeId === node.id || (!selectedNodeId && nodes.length === 0)) {
                setCurrent(prev => ({
                    ...prev,
                    cpu: node.load,
                    mem: node.memoryUsage,
                    memTotal: node.memoryTotal,
                    temp: node.temperature || prev.temp,
                    up: node.netUp,
                    down: node.netDown,
                    uptime: node.uptime,
                    name: node.name,
                    status: node.status
                }));

                setHistory(prev => {
                    const last = prev[prev.length - 1];
                    return [...prev.slice(1), {
                        time: last.time + 1,
                        cpu: node.load,
                        mem: node.memoryUsage,
                        up: node.netUp,
                        down: node.netDown
                    }];
                });
            }
        };

        window.addEventListener('PRTS_NODE_UPDATE', handleNodeUpdate);
        return () => window.removeEventListener('PRTS_NODE_UPDATE', handleNodeUpdate);
    }, [selectedNodeId, nodes.length]);

    useEffect(() => {
        const fetchInitialNodes = async () => {
            try {
                const response = await authFetch('/api/v1/nodes');
                if (response.ok) {
                    const data = await response.json();
                    setNodes(data);
                    if (data.length > 0 && !selectedNodeId) {
                        // Prefer online nodes for initial selection
                        const onlineNode = data.find((n: any) => n.status === 'online');
                        const initialNode = onlineNode || data[0];
                        setSelectedNodeId(initialNode.id);
                        setCurrent({
                            cpu: initialNode.load,
                            mem: initialNode.memoryUsage,
                            memTotal: initialNode.memoryTotal,
                            temp: initialNode.temperature || 42,
                            up: initialNode.netUp,
                            down: initialNode.netDown,
                            uptime: initialNode.uptime,
                            name: initialNode.name,
                            status: initialNode.status
                        });
                    }
                }
            } catch (e) {}
        };
        fetchInitialNodes();
    }, [authFetch]);

    return (
        <ArkCard 
            title={
                <div className="flex items-center justify-between w-full pr-2">
                    <span>{t('system_monitor', lang)}</span>
                    {nodes.length > 1 && (
                        <select 
                            className="bg-ark-bg/80 border border-ark-border text-[10px] font-mono px-1 py-0.5 outline-none text-ark-primary"
                            value={selectedNodeId || ''}
                            onChange={(e) => {
                                const newId = e.target.value;
                                setSelectedNodeId(newId);
                                // Update current display immediately with the selected node's data
                                const selectedNode = nodes.find(n => n.id === newId);
                                if (selectedNode) {
                                    setCurrent({
                                        cpu: selectedNode.load,
                                        mem: selectedNode.memoryUsage,
                                        memTotal: selectedNode.memoryTotal,
                                        temp: selectedNode.temperature || 42,
                                        up: selectedNode.netUp,
                                        down: selectedNode.netDown,
                                        uptime: selectedNode.uptime,
                                        name: selectedNode.name,
                                        status: selectedNode.status
                                    });
                                }
                                // Reset history when switching nodes to avoid graph jumps
                                setHistory(Array(20).fill(0).map((_, i) => ({ time: i, cpu: 0, mem: 0, up: 0, down: 0 })));
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {nodes.map(n => (
                                <option key={n.id} value={n.id}>{n.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            }
            className="flex-shrink-0"
            contentClassName="flex flex-col gap-3 pt-2"
            sub={current.name.toUpperCase()}
            onClick={() => navigate('/env-management/nodes')}
        >
            <div className="grid grid-cols-2 gap-3">
                <MonitorChart 
                    label={t('cpu_load', lang)} 
                    sub={`${current.temp.toFixed(1)}°C`}
                    icon={Cpu} 
                    value={current.cpu.toFixed(0)} 
                    unit="%" 
                    data={history}
                    lines={[{ key: 'cpu', color: 'var(--ark-primary)' }]}
                />
                
                <MonitorChart 
                    label={t('mem_usage', lang)} 
                    sub={current.memTotal > 0 ? `${(current.memTotal / 1024).toFixed(1)} GB` : "---"}
                    icon={HardDrive} 
                    value={current.mem.toFixed(0)} 
                    unit="%" 
                    data={history}
                    lines={[{ key: 'mem', color: '#22c55e' }]}
                />
            </div>

            <MonitorChart 
                label={t('net_io', lang)} 
                sub={t('eth_interface', lang)}
                icon={Activity} 
                customValue={
                    <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-1 leading-none mb-1 text-[#f97316]">
                            <ArrowUp size={10} strokeWidth={3} />
                            <span className="text-lg font-bold">{current.up.toFixed(2)}</span>
                            <span className="text-[9px] opacity-70">MB/s</span>
                        </div>
                        <div className="flex items-baseline gap-1 leading-none text-[#3b82f6]">
                            <ArrowDown size={10} strokeWidth={3} />
                            <span className="text-lg font-bold">{current.down.toFixed(2)}</span>
                            <span className="text-[9px] opacity-70">MB/s</span>
                        </div>
                    </div>
                }
                data={history}
                lines={[
                    { key: 'up', color: '#f97316' },
                    { key: 'down', color: '#3b82f6' }
                ]}
                height={60}
            />
            
            {/* Status Footer */}
            <div className="flex justify-between items-center text-[9px] font-mono text-ark-subtext bg-ark-active/10 px-2 py-1 border border-ark-border">
                <span className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                        current.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}/> 
                    {t(current.status === 'online' ? 'status_online' : 'status_offline', lang)}
                </span>
                <span>{t('uptime', lang)}: {current.uptime.toUpperCase()}</span>
            </div>
        </ArkCard>
    );
};

// --- Main Dashboard Component ---

export const Dashboard: React.FC = () => {
  const { lang, darkMode, authFetch } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authFetch('/api/v1/stats/dashboard');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [authFetch]);
  
  const gridColor = darkMode ? '#333' : '#e5e5e5';

  if (loading && !stats) {
    return <ArkLoading label="INITIALIZING_DASHBOARD_CORE" />;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 xl:h-full h-auto">
      
      {/* LEFT & CENTER COLUMN */}
      <div className="xl:col-span-3 flex flex-col gap-4 min-w-0">
        
        {/* ROW 1: Status & Chain */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ArkCard title={t('node_status', lang)} contentClassName="flex flex-col sm:flex-row items-center justify-between p-0" noPadding>
                 <div className="flex-1 w-full border-b sm:border-b-0 sm:border-r border-ark-border">
                    <StatBlock 
                        label={t('online_nodes', lang)} 
                        value={stats?.activeNodes || 0} 
                        total={stats?.totalNodes || 0} 
                        color="#22c55e" 
                        icon={Server}
                    />
                 </div>
                 <div className="flex-1 w-full">
                    <StatBlock 
                        label={t('online_honeypots', lang)} 
                        value={stats?.activeServices || 0} 
                        total={stats?.totalServices || 0} 
                        color="#3b82f6" 
                        icon={Shield}
                    />
                 </div>
            </ArkCard>
            <ArkCard title={t('attack_chain', lang)} className="lg:col-span-2">
                 <AttackChain lang={lang} stats={stats} />
            </ArkCard>
        </div>

        {/* ROW 2: Trend Chart */}
        <ArkCard title={t('attack_trend', lang)} className="flex-1 min-h-[300px]">
             <div className="w-full h-full min-w-0 relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={stats?.trendData || DASHBOARD_TREND_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorEsxi" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis dataKey="name" stroke="var(--ark-subtext)" tick={{fontFamily: 'monospace', fontSize: 10}} axisLine={false} tickLine={false} dy={10} />
                        <YAxis stroke="var(--ark-subtext)" tick={{fontFamily: 'monospace', fontSize: 10}} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--ark-panel)', borderColor: 'var(--ark-primary)', color: 'var(--ark-text)', borderRadius: 0 }}
                            itemStyle={{ fontFamily: 'monospace', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="coremail" stackId="1" stroke="#f97316" fill="url(#colorCore)" strokeWidth={2} />
                        <Area type="monotone" dataKey="esxi" stackId="1" stroke="#eab308" fill="url(#colorEsxi)" strokeWidth={2} />
                        <Area type="monotone" dataKey="elastic" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
        </ArkCard>

        {/* ROW 3: Map & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:h-[300px] h-auto">
             <ArkCard title={t('attack_source_dist', lang)} className="flex flex-col p-0 h-[400px] lg:h-auto" contentClassName="p-0 flex flex-col h-full" noPadding>
                 <div className="flex-1 relative border-b border-ark-border">
                    <ImageWorldMap onClick={() => navigate('/threat-perception/list')} className="w-full h-full absolute inset-0" />
                 </div>
                 <div className="h-24 overflow-y-auto custom-scrollbar bg-ark-bg/20">
                     {(stats?.topSources || []).map((src: any) => (
                         <div key={src.ip} className="flex justify-between items-center px-4 py-1.5 border-b border-ark-border last:border-0 text-xs font-mono hover:bg-ark-active/10">
                             <div className="flex items-center gap-2">
                                 <span className="w-5 text-center text-ark-subtext font-bold">{src.loc}</span>
                                 <span className="text-ark-text">{src.ip}</span>
                             </div>
                             <span className="text-ark-primary font-bold">{src.count}</span>
                         </div>
                     ))}
                 </div>
             </ArkCard>

             <ArkCard title={t('honeypot_attack_count', lang)} className="h-[300px] lg:h-auto" contentClassName="overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                     {(stats?.honeypotStats || []).map((stat: any) => (
                         <HoneypotCard key={stat.id} stat={stat} />
                     ))}
                 </div>
             </ArkCard>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="xl:col-span-1 flex flex-col gap-4 min-w-0">
          <SystemMonitor />
          
          <ActiveDefenseWidget stats={stats} />

          <ArkCard 
            title={t('hacker_profile', lang)} 
            className="flex-1 min-h-0" 
            contentClassName="flex flex-col p-0"
            noPadding
          >
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {(stats?.hackerProfiles || []).map((profile: any) => (
                      <HackerProfileCard key={profile.id} profile={profile} lang={lang} />
                  ))}
              </div>
              <div className="p-2 bg-ark-active/5 border-t border-ark-border text-center text-[10px] font-mono text-ark-subtext cursor-pointer hover:text-ark-primary hover:bg-ark-active/20 transition-colors">
                  {t('view_full_db', lang)}
              </div>
          </ArkCard>
      </div>

    </div>
  );
};
