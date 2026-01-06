import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type DateRange = {
  startDate: Date | null;
  endDate: Date | null;
  label: string;
};

type PresetOption = {
  label: string;
  getValue: () => { startDate: Date; endDate: Date };
};

const presets: PresetOption[] = [
  {
    label: 'Today',
    getValue: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { startDate: today, endDate: end };
    },
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const end = new Date(yesterday);
      end.setHours(23, 59, 59, 999);
      return { startDate: yesterday, endDate: end };
    },
  },
  {
    label: 'Last 7 Days',
    getValue: () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 30 Days',
    getValue: () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'This Month',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last Month',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    },
  },
];

interface DateFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function DateFilter({ value, onChange, className }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustom(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetSelect = (preset: PresetOption) => {
    const { startDate, endDate } = preset.getValue();
    onChange({ startDate, endDate, label: preset.label });
    setIsOpen(false);
    setShowCustom(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      const label = `${start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
      onChange({ startDate: start, endDate: end, label });
      setIsOpen(false);
      setShowCustom(false);
    }
  };

  const handleReset = () => {
    onChange({ startDate: null, endDate: null, label: 'All Time' });
    setCustomStart('');
    setCustomEnd('');
    setIsOpen(false);
    setShowCustom(false);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors text-sm"
      >
        <Calendar className="w-4 h-4 text-slate-500" />
        <span className="text-slate-700 font-medium">{value.label}</span>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden">
          {!showCustom ? (
            <>
              <div className="p-2 space-y-1">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetSelect(preset)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                      value.label === preset.label
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustom(true)}
                  className="w-full text-left px-3 py-2 text-sm rounded-md text-slate-700 hover:bg-slate-50"
                >
                  Custom Range
                </button>
              </div>
              <div className="border-t border-slate-100 p-2">
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-md"
                >
                  <X className="w-3 h-3" />
                  Reset Filter
                </button>
              </div>
            </>
          ) : (
            <div className="p-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCustom(false)}
                  className="flex-1 px-3 py-2 text-sm text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
                >
                  Back
                </button>
                <button
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd}
                  className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function useDateFilter(defaultLabel = 'Last 7 Days') {
  const defaultPreset = presets.find(p => p.label === defaultLabel) || presets[2];
  const { startDate, endDate } = defaultPreset.getValue();

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate,
    endDate,
    label: defaultLabel,
  });

  const filterByDate = <T extends { created_at: string | null }>(items: T[]): T[] => {
    if (!dateRange.startDate || !dateRange.endDate) return items;
    return items.filter(item => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate >= dateRange.startDate! && itemDate <= dateRange.endDate!;
    });
  };

  return { dateRange, setDateRange, filterByDate };
}
