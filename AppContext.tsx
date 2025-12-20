
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Lang, Message, AttackLog } from './types';
import { useNotification } from './components/NotificationSystem';
import { t } from './i18n';

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
  login: (username: string, password?: string) => Promise<boolean>;
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
  // Real-time Data
  attacks: AttackLog[];
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  loginPolicy: { url: string } | null;
}

const MOCK_MESSAGES_EN: Message[] = [];

const MOCK_MESSAGES_ZH: Message[] = [];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { notify } = useNotification();
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('prts_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Failed to parse saved user", e);
      return null;
    }
  });
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

  const [attacks, setAttacks] = useState<AttackLog[]>([]);
  const [loginPolicy, setLoginPolicy] = useState<{ url: string } | null>(null);

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('prts_token');
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const response = await fetch(url, { ...options, headers });
    
    // Sliding Session: Check for refreshed token in headers
    const refreshedToken = response.headers.get('X-Refresh-Token');
    if (refreshedToken) {
      localStorage.setItem('prts_token', refreshedToken);
    }

    // Global 401 Handler: If unauthorized, logout and redirect
    if (response.status === 401) {
      console.warn("Session expired or unauthorized. Logging out...");
      localStorage.setItem('prts_session_expired', 'true');
      logout();
      return response;
    }
    
    return response;
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-');
    } catch (e) {
      return isoString;
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchPublicConfig = async () => {
      try {
        const res = await fetch('/api/v1/public/login-policy');
        if (res.ok) setLoginPolicy(await res.json());
      } catch (e) {
        console.error("Failed to fetch public config", e);
      }
    };
    fetchPublicConfig();

    if (user) {
      const fetchData = async () => {
        try {
          const [msgRes, attackRes] = await Promise.all([
            authFetch('/api/v1/messages'),
            authFetch('/api/v1/attacks')
          ]);
          
          if (msgRes.ok) {
            const rawMessages = await msgRes.json();
            setMessages(rawMessages.map((msg: any) => ({
              ...msg,
              title: translateMessage(msg.title, lang),
              content: translateMessage(msg.content, lang),
              time: formatTime(msg.time)
            })));
          }
          if (attackRes.ok) setAttacks(await attackRes.json());
        } catch (e) {
          console.error("Failed to fetch initial data", e);
        }
      };
      fetchData();
    }
  }, [user, lang]); // Re-fetch or re-translate when lang changes

  const translateMessage = (text: string, currentLang: Lang) => {
    if (!text) return text;
    const [key, paramsStr] = text.split('|');
    if (paramsStr) {
      const params: any = {};
      paramsStr.split(',').forEach(p => {
        const [k, v] = p.split(':');
        if (k && v) params[k] = v;
      });
      return t(key, currentLang, params);
    }
    return t(text, currentLang);
  };

  const processedMessageIds = React.useRef(new Set<string>());

  // WebSocket Connection
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host === 'localhost:3000' ? 'localhost:8080' : window.location.host;
      socket = new WebSocket(`${protocol}//${host}/api/v1/ws`);

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'ATTACK_EVENT') {
            setAttacks(prev => [message.data, ...prev].slice(0, 100));
          } else if (message.type === 'NODE_UPDATE') {
            console.log("Received NODE_UPDATE:", message.data);
            // Dispatch a custom event so NodeManagement can listen to it
            window.dispatchEvent(new CustomEvent('PRTS_NODE_UPDATE', { detail: message.data }));
          } else if (message.type === 'NEW_MESSAGE') {
            const msg = message.data;
            
            // Strict deduplication using Ref to prevent double-toasts in StrictMode or race conditions
            if (processedMessageIds.current.has(msg.id)) {
                return;
            }
            processedMessageIds.current.add(msg.id);

            const translatedMsg = {
              ...msg,
              title: translateMessage(msg.title, lang),
              content: translateMessage(msg.content, lang),
              time: formatTime(msg.time)
            };
            
            setMessages(prev => {
              // Double check state just in case
              if (prev.some(m => m.id === msg.id)) return prev;
              return [translatedMsg, ...prev];
            });
            
            notify(
              msg.type === 'security' ? 'error' : 'info',
              translatedMsg.title,
              translatedMsg.content
            );
          }
        } catch (e) {
          console.error("WS Message Error:", e);
        }
      };

      socket.onclose = () => {
        console.log("WS Disconnected. Reconnecting...");
        reconnectTimer = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error("WS Error:", err);
        socket?.close();
      };
    };

    connect();
    return () => {
      if (socket) {
        socket.onclose = null; // Prevent reconnect loop on unmount
        socket.close();
      }
      clearTimeout(reconnectTimer);
    };
  }, []);

  const toggleModule = (key: keyof ModuleState) => {
      setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Update messages when lang changes
  useEffect(() => {
    // No longer syncing with mock data
  }, [lang]);

  const login = async (username: string, password?: string) => {
    try {
      // Neural Link Encryption (Base64 Obfuscation)
      const encryptedPassword = password ? btoa(password) : '';
      
      const response = await fetch('/api/v1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: encryptedPassword })
      });
      
      const data = await response.json();
      if (response.ok) {
        const userData = { ...data.user, isAuthenticated: true };
        localStorage.setItem('prts_token', data.token);
        localStorage.setItem('prts_user', JSON.stringify(userData));
        setUser(userData);
        return true;
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (error: any) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('prts_token');
    localStorage.removeItem('prts_user');
    setUser(null);
    
    // Redirect to the secret login URL if it exists
    if (loginPolicy && loginPolicy.url) {
      window.location.href = `/admin/${loginPolicy.url}`;
    } else {
      window.location.href = '/admin/login';
    }
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
  const markAllRead = async () => {
    try {
      const res = await authFetch('/api/v1/messages/read-all', { method: 'POST' });
      if (res.ok) {
        setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
      }
    } catch (e) {
      console.error("Failed to mark all read", e);
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const res = await authFetch(`/api/v1/messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete message", e);
    }
  };

  const toggleRead = (id: string) => {
    // For now, just local toggle or we could add a specific API
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, read: !msg.read } : msg));
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <AppContext.Provider value={{ 
        user, login, logout, lang, toggleLang, darkMode, toggleTheme,
        messages, unreadCount, markAllRead, deleteMessage, toggleRead,
        modules, toggleModule, attacks, authFetch, loginPolicy
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
