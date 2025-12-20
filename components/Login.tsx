
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArkButton, ArkInput } from './ArknightsUI';
import { Hexagon, Sun, Moon, ChevronsRight, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { useNotification } from './NotificationSystem';
import { ParticleBackground } from './ParticleBackground';

interface LoginProps {
  onLogin: (username: string, password?: string) => Promise<boolean>;
}

// Puzzle Slider Component
const PuzzleCaptcha: React.FC<{ onVerify: (success: boolean) => void, isVerified: boolean }> = ({ onVerify, isVerified }) => {
    const { lang, darkMode } = useApp();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pieceCanvasRef = useRef<HTMLCanvasElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    
    const [sliderValue, setSliderValue] = useState(0); // 0 to 100
    const [targetX, setTargetX] = useState(0);
    const [status, setStatus] = useState<'idle' | 'dragging' | 'success' | 'fail'>('idle');
    const [isHovering, setIsHovering] = useState(false);

    // Drag State
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startLeft = useRef(0);

    // Fixed Dimensions to ensure 1:1 mapping between logic and display
    const width = 280;
    const height = 120;
    const pieceSize = 40;
    const pieceTabSize = 8;
    const handleWidth = 40; // Width of the slider handle button

    // Generate puzzle path
    const drawPuzzlePath = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, s: number) => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        // Top Tab
        ctx.lineTo(x + s/2 - pieceTabSize, y);
        ctx.arc(x + s/2, y - pieceTabSize + 2, pieceTabSize, 0.8 * Math.PI, 2.2 * Math.PI); 
        ctx.lineTo(x + s, y);
        // Right Tab (in)
        ctx.lineTo(x + s, y + s/2 - pieceTabSize);
        ctx.arc(x + s - pieceTabSize + 2, y + s/2, pieceTabSize, 1.5 * Math.PI, 0.5 * Math.PI, true);
        ctx.lineTo(x + s, y + s);
        // Bottom
        ctx.lineTo(x, y + s);
        // Left
        ctx.lineTo(x, y);
        ctx.closePath();
    }, []);

    const initCanvas = useCallback(() => {
        if (!canvasRef.current || !pieceCanvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const pieceCtx = pieceCanvasRef.current.getContext('2d');
        if (!ctx || !pieceCtx) return;

        // Reset
        ctx.clearRect(0, 0, width, height);
        pieceCtx.clearRect(0, 0, width, height);

        // 1. Draw Tech Background
        ctx.fillStyle = darkMode ? '#1a1a1a' : '#f0f2f5';
        ctx.fillRect(0, 0, width, height);
        
        // Random lines
        ctx.strokeStyle = darkMode ? 'rgba(35, 173, 229, 0.2)' : 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        for(let i=0; i<10; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.lineTo(Math.random() * width, Math.random() * height);
            ctx.stroke();
        }
        // Grid
        ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        for(let i=0; i<width; i+=20) ctx.fillRect(i, 0, 1, height);
        for(let i=0; i<height; i+=20) ctx.fillRect(0, i, width, 1);

        // 2. Set Target Position
        const minX = pieceSize + 10; 
        const maxX = width - pieceSize - 10;
        const maxY = height - pieceSize;
        
        const tx = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
        // Use full vertical range
        const ty = Math.floor(Math.random() * (maxY + 1)); 
        setTargetX(tx);

        // --- Draw Decoy Holes (Fake Targets) ---
        const decoyCount = 2;
        for (let i = 0; i < decoyCount; i++) {
            const decoyX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
            let decoyY = 0;
            let attempts = 0;
            // Retry logic to prevent significant overlap with the real target's Y
            do {
                decoyY = Math.floor(Math.random() * (maxY + 1));
                attempts++;
            } while (Math.abs(decoyY - ty) < pieceSize && attempts < 10); 

            if (Math.abs(decoyY - ty) < pieceSize) {
                decoyY = (ty + pieceSize + 20) % maxY;
            }

            ctx.save();
            ctx.fillStyle = darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'; 
            drawPuzzlePath(ctx, decoyX, decoyY, pieceSize);
            ctx.fill();
            ctx.restore();
        }

        // 3. Draw Real Hole on Main Canvas
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        drawPuzzlePath(ctx, tx, ty, pieceSize);
        ctx.fill();
        ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // 4. Draw Piece on Piece Canvas (at x=0)
        pieceCtx.save();
        // Create shape path at 0,0
        drawPuzzlePath(pieceCtx, 0, ty, pieceSize);
        pieceCtx.clip();
        
        // Fill piece with contrasting color/gradient
        const grd = pieceCtx.createLinearGradient(0, ty, pieceSize, ty + pieceSize);
        if (darkMode) {
            grd.addColorStop(0, '#23ade5');
            grd.addColorStop(1, '#1a7fb0');
        } else {
            grd.addColorStop(0, '#333');
            grd.addColorStop(1, '#000');
        }
        pieceCtx.fillStyle = grd;
        pieceCtx.fill();
        
        // Add "KEY" text
        pieceCtx.fillStyle = 'rgba(255,255,255,0.4)';
        pieceCtx.font = 'bold 10px monospace';
        pieceCtx.fillText('KEY', 8, ty + 24);
        
        // Border
        pieceCtx.strokeStyle = '#fff';
        pieceCtx.lineWidth = 2;
        pieceCtx.stroke();
        pieceCtx.restore();
    }, [darkMode, drawPuzzlePath]);

    useEffect(() => {
        initCanvas();
    }, [initCanvas]);

    const handleRefresh = (e?: React.MouseEvent) => {
        e?.preventDefault(); 
        e?.stopPropagation();
        setSliderValue(0);
        setStatus('idle');
        onVerify(false);
        initCanvas();
    };

    // --- Custom Drag Handlers ---
    
    const handlePointerDown = (e: React.PointerEvent) => {
        if (isVerified || status === 'success' || status === 'fail') return;
        
        isDragging.current = true;
        startX.current = e.clientX;
        startLeft.current = sliderValue; // 0-100
        setStatus('dragging');
        
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current || !trackRef.current) return;

        const trackRect = trackRef.current.getBoundingClientRect();
        const maxTravel = trackRect.width - handleWidth;
        
        if (maxTravel <= 0) return;

        const deltaPx = e.clientX - startX.current;
        const startPx = (startLeft.current / 100) * maxTravel;
        let newPx = startPx + deltaPx;
        newPx = Math.max(0, Math.min(newPx, maxTravel));
        const newPercent = (newPx / maxTravel) * 100;
        
        setSliderValue(newPercent);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        
        isDragging.current = false;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

        // Verification Logic
        const maxPieceTravel = width - pieceSize;
        const currentPieceX = (sliderValue / 100) * maxPieceTravel;

        // Tolerance +/- 5px
        if (Math.abs(currentPieceX - targetX) < 5) {
            setStatus('success');
            onVerify(true);
        } else {
            setStatus('fail');
            onVerify(false);
            // Reset and refresh puzzle after delay
            setTimeout(() => {
                setSliderValue(0);
                setStatus('idle');
                initCanvas(); // Automatically generate new puzzle
            }, 500);
        }
    };

    // Visibility Logic
    const showPopup = status === 'dragging' || status === 'fail' || isHovering;

    return (
        <div className="w-full select-none flex flex-col items-center relative z-20">
            {/* Fixed Width Container */}
            <div 
                style={{ width: width }} 
                className="relative group/captcha touch-none"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                
                {/* Popover Container */}
                <div 
                    className={`
                        absolute bottom-10 left-0 w-full z-50
                        transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom
                        ${showPopup ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-90 translate-y-2 invisible pointer-events-none'}
                    `}
                >
                    {/* Canvas Wrapper */}
                    <div className="relative h-[120px] bg-ark-bg border border-ark-border shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden group">
                        <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0" />
                        <canvas 
                            ref={pieceCanvasRef} 
                            width={width} 
                            height={height} 
                            className="absolute inset-0 transition-transform duration-75 ease-linear will-change-transform drop-shadow-[2px_4px_6px_rgba(0,0,0,0.5)]"
                            style={{ transform: `translateX(${(sliderValue / 100) * (width - pieceSize)}px)` }}
                        />
                        
                        {/* Status Overlay */}
                        {status === 'success' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-ark-primary/20 backdrop-blur-[1px] animate-in fade-in duration-300 z-10">
                                <div className="flex flex-col items-center text-ark-text font-bold uppercase tracking-widest text-shadow-sm">
                                    <CheckCircle className="mb-1 text-white drop-shadow-md" />
                                    {t('login_slider_success', lang)}
                                </div>
                            </div>
                        )}
                        {status === 'fail' && (
                            <div className="absolute inset-0 bg-red-500/10 animate-pulse z-10 flex items-center justify-center">
                                <div className="flex flex-col items-center text-red-500 font-bold uppercase tracking-widest text-shadow-sm opacity-80">
                                    <XCircle className="mb-1" />
                                    <span className="text-[10px]">{t('login_error', lang)}</span>
                                </div>
                            </div>
                        )}

                        {/* Refresh Button */}
                        <button 
                            type="button" 
                            onClick={handleRefresh}
                            className="absolute top-2 right-2 p-1.5 text-ark-subtext hover:text-white bg-black/30 hover:bg-ark-primary/80 rounded-sm transition-all opacity-0 group-hover:opacity-100 z-20"
                            title={t('login_refresh', lang)}
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                    <div className="h-4 w-full bg-transparent"></div>
                </div>

                {/* Custom Slider Track */}
                <div 
                    ref={trackRef}
                    className={`relative h-10 bg-black/10 dark:bg-black/30 flex items-center touch-none ${status === 'fail' ? 'animate-shake' : ''}`}
                >
                    {/* Progress Bar */}
                    <div 
                        className={`absolute left-0 top-0 bottom-0 transition-all duration-75 ${status === 'fail' ? 'bg-red-500/50' : 'bg-ark-primary/20'}`} 
                        style={{ width: `${sliderValue}%` }}
                    />
                    
                    {/* Text Hint */}
                    <div className="w-full text-center text-xs font-mono text-ark-subtext pointer-events-none uppercase tracking-widest opacity-70 absolute inset-0 flex items-center justify-center select-none">
                        {status === 'success' ? t('login_system_unlocked', lang) : status === 'fail' ? t('login_error', lang) : t('login_drag_text', lang)}
                    </div>
                    
                    {/* Custom Handle */}
                    <div 
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className={`absolute top-0 bottom-0 w-10 bg-ark-panel border border-ark-border flex items-center justify-center shadow-sm transition-transform duration-75 ease-linear z-10 touch-none 
                            ${status === 'success' ? 'cursor-default' : status === 'dragging' ? 'cursor-grabbing' : 'cursor-grab hover:bg-ark-active/10'}
                        `}
                        style={{ 
                            left: `calc(${sliderValue}% - ${(sliderValue/100) * 40}px)`, 
                            borderColor: status === 'success' ? '#22c55e' : status === 'fail' ? '#ef4444' : 'var(--ark-primary)'
                        }}
                    >
                        {status === 'success' ? (
                            <CheckCircle size={18} className="text-green-500" />
                        ) : status === 'fail' ? (
                            <XCircle size={18} className="text-red-500" />
                        ) : (
                            <ChevronsRight size={18} className={`text-ark-primary ${status === 'dragging' ? 'opacity-100' : 'opacity-70'}`} />
                        )}
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake { animation: shake 0.3s ease-in-out; }
            `}</style>
        </div>
    );
};

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { lang, toggleLang, darkMode, toggleTheme, unreadCount } = useApp();
  const { notify } = useNotification();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [error, setError] = useState('');
  const [clientIp, setClientIp] = useState('SCANNING...');
  
  useEffect(() => {
    const expired = localStorage.getItem('prts_session_expired');
    if (expired) {
      localStorage.removeItem('prts_session_expired');
      notify('error', t('notify_login_failed_title', lang), t('err_session_expired', lang) || 'Session expired, please login again.');
      setError(t('err_session_expired', lang) || 'Session expired, please login again.');
    }
  }, []);
  
  useEffect(() => {
    const timer = setTimeout(() => {
        setClientIp('192.168.142.88');
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isCaptchaVerified) {
        const msg = t('val_captcha_req', lang);
        setError(msg);
        notify('warning', t('notify_login_failed_title', lang), msg);
        return;
    }

    if (username && password) {
      try {
        await (onLogin as any)(username, password);
        notify('success', t('notify_login_success_title', lang), t('notify_login_success_msg', lang));
        
        if (unreadCount > 0) {
            setTimeout(() => {
                notify('warning', t('mc_title', lang), t('unread_alert', lang).replace('{count}', unreadCount.toString()));
            }, 800);
        }
      } catch (err: any) {
        const errMsg = err.message;
        let displayMsg = t('access_denied', lang);
        
        if (errMsg === 'Account locked') {
          displayMsg = t('err_account_locked', lang) || 'Account locked due to too many attempts';
        } else if (errMsg === 'IP not in whitelist') {
          displayMsg = t('err_ip_whitelist', lang) || 'Access denied: IP not in whitelist';
        } else if (errMsg !== 'Authentication failed') {
          displayMsg = errMsg;
        }
        
        setError(displayMsg);
        notify('error', t('notify_login_failed_title', lang), displayMsg);
      }
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-ark-bg flex items-center justify-center relative overflow-hidden transition-colors duration-300">
      <ParticleBackground className="opacity-50" />
      
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20 flex items-center gap-2 md:gap-3">
          <button 
            type="button"
            onClick={toggleTheme} 
            className="p-2 text-ark-subtext hover:text-ark-primary bg-ark-panel/50 border border-ark-border rounded-sm backdrop-blur-sm transition-all hover:bg-ark-active/20"
            title="Toggle Theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            type="button"
            onClick={toggleLang} 
            className="p-2 text-ark-subtext hover:text-ark-primary bg-ark-panel/50 border border-ark-border rounded-sm backdrop-blur-sm transition-all hover:bg-ark-active/20 font-mono font-bold text-xs w-9 h-9 flex items-center justify-center"
            title="Switch Language"
          >
            {lang === 'en' ? 'CN' : 'EN'}
          </button>
      </div>

      {/* Decorative Lines */}
      <div className="absolute top-0 left-4 md:left-10 h-full w-[1px] bg-ark-border opacity-50 pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-full h-[1px] bg-ark-border opacity-50 pointer-events-none" />
      <div className="absolute top-20 right-0 w-16 md:w-32 h-[1px] bg-ark-primary/30 pointer-events-none" />

      <div className="z-10 w-[90%] md:w-full max-w-md p-6 md:p-8 relative mt-[-10vh] md:mt-0">
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

            {/* Slider Captcha */}
            <div>
               <label className="block text-xs font-bold text-ark-subtext mb-2 font-mono uppercase tracking-wider">{t('login_captcha', lang)}</label>
               <PuzzleCaptcha onVerify={setIsCaptchaVerified} isVerified={isCaptchaVerified} />
            </div>

            {error && <p className="text-ark-danger text-xs font-mono blink items-center gap-2 border border-ark-danger/20 bg-ark-danger/5 p-2 flex"><span className="w-1.5 h-1.5 bg-ark-danger rounded-full" /> {error}</p>}

            <div className="pt-4">
              <ArkButton className="w-full h-12 text-base shadow-lg shadow-ark-primary/20" onClick={() => {}} disabled={!isCaptchaVerified}>
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
