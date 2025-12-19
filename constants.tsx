
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
      { id: 'config', labelEn: 'Configuration', labelZh: '系统配置', path: '/system/config' },
      { id: 'reports', labelEn: 'Reports', labelZh: '报表管理', path: '/system/reports' },
      { id: 'info', labelEn: 'Information', labelZh: '系统信息', path: '/system/info' },
      { id: 'messages', labelEn: 'Message Center', labelZh: '消息中心', path: '/messages' },
    ]
  }
];

export const MOCK_ATTACKS: AttackLog[] = [
  { id: 'LOG-0921', timestamp: '2023-10-24 14:02:11', sourceIp: '192.168.1.105', location: 'Unknown Proxy', method: 'SSH', payload: 'Brute Force: root/123456', severity: 'medium', status: 'blocked' },
  { id: 'LOG-0922', timestamp: '2023-10-24 14:05:33', sourceIp: '45.33.22.11', location: 'CN, Shanghai', method: 'HTTP', payload: 'GET /admin/config.php', severity: 'high', status: 'monitored' },
  { id: 'LOG-0923', timestamp: '2023-10-24 14:10:01', sourceIp: '103.22.1.5', location: 'RU, Moscow', method: 'TCP', payload: 'Syn Flood', severity: 'critical', status: 'blocked' },
  { id: 'LOG-0924', timestamp: '2023-10-24 14:12:45', sourceIp: '89.11.23.44', location: 'US, California', method: 'HTTP', payload: 'POST /api/v1/login SQL Injection', severity: 'high', status: 'monitored' },
  { id: 'LOG-0925', timestamp: '2023-10-24 14:15:10', sourceIp: '192.168.1.109', location: 'Internal', method: 'SMB', payload: 'EternalBlue Probe', severity: 'critical', status: 'compromised' },
];

export const MOCK_NODES: NodeStatus[] = [
  { 
      id: 'NODE-01', 
      name: 'Chernobog-A', 
      region: 'Sector 01', 
      status: 'online', 
      load: 45,
      ip: '172.24.62.228',
      os: 'alpine',
      template: 'Basic Web Server',
      trafficHistory: [20, 30, 25, 40, 35, 50, 45, 60, 55, 40]
  },
  { 
      id: 'NODE-02', 
      name: 'Lungmen-Gateway', 
      region: 'Sector 02', 
      status: 'online', 
      load: 78,
      ip: '10.0.5.12',
      os: 'linux',
      template: 'Database Cluster',
      trafficHistory: [50, 60, 55, 70, 80, 75, 85, 90, 80, 70]
  },
  { 
      id: 'NODE-03', 
      name: 'Rhodes-Internal', 
      region: 'Sector 00', 
      status: 'warning', 
      load: 92,
      ip: '192.168.1.50',
      os: 'windows',
      template: 'Office Workstation',
      trafficHistory: [10, 15, 10, 20, 90, 95, 85, 90, 88, 92]
  },
  { 
      id: 'NODE-04', 
      name: 'Iberia-Coastal', 
      region: 'Sector 09', 
      status: 'offline', 
      load: 0,
      ip: '10.0.9.99',
      os: 'linux',
      template: 'SSH Honeypot',
      trafficHistory: [10, 10, 5, 0, 0, 0, 0, 0, 0, 0]
  },
];

export const MOCK_HACKER_PROFILES: HackerProfile[] = [
  { id: 'HK-001', ip: '162.142.125.28', location: 'US, California', tags: ['multi_capture', 'scanner'], captureCount: 15, lastSeen: '2m ago', severity: 'critical' },
  { id: 'HK-002', ip: '162.142.125.30', location: 'US, California', tags: ['multi_capture'], captureCount: 8, lastSeen: '5m ago', severity: 'critical' },
  { id: 'HK-003', ip: '64.62.197.212', location: 'US, New York', tags: ['multi_capture'], captureCount: 12, lastSeen: '12m ago', severity: 'high' },
  { id: 'HK-004', ip: '162.142.125.168', location: 'US, California', tags: ['multi_capture'], captureCount: 4, lastSeen: '15m ago', severity: 'high' },
  { id: 'HK-005', ip: '64.62.197.2', location: 'US, New York', tags: ['multi_capture'], captureCount: 22, lastSeen: '18m ago', severity: 'critical' },
  { id: 'HK-006', ip: '162.142.125.174', location: 'US, California', tags: ['multi_capture'], captureCount: 6, lastSeen: '25m ago', severity: 'high' },
  { id: 'HK-007', ip: '184.105.247.254', location: 'US, Seattle', tags: ['multi_capture'], captureCount: 3, lastSeen: '30m ago', severity: 'high' },
];

