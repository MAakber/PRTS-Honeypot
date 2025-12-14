
import React from 'react';

export type Lang = 'en' | 'zh';

export interface User {
  username: string;
  role: 'admin' | 'user';
  isAuthenticated: boolean;
}

export interface NavItem {
  id: string;
  labelEn: string;
  labelZh: string;
  path: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

export interface Message {
  id: string;
  title: string;
  content: string;
  time: string;
  type: 'system' | 'security' | 'report';
  read: boolean;
}

export interface AttackLog {
  id: string;
  timestamp: string;
  sourceIp: string;
  location: string;
  method: string;
  payload: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'blocked' | 'monitored' | 'compromised';
}

export interface NodeStatus {
  id: string;
  name: string;
  region: string;
  status: 'online' | 'offline' | 'warning';
  load: number;
  ip: string;
  os: 'linux' | 'windows' | 'mac' | 'alpine';
  template: string;
  trafficHistory: number[];
}

export interface HackerProfile {
  id: string;
  ip: string;
  location: string;
  tags: string[];
  captureCount: number;
  lastSeen: string;
  severity: 'high' | 'critical';
}

export interface HoneypotStat {
  id: string;
  name: string;
  type: 'tcp' | 'redis' | 'esxi' | 'coremail' | 'elastic' | 'camera';
  count: number;
}

export interface SampleLog {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  threatLevel: 'malicious' | 'suspicious' | 'safe' | 'unknown';
  status: 'completed' | 'analyzing' | 'failed' | 'queued';
  captureCount: number;
  lastTime: string;
  attackerIp: string;
  sourceNode: string;
  sha256: string;
}

export interface VulnRule {
  id: string;
  name: string;
  type: string;
  severity: 'high' | 'medium' | 'low' | 'suspicious' | 'other';
  hitCount: number;
  lastHitTime: string;
  creator: string;
  status: 'active' | 'inactive';
  updateTime: string;
  updater: string;
}

export interface HoneypotTemplate {
  id: string;
  name: string;
  refCount: number;
  ports: string[];
  description: string;
}

export interface HoneypotService {
  id: string;
  name: string;
  category: string;
  interactionType: 'high' | 'low';
  refTemplateCount: number;
  refNodeCount: number;
  defaultPort: string;
  description: string;
  isCloud?: boolean; // To distinguish the cloud icon
}

export interface Report {
  id: string;
  name: string;
  module: string;
  type: 'daily' | 'weekly' | 'custom';
  size: string;
  status: 'success' | 'generating' | 'failed';
  creator: string;
  createTime: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}