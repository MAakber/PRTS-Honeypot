
import React from 'react';
import { 
  Activity, 
  Server, 
  Settings, 
  Zap,
  LayoutDashboard,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { NavItem, AttackLog, NodeStatus, HackerProfile, HoneypotStat, SampleLog, VulnRule, HoneypotTemplate, HoneypotService, AccessControlRule, DefenseStrategy, TrafficRule } from './types';

export const NAVIGATION: NavItem[] = [
  {
    id: 'dashboard',
    labelEn: 'Big Screen',
    labelZh: '态势大屏',
    path: '/dashboard',
    icon: <LayoutDashboard size={18} />
  },
  {
    id: 'threat-perception',
    labelEn: 'Threat Perception',
    labelZh: '威胁感知',
    path: '/threat-perception',
    icon: <Activity size={18} />,
    children: [
      { id: 'attack-list', labelEn: 'Attack List', labelZh: '攻击列表', path: '/threat-perception/list' },
      { id: 'scanning', labelEn: 'Scanning Perception', labelZh: '扫描感知', path: '/threat-perception/scanning' },
      { id: 'compromise', labelEn: 'Compromise Perception', labelZh: '失陷感知', path: '/threat-perception/compromise' },
    ]
  },
  {
    id: 'threat-entities',
    labelEn: 'Threat Entities',
    labelZh: '威胁实体',
    path: '/threat-entities',
    icon: <Zap size={18} />,
    children: [
      { id: 'attack-source', labelEn: 'Attack Sources', labelZh: '攻击源', path: '/threat-entities/sources' },
      { id: 'accounts', labelEn: 'Account Resources', labelZh: '账号资源', path: '/threat-entities/accounts' },
      { id: 'samples', labelEn: 'Sample Detection', labelZh: '样本检测', path: '/threat-entities/samples' },
      { id: 'vuln-sim', labelEn: 'Vuln Simulation', labelZh: '漏洞仿真', path: '/threat-entities/vuln' },
    ]
  },
  {
    id: 'active-defense',
    labelEn: 'Active Defense',
    labelZh: '主动防御',
    path: '/active-defense',
    icon: <ShieldCheck size={18} />,
    children: [
      { id: 'defense-level', labelEn: 'Defense Level', labelZh: '防御等级', path: '/active-defense/level' },
      { id: 'access-control', labelEn: 'Access Control', labelZh: '访问控制', path: '/active-defense/access' },
      { id: 'auto-defense', labelEn: 'Auto Defense', labelZh: '自律防御', path: '/active-defense/auto' },
      { id: 'traffic-filter', labelEn: 'Traffic Filtration', labelZh: '流量过滤', path: '/active-defense/filter' },
    ]
  },
  {
    id: 'env-management',
    labelEn: 'Environment',
    labelZh: '环境管理',
    path: '/env-management',
    icon: <Server size={18} />,
    children: [
      { id: 'nodes', labelEn: 'Node Mgmt', labelZh: '节点管理', path: '/env-management/nodes' },
      { id: 'templates', labelEn: 'Template Mgmt', labelZh: '模板管理', path: '/env-management/templates' },
      { id: 'services', labelEn: 'Service Mgmt', labelZh: '服务管理', path: '/env-management/services' },
    ]
  },
  {
    id: 'system',
    labelEn: 'System',
    labelZh: '系统设置',
    path: '/system',
    icon: <Settings size={18} />,
    children: [
      { id: 'messages', labelEn: 'Message Center', labelZh: '消息中心', path: '/messages' },
      { id: 'config', labelEn: 'System Config', labelZh: '系统配置', path: '/system/config' },
      { id: 'info', labelEn: 'System Info', labelZh: '系统信息', path: '/system/info' },
      { id: 'reports', labelEn: 'Report Mgmt', labelZh: '报表管理', path: '/system/reports' },
    ]
  }
];


export const MOCK_HONEYPOT_STATS: HoneypotStat[] = [];
export const MOCK_SCAN_LOGS: any[] = [];
export const MOCK_ATTACK_SOURCES: any[] = [];
export const MOCK_ACCOUNT_CREDENTIALS: any[] = [];
export const MOCK_TOP_USERNAMES: any[] = [];
export const MOCK_TOP_PASSWORDS: any[] = [];
export const DASHBOARD_TREND_DATA: any[] = [];


export const MOCK_SAMPLE_LOGS: SampleLog[] = [];
export const MOCK_VULN_RULES: VulnRule[] = [];


export const MOCK_TEMPLATES: HoneypotTemplate[] = [];

export const MOCK_SERVICES: HoneypotService[] = [];

export const MOCK_DECOY_LOGS: any[] = [];

// Active Defense Mocks
export const MOCK_ACCESS_RULES: AccessControlRule[] = [];

export const MOCK_DEFENSE_STRATEGIES: DefenseStrategy[] = [];

export const MOCK_TRAFFIC_RULES: TrafficRule[] = [];