export const MOCK_HONEYPOT_STATS: HoneypotStat[] = [
  { id: 'HP-01', name: 'TCP Port Monitor', type: 'tcp', count: 1714 },
  { id: 'HP-02', name: 'Redis Honeypot', type: 'redis', count: 585 },
  { id: 'HP-03', name: 'ESXi System', type: 'esxi', count: 401 },
  { id: 'HP-04', name: 'Coremail', type: 'coremail', count: 224 },
  { id: 'HP-05', name: 'Elasticsearch', type: 'elastic', count: 163 },
  { id: 'HP-06', name: 'Hikvision Camera', type: 'camera', count: 7 },
];

export const MOCK_SCAN_LOGS = [
    { id: 'SC-001', ip: '192.168.1.105', threat: 'Malicious', node: 'Chernobog-A', targetIp: '10.0.0.5', type: 'SYN', count: 1542, ports: '80, 443, 8080', location: 'Sector 01', start: '2023-10-24 14:02:11', duration: '5s' },
    { id: 'SC-002', ip: '45.33.22.11', threat: 'Suspicious', node: 'Lungmen-Gateway', targetIp: '10.0.0.8', type: 'UDP', count: 890, ports: '53, 123', location: 'Sector 02', start: '2023-10-24 14:05:33', duration: '12s' },
    { id: 'SC-003', ip: '103.22.1.5', threat: 'High Risk', node: 'Rhodes-Internal', targetIp: '10.0.0.12', type: 'ICMP', count: 3200, ports: '-', location: 'Sector 00', start: '2023-10-24 14:10:01', duration: '45s' },
    { id: 'SC-004', ip: '89.201.11.2', threat: 'Low', node: 'Iberia-Coastal', targetIp: '10.0.0.15', type: 'SYN', count: 45, ports: '22', location: 'Sector 09', start: '2023-10-24 14:15:20', duration: '2s' },
    { id: 'SC-005', ip: '211.98.2.14', threat: 'Malicious', node: 'Chernobog-A', targetIp: '10.0.0.5', type: 'UDP', count: 12000, ports: 'Random', location: 'Sector 01', start: '2023-10-24 14:18:00', duration: '1m 20s' },
];

export const MOCK_ATTACK_SOURCES = [
  { id: 'AS-001', ip: '3.84.203.101', country: 'US', verdict: 'unknown', attackCount: 2704, scanCount: 2695, nodes: ['Internal Node'], firstTime: '2025/11/23 23:19:27' },
  { id: 'AS-002', ip: '3.227.240.138', country: 'US', verdict: 'unknown', attackCount: 1341, scanCount: 1338, nodes: ['Internal Node'], firstTime: '2025/11/21 01:12:26' },
  { id: 'AS-003', ip: '195.178.110.109', country: 'RO', verdict: 'unknown', attackCount: 1106, scanCount: 462, nodes: ['Internal Node'], firstTime: '2025/11/28 23:24:02' },
  { id: 'AS-004', ip: '45.148.10.247', country: 'EU', verdict: 'unknown', attackCount: 760, scanCount: 741, nodes: ['Internal Node'], firstTime: '2025/11/19 01:34:58' },
  { id: 'AS-005', ip: '117.132.188.205', country: 'CN', verdict: 'unknown', attackCount: 300, scanCount: 18, nodes: ['Internal Node'], firstTime: '2025/11/20 12:16:10' },
  { id: 'AS-006', ip: '47.102.184.31', country: 'CN', verdict: 'high', attackCount: 236, scanCount: 27, nodes: ['Internal Node'], firstTime: '2025/11/19 01:10:46' },
  { id: 'AS-007', ip: '47.92.65.140', country: 'CN', verdict: 'unknown', attackCount: 218, scanCount: 602, nodes: ['Internal Node'], firstTime: '2025/11/24 18:00:23' },
  { id: 'AS-008', ip: '204.76.203.51', country: 'US', verdict: 'medium', attackCount: 178, scanCount: 629, nodes: ['Internal Node'], firstTime: '2025/11/19 04:36:07', tags: ['scan', 'trash_mail', 'dynamic_ip'] },
  { id: 'AS-009', ip: '204.76.203.52', country: 'US', verdict: 'unknown', attackCount: 136, scanCount: 465, nodes: ['Internal Node'], firstTime: '2025/11/19 03:19:39' },
  { id: 'AS-010', ip: '188.166.243.95', country: 'SG', verdict: 'unknown', attackCount: 122, scanCount: 127, nodes: ['Internal Node'], firstTime: '2025/11/25 19:08:15' },
];

