import { Clock, Calendar } from 'lucide-react';
import { useLiveClock } from '@/hooks/useLiveClock';

export function LiveClockWidget() {
  const { timeString, dateString } = useLiveClock();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300">
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <Calendar className="w-3.5 h-3.5 text-blue-500" />
        <span className="capitalize">{dateString}</span>
      </div>
      <span className="text-slate-300 dark:text-slate-700">|</span>
      <div className="flex items-center gap-1 text-xs font-bold font-numeric text-slate-900 dark:text-white">
        <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
        <span>{timeString}</span>
      </div>
    </div>
  );
}