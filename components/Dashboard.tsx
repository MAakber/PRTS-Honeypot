
import React, { useState, useEffect } from 'react';
import { ArkCard, ArkHexagon } from './ArknightsUI';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { MOCK_HACKER_PROFILES, MOCK_HONEYPOT_STATS, DASHBOARD_TREND_DATA } from '../constants';
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
                     <div className="absolute inset-y-0 left-0 transition-all duration-1000 group-hover:opacity-100" style={{ width: `${(value/total)*100}%`, backgroundColor: color }} />
                </div>
            </div>
        </div>
    );
};

const AttackChain: React.FC<{ lang: string }> = ({ lang }) => {
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
                    value="846" 
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
                    value="3094" 
                    size="md" 
                    color={getColor(modules.scanning, '#eab308')}
                    onClick={() => navigate('/threat-perception/scanning')}
                    className={!modules.scanning ? 'opacity-70 grayscale' : ''}
                 />
                 <ArkHexagon 
                    label={t('chain_attack', lang as any)} 
                    value="0" 
                    size="md" 
                    color={getColor(modules.attack, '#f97316')}
                    onClick={() => navigate('/threat-perception/list')}
                    className={!modules.attack ? 'opacity-70 grayscale' : ''}
                 />
                 <ArkHexagon 
                    label={t('chain_info_stealing', lang as any)} 
                    value="0" 
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
                    onClick={() => navigate('/threat-entities/samples')}
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

const HackerProfileCard: React.FC<{ profile: typeof MOCK_HACKER_PROFILES[0], lang: string }> = ({ profile, lang }) => (
    <div className="flex items-center gap-3 p-3 border-b border-ark-border hover:bg-ark-active/20 transition-colors last:border-0 group cursor-pointer text-xs">
        <div className="w-8 h-8 bg-ark-subtext/10 rounded-sm flex items-center justify-center flex-shrink-0 border border-ark-border group-hover:border-ark-primary transition-colors">
            <User size={14} className="text-ark-subtext group-hover:text-ark-primary" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-ark-text group-hover:text-ark-primary transition-colors">{profile.ip}</span>
                <span className="text-[9px] text-ark-subtext font-mono bg-ark-bg px-1 rounded-sm border border-ark-border">{profile.lastSeen}</span>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-ark-subtext truncate">
                     <Globe size={10} />
                     <span>{profile.location}</span>
                </div>
                <div className="flex gap-1">
                    {profile.tags.slice(0,1).map(tag => (
                         <span key={tag} className="text-[9px] text-ark-danger uppercase font-bold tracking-tight">
                             {tag === 'multi_capture' ? t('tag_capture', lang as any) : tag}
                         </span>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const HoneypotCard: React.FC<{ stat: typeof MOCK_HONEYPOT_STATS[0] }> = ({ stat }) => {
    const icons = {
        tcp: <Activity size={20} />,
        redis: <Database size={20} />,
        esxi: <Server size={20} />,
        coremail: <LayoutTemplate size={20} />,
        elastic: <Activity size={20} />,
        camera: <Camera size={20} />
    };

    return (
        <div className="bg-ark-bg/50 border border-ark-border p-3 flex flex-col items-center justify-center text-center hover:bg-ark-active/10 hover:border-ark-primary transition-all cursor-pointer group rounded-sm">
            <div className="text-ark-subtext group-hover:text-ark-primary transition-colors mb-2 group-hover:scale-110 duration-300">
                {icons[stat.type as keyof typeof icons]}
            </div>
            <span className="text-[10px] text-ark-subtext font-mono uppercase mb-1 tracking-wider">{stat.name}</span>
            <span className="text-xl font-bold text-ark-text font-mono leading-none">{stat.count}</span>
        </div>
    );
};

// --- Active Defense Widget ---
const ActiveDefenseWidget: React.FC = () => {
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
                        <span className="text-[10px] font-mono text-ark-primary">128 RULES</span>
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
                        <span className="text-[10px] font-mono text-orange-500">2 ACTIVE</span>
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
                        <span className="text-[10px] font-mono text-blue-400">169 HITS</span>
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
    const { lang } = useApp();
    const navigate = useNavigate();
    const [history, setHistory] = useState(() => Array(20).fill(0).map((_, i) => ({ 
        time: i, 
        cpu: 20 + Math.random() * 10, 
        mem: 40 + Math.random() * 5,
        up: 1 + Math.random() * 2,
        down: 5 + Math.random() * 5
    })));

    const [current, setCurrent] = useState({ cpu: 0, mem: 0, up: 0, down: 0, temp: 42 });

    useEffect(() => {
        const interval = setInterval(() => {
            setHistory(prev => {
                const last = prev[prev.length - 1];
                const nextCpu = Math.min(100, Math.max(5, last.cpu + (Math.random() - 0.5) * 15));
                const nextMem = Math.min(100, Math.max(20, last.mem + (Math.random() - 0.5) * 5));
                const nextUp = Math.max(0, last.up + (Math.random() - 0.5) * 2);
                const nextDown = Math.max(0, last.down + (Math.random() - 0.5) * 3);
                
                setCurrent({ 
                    cpu: nextCpu, 
                    mem: nextMem, 
                    up: nextUp, 
                    down: nextDown, 
                    temp: Math.min(90, Math.max(30, current.temp + (Math.random() - 0.5))) 
                });

                return [...prev.slice(1), { 
                    time: last.time + 1, 
                    cpu: nextCpu, 
                    mem: nextMem, 
                    up: nextUp, 
                    down: nextDown
                }];
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [current.temp]);

    return (
        <ArkCard 
            title={t('system_monitor', lang)} 
            className="flex-shrink-0"
            contentClassName="flex flex-col gap-3 pt-2"
            sub="CORE_V4"
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
                    sub="2048KB"
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
                            <span className="text-lg font-bold">{current.up.toFixed(1)}</span>
                            <span className="text-[9px] opacity-70">MB/s</span>
                        </div>
                        <div className="flex items-baseline gap-1 leading-none text-[#3b82f6]">
                            <ArrowDown size={10} strokeWidth={3} />
                            <span className="text-lg font-bold">{current.down.toFixed(1)}</span>
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
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> {t('status_online', lang)}</span>
                <span>{t('uptime', lang)}: 14D 02H 12M</span>
            </div>
        </ArkCard>
    );
};

// --- Main Dashboard Component ---

export const Dashboard: React.FC = () => {
  const { lang, darkMode } = useApp();
  const navigate = useNavigate();
  
  const gridColor = darkMode ? '#333' : '#e5e5e5';

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
                        value={1} 
                        total={1} 
                        color="#22c55e" 
                        icon={Server}
                    />
                 </div>
                 <div className="flex-1 w-full">
                    <StatBlock 
                        label={t('online_honeypots', lang)} 
                        value={6} 
                        total={6} 
                        color="#3b82f6" 
                        icon={Shield}
                    />
                 </div>
            </ArkCard>
            <ArkCard title={t('attack_chain', lang)} className="lg:col-span-2">
                 <AttackChain lang={lang} />
            </ArkCard>
        </div>

        {/* ROW 2: Trend Chart */}
        <ArkCard title={t('attack_trend', lang)} className="flex-1 min-h-[300px]">
             <div className="w-full h-full min-w-0 relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={DASHBOARD_TREND_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                     {[
                         { ip: '115.231.78.0/24', count: 126, loc: 'CN' },
                         { ip: '87.236.176.0/24', count: 125, loc: 'RU' },
                         { ip: '185.247.137.0/24', count: 110, loc: 'TR' },
                     ].map(src => (
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
                     {MOCK_HONEYPOT_STATS.map(stat => (
                         <HoneypotCard key={stat.id} stat={stat} />
                     ))}
                 </div>
             </ArkCard>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="xl:col-span-1 flex flex-col gap-4 min-w-0">
          <SystemMonitor />
          
          <ActiveDefenseWidget />

          <ArkCard 
            title={t('hacker_profile', lang)} 
            className="flex-1 min-h-0" 
            contentClassName="flex flex-col p-0"
            noPadding
          >
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {MOCK_HACKER_PROFILES.map(profile => (
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