export const MOCK_ACCOUNT_CREDENTIALS = [
    { id: 'AC-001', username: 'root', password: 'password', service: 'SSH', count: 1205, ip: '3.84.203.101' },
    { id: 'AC-002', username: 'admin', password: '123456', service: 'HTTP Login', count: 894, ip: '195.178.110.109' },
    { id: 'AC-003', username: 'support', password: 'support', service: 'RDP', count: 562, ip: '45.148.10.247' },
    { id: 'AC-004', username: 'user', password: '123', service: 'FTP', count: 334, ip: '117.132.188.205' },
    { id: 'AC-005', username: 'administrator', password: 'admin123', service: 'SMB', count: 210, ip: '47.92.65.140' },
    { id: 'AC-006', username: 'test', password: 'test', service: 'Telnet', count: 156, ip: '204.76.203.51' },
    { id: 'AC-007', username: 'guest', password: 'guest', service: 'HTTP Login', count: 112, ip: '188.166.243.95' },
    { id: 'AC-008', username: 'postgres', password: 'postgres', service: 'PostgreSQL', count: 89, ip: '45.33.22.11' },
    { id: 'AC-009', username: 'root', password: '12345', service: 'SSH', count: 67, ip: '103.22.1.5' },
    { id: 'AC-010', username: 'admin', password: 'password', service: 'HTTP Login', count: 45, ip: '89.11.23.44' },
];

export const MOCK_TOP_USERNAMES = [
    { name: 'root', count: 3240 },
    { name: 'admin', count: 2891 },
    { name: 'support', count: 1560 },
    { name: 'user', count: 1200 },
    { name: 'test', count: 890 },
    { name: 'administrator', count: 750 },
    { name: 'guest', count: 620 },
    { name: 'oracle', count: 430 },
    { name: 'ubuntu', count: 310 },
    { name: 'pi', count: 205 },
];

export const MOCK_TOP_PASSWORDS = [
    { name: '123456', count: 4500 },
    { name: 'password', count: 3800 },
    { name: 'admin', count: 3200 },
    { name: '12345', count: 2100 },
    { name: '12345678', count: 1800 },
    { name: '111111', count: 1500 },
    { name: 'qwerty', count: 1200 },
    { name: 'admin123', count: 900 },
    { name: 'root', count: 800 },
    { name: '123', count: 750 },
];

export const DASHBOARD_TREND_DATA = [
  { name: '11-29', coremail: 120, esxi: 80, elastic: 40, redis: 20 },
  { name: '11-30', coremail: 140, esxi: 90, elastic: 50, redis: 30 },
  { name: '12-01', coremail: 180, esxi: 120, elastic: 70, redis: 40 },
  { name: '12-02', coremail: 250, esxi: 150, elastic: 90, redis: 60 },
  { name: '12-03', coremail: 220, esxi: 140, elastic: 80, redis: 55 },
  { name: '12-04', coremail: 190, esxi: 130, elastic: 75, redis: 50 },
  { name: '12-05', coremail: 160, esxi: 110, elastic: 60, redis: 45 },
];

