
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Lang, Message } from './types';

interface ModuleState {
    attackSource: boolean;
    scanning: boolean;
    attack: boolean;
    infoStealing: boolean;
    payload: boolean;
    persistence: boolean;
}

interface AppContextType {
  user: User | null;
  login: (username: string) => void;
  logout: () => void;
  lang: Lang;
  toggleLang: () => void;
  darkMode: boolean;
  toggleTheme: () => void;
  // Message Context Props
  messages: Message[];
  unreadCount: number;
  markAllRead: () => void;
  deleteMessage: (id: string) => void;
  toggleRead: (id: string) => void;
  // Module State
  modules: ModuleState;
  toggleModule: (key: keyof ModuleState) => void;
}

const MOCK_MESSAGES_EN: Message[] = [
    {
        id: 'msg-1',
        title: 'System Update Completed',
        content: 'PRTS Honeypot System has been updated to v3.3.7. New features include enhanced Gemini AI integration for threat analysis.',
        time: '2025/12/06 10:00:00',
        type: 'system',
        read: false
    },
    {
        id: 'msg-2',
        title: 'High Risk Attack Detected',
        content: 'Multiple failed login attempts detected from IP 192.168.1.105 on SSH service. Source has been temporarily blocked.',
        time: '2025/12/06 09:45:22',
        type: 'security',
        read: false
    },
    {
        id: 'msg-3',
        title: 'Weekly Report Generated',
        content: 'The weekly security report for 11/29 - 12/05 has been generated and is ready for download.',
        time: '2025/12/06 00:00:00',
        type: 'report',
        read: true
    },
    {
        id: 'msg-4',
        title: 'Database Maintenance',
        content: 'Scheduled database maintenance will occur on 2025/12/07 at 02:00 UTC. Expected downtime: 15 minutes.',
        time: '2025/12/05 14:30:00',
        type: 'system',
        read: true
    },
    {
        id: 'msg-5',
        title: 'New Node Online',
        content: 'Node "Chernobog-B" has successfully connected to the control center.',
        time: '2025/12/05 11:20:15',
        type: 'system',
        read: true
    }
];

const MOCK_MESSAGES_ZH: Message[] = [
    {
        id: 'msg-1',
        title: '系统更新完成',
        content: 'PRTS 蜜罐系统已更新至 v3.3.7。新功能包括增强的 Gemini AI 威胁分析集成。',
        time: '2025/12/06 10:00:00',
        type: 'system',
        read: false
    },
    {
        id: 'msg-2',
        title: '检测到高危攻击',
        content: '检测到 IP 192.168.1.105 针对 SSH 服务的多次失败登录尝试。源已被临时封锁。',
        time: '2025/12/06 09:45:22',
        type: 'security',
        read: false
    },
    {
        id: 'msg-3',
        title: '周报已生成',
        content: '11/29 - 12/05 的每周安全报告已生成并准备好下载。',
        time: '2025/12/06 00:00:00',
        type: 'report',
        read: true
    },
    {
        id: 'msg-4',
        title: '数据库维护',
        content: '计划于 2025/12/07 02:00 UTC 进行数据库维护。预计停机时间：15 分钟。',
        time: '2025/12/05 14:30:00',
        type: 'system',
        read: true
    },
    {
        id: 'msg-5',
        title: '新节点上线',
        content: '节点 "Chernobog-B" 已成功连接到控制中心。',
        time: '2025/12/05 11:20:15',
        type: 'system',
        read: true
    }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Lang>('zh'); 
  const [darkMode, setDarkMode] = useState(true);

  // Message State
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES_ZH);

  // Module State (Global Switch State)
  const [modules, setModules] = useState<ModuleState>({
      attackSource: true,
      scanning: true,
      attack: true, // Intrusion Attack (List)
      infoStealing: true, // Account Resources
      payload: true, // Sample Detection
      persistence: true, // Compromise Perception
  });

  const toggleModule = (key: keyof ModuleState) => {
      setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Update messages when lang changes, trying to preserve read state via index/ID matching
  useEffect(() => {
    const targetSource = lang === 'zh' ? MOCK_MESSAGES_ZH : MOCK_MESSAGES_EN;
    setMessages(prev => {
        return targetSource.map((newMsg, index) => {
            if (prev[index] && prev[index].id === newMsg.id) {
                return { ...newMsg, read: prev[index].read };
            }
            return newMsg;
        });
    });
  }, [lang]);

  const login = (username: string) => {
    setUser({ username, role: 'admin', isAuthenticated: true });
  };

  const logout = () => {
    setUser(null);
  };

  const toggleLang = () => setLang(prev => prev === 'en' ? 'zh' : 'en');
  
  const toggleTheme = () => setDarkMode(prev => !prev);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Message Actions
  const markAllRead = () => {
    setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
  };

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const toggleRead = (id: string) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, read: !msg.read } : msg));
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <AppContext.Provider value={{ 
        user, login, logout, lang, toggleLang, darkMode, toggleTheme,
        messages, unreadCount, markAllRead, deleteMessage, toggleRead,
        modules, toggleModule
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
