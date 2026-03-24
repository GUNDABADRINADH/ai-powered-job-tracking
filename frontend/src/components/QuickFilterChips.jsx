import { useJobStore } from '../store/jobStore';
import { Zap } from 'lucide-react';

const QUICK_FILTERS = [
 { label: '🌎 Remote', key: 'workMode', value: 'Remote', isArray: true },
 { label: '⚡ Last 24h', key: 'datePosted', value: '24h', isArray: false },
 { label: '🎯 High Match', key: 'matchScore', value: 'high', isArray: false },
 { label: '⏱️ Full-time', key: 'jobType', value: 'Full-time', isArray: true },
 { label: '🏢 Hybrid', key: 'workMode', value: 'Hybrid', isArray: true },
];

export default function QuickFilterChips() {
 const { filters, setFilter, fetchJobs } = useJobStore();

 const isActive = (f) => {
 if (f.isArray) return (filters[f.key] || []).includes(f.value);
 return filters[f.key] === f.value;
 };

 const toggle = async (f) => {
 if (f.isArray) {
 const arr = filters[f.key] || [];
 setFilter(f.key, arr.includes(f.value) ? arr.filter((v) => v !== f.value) : [...arr, f.value]);
 } else {
 const current = filters[f.key];
 const fallback = f.key === 'matchScore' ? 'all' : 'anytime';
 setFilter(f.key, current === f.value ? fallback : f.value);
 }
 await fetchJobs();
 };

 return (
 <div className="flex items-center gap-2 flex-wrap">
 <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium flex-shrink-0">
 <Zap className="w-3.5 h-3.5" />
 Quick:
 </div>
 {QUICK_FILTERS.map((f) => {
 const active = isActive(f);
 return (
 <button
 key={`${f.key}-${f.value}`}
 onClick={() => toggle(f)}
 className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
 active
 ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-sm'
 : 'bg-white dark:bg-white/4 border border-slate-200 dark:border-white/8 text-slate-600 dark:text-slate-400 hover:border-black dark:border-white/40 hover:text-slate-900 dark:hover:text-slate-200 shadow-sm dark:shadow-none'
 }`}
 >
 {f.label}
 </button>
 );
 })}
 </div>
 );
}