export const MOCK_SAMPLE_LOGS: SampleLog[] = [
    {
        id: 'SMP-001',
        fileName: 'wannacry.exe',
        fileSize: '4.2 MB',
        fileType: 'EXE',
        threatLevel: 'malicious',
        status: 'completed',
        captureCount: 15,
        lastTime: '2023-10-24 12:45:00',
        attackerIp: '192.168.1.55',
        sourceNode: 'Chernobog-A',
        sha256: 'a1b2c3d4e5f6...'
    },
    {
        id: 'SMP-002',
        fileName: 'invoice_scan.pdf.exe',
        fileSize: '1.8 MB',
        fileType: 'EXE',
        threatLevel: 'malicious',
        status: 'completed',
        captureCount: 3,
        lastTime: '2023-10-24 13:02:15',
        attackerIp: '45.148.10.247',
        sourceNode: 'Lungmen-Gateway',
        sha256: '8877665544...'
    },
    {
        id: 'SMP-003',
        fileName: 'unknown_script.sh',
        fileSize: '12 KB',
        fileType: 'SH',
        threatLevel: 'suspicious',
        status: 'analyzing',
        captureCount: 1,
        lastTime: '2023-10-24 13:30:00',
        attackerIp: '10.0.0.5',
        sourceNode: 'Rhodes-Internal',
        sha256: '99aabbcc...'
    },
    {
        id: 'SMP-004',
        fileName: 'config_backup.tar.gz',
        fileSize: '25 MB',
        fileType: 'ARCHIVE',
        threatLevel: 'safe',
        status: 'completed',
        captureCount: 1,
        lastTime: '2023-10-24 14:00:00',
        attackerIp: '192.168.1.10',
        sourceNode: 'Chernobog-A',
        sha256: '11223344...'
    },
    {
        id: 'SMP-005',
        fileName: 'payload_x64.bin',
        fileSize: '512 KB',
        fileType: 'BIN',
        threatLevel: 'unknown',
        status: 'queued',
        captureCount: 5,
        lastTime: '2023-10-24 14:15:30',
        attackerIp: '89.11.23.44',
        sourceNode: 'Iberia-Coastal',
        sha256: '00998877...'
    }
];

export const MOCK_VULN_RULES: VulnRule[] = [
    { id: 'VUL-001', name: 'Linux Command Execution', type: 'Behavior - Internal', severity: 'high', hitCount: 19, lastHitTime: '2025/12/06 15:52:25', creator: 'admin', status: 'active', updateTime: '2025/11/18 01:47:28', updater: 'admin' },
    { id: 'VUL-002', name: 'Solr Node Probe 4', type: 'Simulation & Detection', severity: 'suspicious', hitCount: 1, lastHitTime: '2025/12/04 15:46:01', creator: 'PRTS HONEYPOT', status: 'active', updateTime: '--', updater: '' },
    { id: 'VUL-003', name: 'Solr Node Probe 0', type: 'Simulation & Detection', severity: 'suspicious', hitCount: 2, lastHitTime: '2025/12/01 14:30:51', creator: 'PRTS HONEYPOT', status: 'active', updateTime: '--', updater: '' },
    { id: 'VUL-004', name: 'Solr Node Probe 1', type: 'Simulation & Detection', severity: 'suspicious', hitCount: 2, lastHitTime: '2025/12/01 14:30:50', creator: 'PRTS HONEYPOT', status: 'active', updateTime: '--', updater: '' },
    { id: 'VUL-005', name: 'Java Malicious Code Behavior', type: 'Behavior - Internal', severity: 'high', hitCount: 2, lastHitTime: '2025/11/29 05:07:40', creator: 'admin', status: 'active', updateTime: '2025/11/18 01:47:28', updater: 'admin' },
    { id: 'VUL-006', name: 'Atlassian Confluence Injection', type: 'Simulation & Detection', severity: 'high', hitCount: 0, lastHitTime: '--', creator: 'PRTS HONEYPOT', status: 'active', updateTime: '--', updater: '' },
    { id: 'VUL-007', name: 'E-Bridge Remote Code Exec', type: 'Simulation & Detection', severity: 'high', hitCount: 0, lastHitTime: '--', creator: 'PRTS HONEYPOT', status: 'active', updateTime: '--', updater: '' },
    { id: 'VUL-008', name: 'Huawei Auth-Http Info Leak', type: 'Simulation & Detection', severity: 'medium', hitCount: 0, lastHitTime: '--', creator: 'PRTS HONEYPOT', status: 'active', updateTime: '--', updater: '' },
    { id: 'VUL-009', name: 'Yonyou U8 Cloud SQL Inj', type: 'Simulation & Detection', severity: 'high', hitCount: 0, lastHitTime: '--', creator: 'PRTS HONEYPOT', status: 'active', updateTime: '--', updater: '' },
    { id: 'VUL-010', name: 'Weaver e-office10 RCE', type: 'Simulation & Detection', severity: 'medium', hitCount: 0, lastHitTime: '--', creator: 'PRTS HONEYPOT', status: 'active', updateTime: '--', updater: '' },
];

