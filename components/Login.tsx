
import React, { useState, useEffect } from 'react';
import { ArkButton, ArkInput } from './ArknightsUI';
import { Hexagon, Sun, Moon, Globe, AlertTriangle } from 'lucide-react';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { useNotification } from './NotificationSystem';
import { ParticleBackground } from './ParticleBackground';

interface LoginProps {
  onLogin: (username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { lang, toggleLang, darkMode, toggleTheme, unreadCount } = useApp();
  const { notify } = useNotification();
  const [username, setUsername] = useState('Dr. Admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [clientIp, setClientIp] = useState('SCANNING...');

  useEffect(() => {
    // Simulate IP detection
    const timer = setTimeout(() => {
        setClientIp('192.168.142.88');
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      notify('success', t('notify_login_success_title', lang), t('notify_login_success_msg', lang));
      
      // Check for unread messages and notify if any
      if (unreadCount > 0) {
          setTimeout(() => {
              notify('warning', t('mc_title', lang), t('unread_alert', lang).replace('{count}', unreadCount.toString()));
          }, 800);
      }

      onLogin(username);
    } else {
      const msg = t('access_denied', lang);
      setError(msg);
      notify('error', t('notify_login_failed_title', lang), msg);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-ark-bg flex items-center justify-center relative overflow-hidden transition-colors duration-300">
      {/* Sci-fi Particle Background */}
      <ParticleBackground className="opacity-50" />
      
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20 flex items-center gap-2 md:gap-3">
          <button 
            onClick={toggleTheme} 
            className="p-2 text-ark-subtext hover:text-ark-primary bg-ark-panel/50 border border-ark-border rounded-sm backdrop-blur-sm transition-all hover:bg-ark-active/20"
            title="Toggle Theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={toggleLang} 
            className="p-2 text-ark-subtext hover:text-ark-primary bg-ark-panel/50 border border-ark-border rounded-sm backdrop-blur-sm transition-all hover:bg-ark-active/20 font-mono font-bold text-xs w-9 h-9 flex items-center justify-center"
            title="Switch Language"
          >
            {lang === 'en' ? 'CN' : 'EN'}
          </button>
      </div>

      {/* Decorative Lines - Hide the left one on mobile to prevent visual clutter */}
      <div className="absolute top-0 left-4 md:left-10 h-full w-[1px] bg-ark-border opacity-50 pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-full h-[1px] bg-ark-border opacity-50 pointer-events-none" />
      <div className="absolute top-20 right-0 w-16 md:w-32 h-[1px] bg-ark-primary/30 pointer-events-none" />

      <div className="z-10 w-[90%] md:w-full max-w-md p-6 md:p-8 relative mt-[-10vh] md:mt-0">
        {/* Card Shape */}
        <div className="absolute inset-0 bg-ark-panel/90 md:bg-ark-panel/80 backdrop-blur-xl clip-corner-tl-br border border-ark-border shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-300" />
        
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-6 h-6 md:w-8 md:h-8 border-t-2 border-l-2 border-ark-primary opacity-50" />
        <div className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 border-b-2 border-r-2 border-ark-primary opacity-50" />

        <div className="relative z-10">
          <div className="mb-8 md:mb-12 text-center">
             <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 border-2 border-ark-text mb-4 rotate-45 transition-transform duration-500 hover:rotate-90">
               <div className="-rotate-45">
                 <Hexagon size={24} className="text-ark-text fill-ark-bg md:w-8 md:h-8" />
               </div>
             </div>
             <h1 className="text-2xl md:text-3xl font-bold tracking-[0.2em] text-ark-text mt-2 md:mt-4">{t('rhodes_island', lang)}</h1>
             <div className="flex items-center justify-center gap-2 mt-2">
                 <div className="h-[1px] w-6 md:w-8 bg-ark-primary" />
                 <p className="text-ark-primary font-mono text-[10px] md:text-xs tracking-widest whitespace-nowrap">{t('security_terminal', lang)}</p>
                 <div className="h-[1px] w-6 md:w-8 bg-ark-primary" />
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            <div>
               <label className="block text-xs font-bold text-ark-subtext mb-2 font-mono uppercase tracking-wider">{t('identity_code', lang)}</label>
               <ArkInput 
                 type="text" 
                 value={username} 
                 onChange={e => setUsername(e.target.value)}
                 placeholder={t('enter_username', lang)}
                 className="focus:bg-ark-active/10"
               />
            </div>
            <div>
               <label className="block text-xs font-bold text-ark-subtext mb-2 font-mono uppercase tracking-wider">{t('access_key', lang)}</label>
               <ArkInput 
                 type="password" 
                 value={password} 
                 onChange={e => setPassword(e.target.value)}
                 placeholder={t('enter_password', lang)}
                 className="focus:bg-ark-active/10"
               />
            </div>

            {error && <p className="text-ark-danger text-xs font-mono blink flex items-center gap-2 border border-ark-danger/20 bg-ark-danger/5 p-2"><span className="w-1.5 h-1.5 bg-ark-danger rounded-full" /> {error}</p>}

            <div className="pt-4">
              <ArkButton className="w-full h-12 text-base shadow-lg shadow-ark-primary/20" onClick={() => {}}>
                {t('initiate_link', lang)}
              </ArkButton>
            </div>
          </form>

          <div className="mt-8 text-center">
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-xs font-mono text-ark-subtext bg-ark-subtext/10 px-2 py-1 rounded-sm border border-ark-border">
                    <span>CLIENT_IP: <span className="font-bold tracking-widest">{clientIp}</span></span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
