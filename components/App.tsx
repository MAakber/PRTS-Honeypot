
import React from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AttackList } from './components/AttackList';
import { AttackSource } from './components/AttackSource';
import { AccountResources } from './components/AccountResources';
import { ScanningPerception } from './components/ScanningPerception';
import { CompromisePerception } from './components/CompromisePerception';
import { SampleDetection } from './components/SampleDetection';
import { VulnSimulation } from './components/VulnSimulation';
import { NodeManagement } from './components/NodeManagement';
import { TemplateManagement } from './components/TemplateManagement';
import { ServiceManagement } from './components/ServiceManagement';
import { ReportManagement } from './components/ReportManagement';
import { SystemConfig } from './components/SystemConfig';
import { SystemInfo } from './components/SystemInfo';
import { MessageCenter } from './components/MessageCenter';
import { AccessControl } from './components/AccessControl';
import { AutoDefense } from './components/AutoDefense';
import { TrafficFiltration } from './components/TrafficFiltration';
import { DefenseLevel } from './components/DefenseLevel';
import { NAVIGATION } from './constants';
import { Construction } from 'lucide-react';
import { AppProvider, useApp } from './AppContext';
import { NotificationProvider } from './components/NotificationSystem';
import { t } from './i18n';

// Placeholder for Under Construction pages
const ConstructionPage: React.FC<{ title: string }> = ({ title }) => {
  const { lang } = useApp();
  return (
    <div className="h-full flex flex-col items-center justify-center text-ark-subtext">
      <Construction size={64} className="mb-4 text-ark-primary opacity-50" />
      <h2 className="text-2xl font-bold text-ark-text mb-2">{title}</h2>
      <p className="font-mono text-sm">{t('app_maintenance', lang)}</p>
      <p className="font-mono text-xs mt-2 text-ark-subtext">{t('app_contact_admin', lang)}</p>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, login } = useApp();

  if (!user) {
    return <Login onLogin={login} />;
  }

  return (
    <Router>
      <Layout navItems={NAVIGATION}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/threat-perception/list" element={<AttackList />} />
          <Route path="/threat-perception/scanning" element={<ScanningPerception />} />
          <Route path="/threat-perception/compromise" element={<CompromisePerception />} />
          <Route path="/threat-perception/*" element={<ConstructionPage title="Threat Perception" />} />
          
          <Route path="/threat-entities/sources" element={<AttackSource />} />
          <Route path="/threat-entities/accounts" element={<AccountResources />} />
          <Route path="/threat-entities/samples" element={<SampleDetection />} />
          <Route path="/threat-entities/vuln" element={<VulnSimulation />} />
          
          <Route path="/active-defense/level" element={<DefenseLevel />} />
          <Route path="/active-defense/access" element={<AccessControl />} />
          <Route path="/active-defense/auto" element={<AutoDefense />} />
          <Route path="/active-defense/filter" element={<TrafficFiltration />} />
          
          <Route path="/env-management/nodes" element={<NodeManagement />} />
          <Route path="/env-management/templates" element={<TemplateManagement />} />
          <Route path="/env-management/services" element={<ServiceManagement />} />
          
          <Route path="/system/config" element={<SystemConfig />} />
          <Route path="/system/info" element={<SystemInfo />} />
          <Route path="/system/reports" element={<ReportManagement />} />
          
          <Route path="/messages" element={<MessageCenter />} />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </NotificationProvider>
  );
};

export default App;