export const MOCK_TEMPLATES: HoneypotTemplate[] = [
    {
        id: 'TMP-001',
        name: '中小企业-内网虚拟化服务',
        refCount: 0,
        ports: ['TCP/21', 'TCP/22', 'TCP/23', 'TCP/80', 'TCP/135', 'TCP/445', 'TCP/1433', 'TCP/3306', 'TCP/3389', 'TCP/8080', 'TCP/443'],
        description: '中小企业内网建设由于缺乏规划，通常混杂不同时期不同负责人构建的各类设备，同一类产品（例如路由器）都可能出现多种品牌，建议使用多样化的网络设备。'
    },
    {
        id: 'TMP-002',
        name: '中小企业-内网常见网络设备',
        refCount: 0,
        ports: ['TCP/22', 'TCP/80', 'TCP/135', 'TCP/445', 'TCP/1433', 'TCP/3306', 'TCP/3389', 'TCP/443', 'TCP/8080'],
        description: '中小企业内网建设由于缺乏规划，通常混杂不同时期不同负责人构建的各类设备，同一类产品（例如路由器）都可能出现多种品牌，建议使用多样化的网络设备。'
    },
    {
        id: 'TMP-003',
        name: '中小企业-内网研发测试环境',
        refCount: 0,
        ports: ['TCP/22', 'TCP/80', 'TCP/135', 'TCP/445', 'TCP/1433', 'TCP/3389', 'TCP/443', 'TCP/3306', 'TCP/8080'],
        description: '中小企业网络结构简单，受限于财力人力投入，通常使用小规模、低运维成本、开源成熟的网络服务。'
    },
    {
        id: 'TMP-004',
        name: '中小企业-外网生产环境',
        refCount: 0,
        ports: ['TCP/22', 'TCP/80', 'TCP/3306', 'TCP/6379', 'TCP/8080'],
        description: '中小企业外网环境通常租赁公有云厂商资源，一般用于官网、数据回收集、VPN服务、办公区数据分发等小规模服务，通常使用现成稳定、开源成熟方案，部署时注意调整公有云防火墙策略。除非用于情报生产，不建议部署在外网时候开放过多端口，大量低威胁告警会淹没更有价值的信息。'
    },
    {
        id: 'TMP-005',
        name: '高科技行业-内网常见网络设备',
        refCount: 0,
        ports: ['TCP/22', 'TCP/23', 'TCP/80', 'TCP/135', 'TCP/443', 'TCP/445', 'TCP/1433', 'TCP/3306', 'TCP/3389', 'TCP/8080'],
        description: '处于成熟阶段的高科技行业非常重视虚拟资产，在内网管理通常已经有较大投入和系统建设，具备专门运维团队管理，一般使用统一制式服务。'
    },
    {
        id: 'TMP-006',
        name: '高科技行业-内网Web研发测试环境',
        refCount: 0,
        ports: ['TCP/22', 'TCP/135', 'TCP/445', 'TCP/1433', 'TCP/3306', 'TCP/3389', 'TCP/8080', 'TCP/443', 'TCP/9200', 'TCP/9291'],
        description: '该行业内网研发环境通常使用开源大数据平台。'
    },
    {
        id: 'TMP-007',
        name: '高科技行业-内网数据资料管理环境',
        refCount: 0,
        ports: ['TCP/22', 'TCP/23', 'TCP/80', 'TCP/135', 'TCP/445', 'TCP/1433', 'TCP/3306', 'TCP/3389', 'TCP/443', 'TCP/8080'],
        description: '处于成熟阶段的高科技行业非常重视虚拟资产，一般具备专业的资料管理环境。'
    },
    {
        id: 'TMP-008',
        name: '高科技行业-内网堡垒机主机',
        refCount: 0,
        ports: ['TCP/21', 'TCP/22', 'TCP/80', 'TCP/135', 'TCP/445', 'TCP/1433', 'TCP/3306', 'TCP/3389', 'TCP/443', 'TCP/8080'],
        description: '为便于人员管理、代码和数据防泄漏，该行业通常会使用SSH/3389堡垒机。'
    },
    {
        id: 'TMP-009',
        name: '高科技行业-外网OA+Web邮件环境',
        refCount: 0,
        ports: ['TCP/80', 'TCP/443', 'TCP/8080'],
        description: '该行业外部暴露的资产属于高危资产，经常面临众商探测、拒绝服务、定向和APT攻击。为更好感知威胁，建议部署在官网、VPN服务、数据回传主机、邮件服务同网段，部署时注意调整公有云防火墙策略。除非用于情报生产，不建议部署在外网时候开放过多端口，大量低威胁告警会淹没更有价值的信息。'
    },
    {
        id: 'TMP-010',
        name: '政府行业-内网常见网络设备',
        refCount: 0,
        ports: ['TCP/22', 'TCP/23', 'TCP/80', 'TCP/135', 'TCP/443', 'TCP/445', 'TCP/1433', 'TCP/3306', 'TCP/3389', 'TCP/8080'],
        description: '常见的该行业内网设备、服务和端口情况。若节点无法联网，高交互SSH蜜罐可以更换为SSH蜜罐（低交互本地蜜罐）。'
    },
];

