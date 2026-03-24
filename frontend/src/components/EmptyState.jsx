import { motion } from 'framer-motion';
import { SearchX, RefreshCw, Sparkles } from 'lucide-react';
import { useJobStore } from '../store/jobStore';

const SUGGESTIONS = [
 { label: 'Remote only', filter: { workMode: ['Remote'] } },
 { label: 'High matches', filter: { matchScore: 'high' } },
 { label: 'Full-time', filter: { jobType: ['Full-time'] } },
 { label: 'React roles', filter: { title: 'react', skills: ['React'] } },
];

export default function EmptyState() {
 const { setFilters, resetFilters, fetchJobs } = useJobStore();

 const applySuggestion = async (filter) => {
 setFilters(filter);
 await fetchJobs();
 };

 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex flex-col items-center justify-center py-24 text-center px-4"
 >
 <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6">
 <SearchX className="w-10 h-10 text-slate-400 dark:text-slate-600" />
 </div>
 <h3 className="text-slate-900 dark:text-neutral-200 text-xl font-semibold mb-2">No jobs found</h3>
 <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-xs">
 Your current filters returned no results. Try broadening your search or try one of these:
 </p>

 <div className="flex flex-wrap gap-2 justify-center mb-8">
 {SUGGESTIONS.map((s) => (
 <button
 key={s.label}
 onClick={() => applySuggestion(s.filter)}
 className="flex items-center gap-1.5 px-4 py-2 bg-neutral-100 dark:bg-white/50/10 hover:bg-neutral-100 dark:bg-white/50/20 border border-black dark:border-white/20 text-indigo-300 rounded-xl text-sm transition-all"
 >
 <Sparkles className="w-3.5 h-3.5" />
 {s.label}
 </button>
 ))}
 </div>

 <button
 onClick={async () => { resetFilters(); await fetchJobs(); }}
 className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-sm transition-all"
 >
 <RefreshCw className="w-4 h-4" />
 Reset all filters
 </button>
 </motion.div>
 );
}
