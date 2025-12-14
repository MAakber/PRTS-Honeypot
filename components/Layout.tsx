
import React, { useState, useEffect } from 'react';
import { NavItem } from '../types';
import { useApp } from '../AppContext';
import { ArkButton } from './ArknightsUI';
import { LogOut, Sun, Moon, Menu, ChevronRight, Terminal, X, Grid, AlertOctagon, Bell, Hexagon, Power } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { t } from '../i18n';
import { useNotification } from './NotificationSystem';
import { ParticleBackground } from './ParticleBackground';

// --- Sub-components ---

const RealtimeClock: React.FC = () => {
  const { lang } = useApp();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-right hidden sm:block group cursor-default">
       <p className="text-[10px] text-ark-subtext font-mono tracking-widest uppercase mb-0.5 group-hover:text-ark-primary transition-colors">{t('layout_sys_time', lang)}</p>
       <p className="text-xl font-bold font-mono leading-none tracking-widest text-ark-text tabular-nums group-hover:text-white transition-colors">{time.toLocaleTimeString([], { hour12: false })}</p>
    </div>
  );
};

const SidebarItem: React.FC<{ item: NavItem, currentPath: string, onClick?: () => void }> = ({ item, currentPath, onClick }) => {
  const { lang } = useApp();
  
  const isSelfActive = currentPath.startsWith(item.path);
  const isChildActive = item.children?.some(child => currentPath.startsWith(child.path)) ?? false;
  const isActive = isSelfActive || isChildActive;

  const hasChildren = item.children && item.children.length > 0;
  const [isOpen, setIsOpen] = useState(isActive);

  useEffect(() => {
    if (isActive && hasChildren) setIsOpen(true);
  }, [isActive, hasChildren]);

  return (
    <div className="mb-1">
      <div 
        className={`
          group relative flex items-center justify-between px-4 py-3 cursor-pointer select-none overflow-hidden border-l-[3px] transition-all duration-200
          ${isActive ? 'border-ark-primary bg-ark-active/20' : 'border-transparent hover:bg-ark-active/10 hover:border-ark-subtext/30'}
        `}
        onClick={() => hasChildren ? setIsOpen(!isOpen) : (onClick && onClick())}
      >
        <Link to={hasChildren ? '#' : item.path} className="relative z-10 flex items-center flex-1 gap-3">
          <span className={`transition-colors duration-300 ${isActive ? 'text-ark-primary' : 'text-ark-subtext group-hover:text-ark-text'}`}>
            {item.icon}
          </span>
          <div className="flex flex-col">
             <span className={`text-sm font-bold uppercase transition-colors duration-300 ${isActive ? 'text-ark-text' : 'text-ark-subtext group-hover:text-ark-text'}`}>
               {lang === 'en' ? item.labelEn : item.labelZh}
             </span>
          </div>
        </Link>
        {hasChildren && (
          <ChevronRight 
            size={14} 
            className={`
              relative z-10 transition-transform duration-300 text-ark-subtext
              ${isOpen ? 'rotate-90 text-ark-primary' : ''}
            `} 
          />
        )}
      </div>

      {hasChildren && (
        <div 
          className={`
            grid transition-[grid-template-rows] duration-300 ease-in-out
            ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
          `}
        >
          <div className="overflow-hidden">
            <div className="bg-black/5 dark:bg-black/20 py-1 relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-[1px] bg-ark-border/50" />
              {item.children!.map(child => {
                 const isChildActive = currentPath === child.path;
                 return (
                    <Link 
                      key={child.id} 
                      to={child.path}
                      onClick={onClick}
                      className={`
                        relative block pl-12 py-2 text-xs font-mono uppercase tracking-wide transition-all duration-200 border-r-2
                        ${isChildActive ? 'text-ark-primary bg-ark-active/10 border-ark-primary font-bold' : 'text-ark-subtext hover:text-ark-text border-transparent hover:bg-ark-active/5'}
                      `}
                    >
                      <span className={`mr-2 transition-opacity ${isChildActive ? 'opacity-100 text-ark-primary' : 'opacity-30'}`}>//</span>
                      {lang === 'en' ? child.labelEn : child.labelZh}
                    </Link>
                 );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Layout: React.FC<{ children: React.ReactNode, navItems: NavItem[] }> = ({ children, navItems }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, lang, toggleLang, darkMode, toggleTheme, unreadCount } = useApp();
  const { notify } = useNotification();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    notify('warning', t('notify_logout_title', lang), t('notify_logout_msg', lang));
    setTimeout(() => {
        logout();
    }, 500);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-ark-bg text-ark-text font-sans transition-colors duration-300 overflow-hidden relative selection:bg-ark-primary selection:text-white">
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-[45] md:hidden backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-ark-panel border border-ark-danger/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] relative">
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-ark-danger" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-ark-danger" />
                
                <div className="p-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-ark-danger/10 rounded-full flex items-center justify-center mb-4 text-ark-danger border border-ark-danger/30">
                        <AlertOctagon size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-ark-text mb-2 uppercase tracking-widest">{t('modal_logout_title', lang)}</h3>
                    <p className="text-sm text-ark-subtext font-mono mb-8">{t('modal_logout_msg', lang)}</p>
                    
                    <div className="flex gap-3">
                        <ArkButton variant="ghost" className="flex-1 justify-center" onClick={() => setShowLogoutModal(false)}>
                            {t('modal_cancel', lang)}
                        </ArkButton>
                        <ArkButton variant="danger" className="flex-1 justify-center bg-ark-danger text-white border-none" onClick={confirmLogout}>
                            {t('modal_confirm', lang)}
                        </ArkButton>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 h-full flex flex-col border-r border-ark-border bg-ark-panel transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 shadow-xl md:shadow-none
        `}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-5 border-b border-ark-border bg-ark-panel relative overflow-hidden group">
           <div className="absolute inset-0 bg-ark-active/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
           <div className="w-8 h-8 bg-ark-text text-ark-bg flex items-center justify-center font-bold mr-3 clip-corner-br relative z-10 shrink-0 group-hover:bg-ark-primary group-hover:text-black transition-colors duration-300">
             <Terminal size={18} />
           </div>
           <div className="flex-1 relative z-10 overflow-hidden">
             <h1 className="text-lg font-bold tracking-tighter leading-none text-ark-text whitespace-nowrap group-hover:tracking-widest transition-all duration-300">PRTS HONEYPOT</h1>
             <div className="flex items-center gap-1 mt-0.5">
                 <div className="w-1.5 h-1.5 bg-ark-primary animate-pulse" />
                 <p className="text-[9px] text-ark-subtext tracking-[0.2em] font-mono group-hover:text-ark-primary transition-colors">SYSTEM ONLINE</p>
             </div>
           </div>
           <button className="md:hidden text-ark-subtext hover:text-ark-danger transition-colors" onClick={() => setMobileMenuOpen(false)}>
             <X size={20} />
           </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {navItems.map(item => (
            <SidebarItem key={item.id} item={item} currentPath={location.pathname} onClick={() => setMobileMenuOpen(false)} />
          ))}
        </nav>

        {/* User Status Footer */}
        <div className="p-4 border-t border-ark-border bg-ark-bg/50 flex-shrink-0 relative">
           {/* Decorative Element */}
           <div className="absolute top-0 right-4 w-12 h-[2px] bg-ark-primary/30" />
           <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-ark-primary/20 to-transparent" />
           
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-ark-subtext/20 rounded-sm overflow-hidden border border-ark-border relative group cursor-pointer">
               <div className="w-full h-full flex items-center justify-center text-ark-text font-bold text-xs bg-ark-active/20 group-hover:bg-ark-primary group-hover:text-black transition-colors">ADM</div>
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-bold text-ark-text truncate font-mono tracking-tight">{user.username}</p>
               <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                   <p className="text-[10px] text-ark-primary font-mono tracking-wide">{t('level_admin', lang)}</p>
               </div>
             </div>
             <Hexagon size={16} className="text-ark-subtext/30 animate-spin-slow" />
           </div>
           
           <ArkButton variant="outline" size="sm" className="w-full justify-center group border-ark-border/50 hover:border-ark-danger/50" onClick={handleLogoutClick}>
             <Power size={14} className="mr-2 group-hover:text-ark-danger transition-colors" /> 
             <span className="group-hover:text-ark-danger transition-colors">{t('logout', lang)}</span>
           </ArkButton>
           
           <div className="mt-3 text-[9px] text-ark-subtext text-center font-mono opacity-40 flex justify-center gap-2">
               <span>VER 3.3.9-CLEAN</span>
               <span>::</span>
               <span>BUILD 20251206</span>
           </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* SCI-FI PARTICLE BACKGROUND */}
        <ParticleBackground />

        {/* Topbar */}
        <header className="h-16 flex-shrink-0 border-b border-ark-border flex items-center justify-between px-4 md:px-6 bg-ark-panel/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
             <button className="md:hidden p-2 text-ark-text hover:bg-ark-active rounded transition-colors" onClick={() => setMobileMenuOpen(true)}>
                <Menu size={24} />
             </button>
             {/* Breadcrumb / Current Page Name */}
             <div className="hidden md:flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-ark-subtext">
                 <Grid size={14} className="text-ark-primary" />
                 <span className="text-ark-primary/70">PRTS</span>
                 <ChevronRight size={14} />
                 <span className="text-ark-text font-bold">{location.pathname.split('/')[1] || 'Dashboard'}</span>
             </div>
             {/* Mobile Title */}
             <div className="md:hidden text-sm font-bold uppercase tracking-wider text-ark-text">
                  {location.pathname.split('/')[1] || 'Dashboard'}
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
             {/* Notification Bell */}
             <button 
                onClick={() => navigate('/messages')}
                className="relative p-2 text-ark-text hover:text-ark-primary hover:bg-ark-active/20 rounded-sm transition-colors border border-transparent hover:border-ark-primary/30"
                title={t('mc_title', lang)}
             >
                <Bell size={20} />
                <div 
                    className={`absolute top-1 right-1.5 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center ${unreadCount > 0 ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-90'}`}
                >
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-[1px] bg-ark-danger opacity-75 rotate-45"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 bg-ark-danger border border-ark-panel rotate-45 shadow-[0_0_8px_rgba(255,77,79,0.6)]"></span>
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-[2px] bg-white rounded-full z-10"></span>
                    </span>
                </div>
             </button>

             <div className="flex items-center bg-ark-bg border border-ark-border rounded-sm p-0.5">
                 <button onClick={toggleTheme} className="p-1.5 hover:bg-ark-panel text-ark-subtext hover:text-ark-text transition-colors rounded-sm" title={t('layout_toggle_theme', lang)}>
                   {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                 </button>
                 <div className="w-[1px] h-4 bg-ark-border mx-1" />
                 <button onClick={toggleLang} className="px-2 py-0.5 hover:bg-ark-panel text-ark-subtext hover:text-ark-text transition-colors font-mono text-xs font-bold rounded-sm" title={t('layout_switch_lang', lang)}>
                   {lang === 'en' ? 'EN' : 'ZH'}
                 </button>
             </div>
             <div className="w-[1px] h-8 bg-ark-border hidden sm:block" />
             <RealtimeClock />
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-2 md:p-6 relative z-10 custom-scrollbar flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
};