export const MOCK_SERVICES: HoneypotService[] = [
    {
        id: 'SVC-001',
        name: '高交互SSH蜜罐',
        category: '云端蜜罐',
        interactionType: 'high',
        refTemplateCount: 27,
        refNodeCount: 0,
        defaultPort: 'TCP/22',
        description: '提供了比较完善的SSH交互服务端，可记录攻击者的暴力破解攻击和shell交互，可被上传、删除和下载文件。默认使用TCP/22端口',
        isCloud: true
    },
    {
        id: 'SVC-002',
        name: 'TCP端口监听',
        category: '端口监听',
        interactionType: 'low',
        refTemplateCount: 19,
        refNodeCount: 1,
        defaultPort: 'TCP/135,TCP/139,TCP/445,TCP/1433,TCP/3389',
        description: '该蜜罐可同时监听多个TCP端口。默认监听135、139、445、1433、3389端口，可用于记录扫描口被连接情况，建议部署在内网研发测试环境'
    },
    {
        id: 'SVC-003',
        name: 'MySQL蜜罐',
        category: '数据库服务',
        interactionType: 'low',
        refTemplateCount: 11,
        refNodeCount: 0,
        defaultPort: 'TCP/3306',
        description: '该蜜罐仿真了MySQL服务端，可用于记录探测和攻击行为，建议部署在内网研发测试环境'
    },
    {
        id: 'SVC-004',
        name: 'H3C路由器蜜罐',
        category: 'IT设备',
        interactionType: 'low',
        refTemplateCount: 8,
        refNodeCount: 0,
        defaultPort: 'TCP/9092',
        description: '该蜜罐仿真了H3C路由器的Web登录界面，可用于记录账号暴力破解和攻击行为，建议部署在内网研发测试环境'
    },
    {
        id: 'SVC-005',
        name: 'Elasticsearch蜜罐',
        category: '数据库服务',
        interactionType: 'low',
        refTemplateCount: 6,
        refNodeCount: 1,
        defaultPort: 'TCP/9200',
        description: '该蜜罐仿真了分布式搜索和分析平台Elasticsearch的Web登录界面，可用于记录账号暴力破解和攻击行为，建议部署在内网研发测试环境'
    },
    {
        id: 'SVC-006',
        name: '海康摄像头蜜罐',
        category: 'IOT设备',
        interactionType: 'low',
        refTemplateCount: 6,
        refNodeCount: 1,
        defaultPort: 'TCP/9082',
        description: '该蜜罐仿真了海康威视摄像头的Web登录界面，可用于记录账号暴力破解和攻击行为，建议部署在内网办公研发测试环境'
    },
    {
        id: 'SVC-007',
        name: 'Coremail蜜罐',
        category: '邮件系统',
        interactionType: 'low',
        refTemplateCount: 5,
        refNodeCount: 1,
        defaultPort: 'TCP/9094',
        description: '该蜜罐仿真了Coremail邮件系统的Web登录界面，可用于记录账号暴力破解和攻击行为，建议部署在内外网生产测试环境'
    },
    {
        id: 'SVC-008',
        name: 'Websphere蜜罐',
        category: '服务器环境',
        interactionType: 'low',
        refTemplateCount: 5,
        refNodeCount: 0,
        defaultPort: 'TCP/9080',
        description: '该蜜罐仿真了IBMWebSphere的Web登录界面，可用于记录账号暴力破解和攻击行为，建议部署在内外网生产环境'
    },
    {
        id: 'SVC-009',
        name: 'Tomcat蜜罐',
        category: '服务器环境',
        interactionType: 'low',
        refTemplateCount: 4,
        refNodeCount: 1,
        defaultPort: 'TCP/9198',
        description: '该蜜罐仿真了Tomcat默认主页，可用于记录账号暴力破解和攻击行为，建议部署在内外网生产环境'
    },
    {
        id: 'SVC-010',
        name: 'Telnet蜜罐',
        category: '网络服务',
        interactionType: 'low',
        refTemplateCount: 4,
        refNodeCount: 0,
        defaultPort: 'TCP/23',
        description: '该蜜罐仿真了Telnet服务端，可用于记录网络连接和攻击行为，建议部署在内外网生产环境'
    },
];

