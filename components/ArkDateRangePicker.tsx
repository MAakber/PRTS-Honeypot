import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, ChevronDown } from 'lucide-react';
import { ArkButton } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';

interface DateRange {
  start: string; // ISO datetime string
  end: string;
}

interface ArkDateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  label?: string;
}

// Helper to format display text
const formatDateDisplay = (isoString: string) => {
  if (!isoString) return '--';
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} ${h}:${min}`;
};

export const ArkDateRangePicker: React.FC<ArkDateRangePickerProps> = ({ value, onChange, className = '', label }) => {
  const { lang } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state if props change while closed
  useEffect(() => {
    if (!isOpen) {
      setTempRange(value);
    }
  }, [value, isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    // Format to datetime-local string (YYYY-MM-DDTHH:mm)
    const toLocalISO = (d: Date) => {
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    }

    setTempRange({
      start: toLocalISO(start),
      end: toLocalISO(end)
    });
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button - Styled to match FilterInput */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center h-[32px] w-full bg-ark-panel
          text-xs font-mono text-ark-text border cursor-pointer transition-all duration-200 select-none group
          ${isOpen ? 'border-ark-primary shadow-[0_0_10px_rgba(35,173,229,0.2)]' : 'border-ark-border hover:border-ark-primary/50'}
        `}
      >
        {label && (
            <div className="px-3 text-xs text-ark-subtext font-mono whitespace-nowrap border-r border-ark-border h-full flex items-center bg-ark-bg/30">
                {label}
            </div>
        )}
        <div className="flex-1 flex items-center justify-between px-3 h-full overflow-hidden bg-transparent">
            <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
              <span className="group-hover:text-ark-primary transition-colors truncate">{formatDateDisplay(value.start)}</span>
              <span className="text-ark-subtext">→</span>
              <span className="group-hover:text-ark-primary transition-colors truncate">{formatDateDisplay(value.end)}</span>
            </div>
            <Calendar size={14} className={`text-ark-subtext transition-colors shrink-0 ml-2 ${isOpen ? 'text-ark-primary' : 'group-hover:text-ark-text'}`} />
        </div>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 md:left-auto md:right-0 mt-1 z-50 w-[300px] bg-ark-panel border border-ark-border shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 p-0 rounded-sm">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-ark-primary" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-ark-primary" />

          {/* Header */}
          <div className="px-4 py-3 border-b border-ark-border flex justify-between items-center">
            <span className="text-sm font-bold text-ark-text">{t('drp_select_range', lang)}</span>
            <Clock size={16} className="text-ark-subtext" />
          </div>

          <div className="p-4 space-y-5">
            {/* Inputs */}
            <div className="space-y-4">
               <div className="space-y-1.5">
                 <label className="text-xs text-ark-subtext font-mono block">{t('drp_start_time', lang)}</label>
                 <div className="relative group">
                    <input 
                      type="datetime-local" 
                      value={tempRange.start}
                      onChange={(e) => setTempRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full bg-ark-bg border border-ark-border px-3 py-2 text-xs font-mono text-ark-text outline-none focus:border-ark-primary transition-colors rounded-sm appearance-none"
                    />
                 </div>
               </div>
               <div className="space-y-1.5">
                 <label className="text-xs text-ark-subtext font-mono block">{t('drp_end_time', lang)}</label>
                 <div className="relative group">
                    <input 
                      type="datetime-local" 
                      value={tempRange.end}
                      onChange={(e) => setTempRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full bg-ark-bg border border-ark-border px-3 py-2 text-xs font-mono text-ark-text outline-none focus:border-ark-primary transition-colors rounded-sm appearance-none"
                    />
                 </div>
               </div>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-2">
                {[1, 7, 30].map(days => (
                  <button 
                    key={days}
                    onClick={() => handlePreset(days)}
                    className="px-2 py-1.5 border border-ark-border hover:border-ark-primary hover:bg-ark-active/10 text-xs text-ark-subtext hover:text-ark-primary transition-all rounded-sm font-mono whitespace-nowrap bg-ark-bg"
                  >
                    {t('drp_last_days', lang).replace('{days}', days.toString())}
                  </button>
                ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 bg-ark-bg/50 border-t border-ark-border flex justify-end gap-3">
             <button 
                onClick={() => setIsOpen(false)}
                className="text-xs text-ark-subtext hover:text-ark-text transition-colors px-3 py-1.5"
             >
                {t('drp_cancel', lang)}
             </button>
             <button 
                onClick={handleApply}
                className="bg-ark-text text-ark-bg hover:brightness-90 px-4 py-1.5 text-xs font-bold rounded-sm transition-colors shadow-sm"
             >
                {t('drp_confirm', lang)}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};