
import React from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';

// --- Types ---
interface ArkProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
  style?: React.CSSProperties;
}

// --- Components ---

export const ArkCard: React.FC<ArkProps & { title?: string, sub?: string, contentClassName?: string, noPadding?: boolean }> = ({ 
  children, 
  className = '', 
  contentClassName = '',
  title, 
  sub,
  noPadding = false,
  onClick,
  style
}) => (
  <div 
    className={`relative bg-ark-panel border border-ark-border transition-all duration-300 flex flex-col group/card hover:border-ark-primary/50 hover:shadow-[0_0_15px_rgba(0,0,0,0.05)] ${onClick ? 'cursor-pointer' : ''} ${className}`}
    onClick={onClick}
    style={style}
  >
    {/* Decorative corners */}
    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-ark-primary opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-ark-primary opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-ark-primary opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-ark-primary opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
    
    {(title || sub) && (
        <div className="flex items-center justify-between border-b border-ark-border p-3 bg-ark-bg/30">
            <div className="flex items-baseline gap-2">
                {title && <h3 className="text-sm font-bold text-ark-text uppercase tracking-widest leading-none">{title}</h3>}
                {sub && <span className="text-[10px] font-mono text-ark-subtext leading-none">{sub}</span>}
            </div>
            {/* Decor Line */}
            <div className="flex gap-1">
                <div className="w-1 h-1 bg-ark-subtext/30 rounded-full" />
                <div className="w-1 h-1 bg-ark-subtext/30 rounded-full" />
                <div className="w-1 h-1 bg-ark-primary/50 rounded-full" />
            </div>
        </div>
    )}
    <div className={`relative z-10 text-ark-text flex-1 min-w-0 ${noPadding ? '' : 'p-4'} ${contentClassName}`}>
      {children}
    </div>
  </div>
);

export const ArkButton: React.FC<ArkProps & { variant?: 'primary' | 'danger' | 'ghost' | 'outline', size?: 'sm' | 'md' | 'lg', loading?: boolean, disabled?: boolean }> = ({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled = false
}) => {
  const baseStyle = "relative font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center clip-corner-br group select-none overflow-hidden active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variants = {
    primary: "bg-ark-primary text-black hover:brightness-110 shadow-[0_2px_0_rgba(0,0,0,0.2)]",
    danger: "bg-ark-danger text-white hover:brightness-110",
    ghost: "bg-transparent text-ark-subtext hover:text-ark-primary hover:bg-ark-active/30",
    outline: "bg-transparent border border-ark-border text-ark-text hover:border-ark-primary hover:text-ark-primary hover:bg-ark-active/10"
  };

  const sizes = {
    sm: "px-3 py-1 text-xs h-7",
    md: "px-6 py-2 text-sm h-9",
    lg: "px-8 py-3 text-base h-12"
  };

  const handleClick = (e: React.MouseEvent) => {
      if (disabled || loading) {
          e.preventDefault();
          return;
      }
      if (onClick) onClick();
  };

  return (
    <button onClick={handleClick} className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading}>
        <span className="relative z-10 flex items-center gap-2">
            {loading && <Loader2 className="animate-spin" size={14} />}
            {children}
        </span>
        {/* Hover slide effect */}
        {variant !== 'ghost' && !loading && !disabled && (
             <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
        )}
    </button>
  );
};

export const ArkBadge: React.FC<{ type: 'info' | 'warn' | 'error' | 'success' | 'neutral', children: React.ReactNode, className?: string }> = ({ type, children, className = '' }) => {
  const styles = {
    info: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    warn: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    error: "bg-red-500/10 text-red-500 border-red-500/30",
    success: "bg-green-500/10 text-green-500 border-green-500/30",
    neutral: "bg-ark-subtext/10 text-ark-subtext border-ark-subtext/30",
  };

  return (
    <span className={`px-2 py-0.5 text-[10px] font-mono border rounded-sm font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${styles[type]} ${className}`}>
      {children}
    </span>
  );
};

export const ArkInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <div className="relative group w-full">
    <input 
      {...props}
      className={`w-full bg-ark-bg border-b-2 border-ark-border px-3 py-2 text-sm text-ark-text focus:outline-none focus:border-ark-primary transition-colors font-mono placeholder-ark-subtext/40 ${props.className}`}
    />
    {/* Active indicator */}
    <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-ark-primary group-focus-within:w-full transition-all duration-300" />
  </div>
);

// Consistent Page Header
export const ArkPageHeader: React.FC<{ icon: React.ReactNode, title: string, subtitle?: string, extra?: React.ReactNode }> = ({ icon, title, subtitle, extra }) => (
    <div className="bg-ark-panel border-b border-ark-border p-4 sticky top-0 z-30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-ark-active/20 flex items-center justify-center text-ark-primary clip-corner-br border border-ark-primary/20">
                {icon}
            </div>
            <div>
                <h1 className="text-xl font-bold text-ark-text uppercase tracking-wider leading-none">{title}</h1>
                {subtitle && <p className="text-xs text-ark-subtext font-mono mt-1">{subtitle}</p>}
            </div>
        </div>
        {extra && <div className="flex items-center gap-2">{extra}</div>}
    </div>
);

// Hexagon used for Attack Chain visualization
export const ArkHexagon: React.FC<{ 
    label: string, 
    value?: number | string, 
    icon?: React.ReactNode, 
    color?: string,
    size?: 'sm' | 'md' | 'lg',
    onClick?: () => void,
    className?: string
}> = ({ label, value, icon, color = 'var(--ark-primary)', size = 'md', onClick, className = '' }) => {
    
    const sizeClasses = {
        sm: 'w-16 h-16 text-xs',
        md: 'w-24 h-24 text-sm',
        lg: 'w-32 h-32 text-base'
    };

    return (
        <div 
            className={`relative flex items-center justify-center ${sizeClasses[size]} group ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
        >
             {/* Hexagon Shape SVG */}
             <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-md transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(35,173,229,0.5)]">
                 <path d="M50 0 L93.3 25 V75 L50 100 L6.7 75 V25 Z" fill="var(--ark-panel)" stroke={color} strokeWidth="1.5" className="group-hover:stroke-2 transition-all" />
             </svg>
             
             {/* Content */}
             <div className="relative z-10 flex flex-col items-center justify-center text-center p-2">
                 {icon && <div className="mb-1 text-ark-subtext group-hover:text-ark-primary transition-colors">{icon}</div>}
                 {value !== undefined && <span className="font-bold text-ark-text font-mono text-lg leading-none group-hover:scale-110 transition-transform">{value}</span>}
                 <span className="text-[9px] text-ark-subtext font-mono uppercase mt-1 leading-tight tracking-tight">{label}</span>
             </div>
        </div>
    );
};