export const MOCK_DECOY_LOGS = [
    { 
        id: 'DL-001', 
        type: 'File', 
        status: 'Compromised', 
        device: 'WIN-SRV-01', 
        sourceIp: '192.168.1.109', 
        time: '2025/12/06 10:15:22', 
        result: 'Handled', 
        decoyName: 'passwords.txt', 
        deployTime: '2025/11/20 09:00:00', 
        node: 'Internal Node' 
    },
    { 
        id: 'DL-002', 
        type: 'Process', 
        status: 'Compromised', 
        device: 'DB-MASTER', 
        sourceIp: '192.168.1.55', 
        time: '2025/12/06 09:30:15', 
        result: 'Pending', 
        decoyName: 'backup_service.exe', 
        deployTime: '2025/11/22 14:30:00', 
        node: 'Internal Node' 
    },
    { 
        id: 'DL-003', 
        type: 'Network', 
        status: 'Untriggered', 
        device: 'WEB-FRONT-02', 
        sourceIp: '-', 
        time: '-', 
        result: '-', 
        decoyName: 'admin_panel_config', 
        deployTime: '2025/11/25 11:00:00', 
        node: 'Internal Node' 
    },
    { 
        id: 'DL-004', 
        type: 'File', 
        status: 'Compromised', 
        device: 'HR-PC-04', 
        sourceIp: '192.168.1.201', 
        time: '2025/12/05 16:45:10', 
        result: 'Handled', 
        decoyName: 'salary_2025.xlsx', 
        deployTime: '2025/11/15 08:30:00', 
        node: 'Internal Node' 
    },
    { 
        id: 'DL-005', 
        type: 'File', 
        status: 'Untriggered', 
        device: 'DEV-SERVER', 
        sourceIp: '-', 
        time: '-', 
        result: '-', 
        decoyName: 'api_keys.env', 
        deployTime: '2025/11/30 10:00:00', 
        node: 'Internal Node' 
    }
];

// Active Defense Mocks
export const MOCK_ACCESS_RULES: AccessControlRule[] = [
    { id: 'R-001', ip: '192.168.1.105', type: 'blacklist', reason: 'SSH Brute Force', addTime: '2025-12-06 10:00:00', expireTime: '2025-12-07 10:00:00', source: 'PRTS', status: 'active' },
    { id: 'R-002', ip: '10.0.0.0/8', type: 'whitelist', reason: 'Internal Network', addTime: '2025-01-01 00:00:00', expireTime: null, source: 'SYSTEM', status: 'active' },
    { id: 'R-003', ip: '45.33.22.11', type: 'blacklist', reason: 'Malicious Payload', addTime: '2025-12-05 14:00:00', expireTime: null, source: 'PRTS', status: 'active' },
];

export const MOCK_DEFENSE_STRATEGIES: DefenseStrategy[] = [
    { id: 'S-001', name: 'SSH Anti-Brute Force', description: 'Block IP for 24h if > 5 failures in 1 min', trigger: 'SSH Login Fail > 5', action: 'Block IP (24h)', status: 'active', hitCount: 124 },
    { id: 'S-002', name: 'Web Scanner Trap', description: 'Block IP permanently if accessing honeypot admin paths', trigger: 'Access /admin_backup', action: 'Block IP (Perm)', status: 'active', hitCount: 45 },
    { id: 'S-003', name: 'High Frequency Syn Flood', description: 'Rate limit TCP SYN packets', trigger: 'SYN > 1000/s', action: 'Drop Packet', status: 'inactive', hitCount: 0 },
];

export const MOCK_TRAFFIC_RULES: TrafficRule[] = [
    { id: 'T-001', name: 'SQL Injection Sig A', category: 'SQL Injection', pattern: 'UNION SELECT', status: 'active', hits: 102 },
    { id: 'T-002', name: 'XSS Script Tag', category: 'XSS', pattern: '<script>', status: 'active', hits: 55 },
    { id: 'T-003', name: 'Path Traversal', category: 'Web Attack', pattern: '../..', status: 'active', hits: 12 },
];
