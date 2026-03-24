import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, TrendingUp, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useJobStore } from '../store/jobStore';

const UNIFORM_BADGE_STYLE = "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all";

const SUGGESTED_SKILLS = ['Redux', 'AWS', 'Docker', 'GraphQL', 'Next.js', 'TypeScript'];

export default function SmartSuggestions() {
 const { user } = useAuthStore();
 const { setFilter, fetchJobs } = useJobStore();
 const resumeSkills = user?.resumeSkills || [];

 const searchSkill = async (skill) => {
 setFilter('skills', [skill]);
 await fetchJobs();
 };

 return (
 <div className="bg-white dark:bg-white/4 border border-slate-200 dark:border-white/8 shadow-sm dark:shadow-none rounded-2xl p-5 space-y-5">
 {/* Resume Skills */}
 <AnimatePresence>
 {resumeSkills.length > 0 && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
 <div className="flex items-center gap-2 mb-3">
 <TrendingUp className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
 <h3 className="text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">Your Skills</h3>
 </div>
 <div className="flex flex-wrap gap-1.5">
 {resumeSkills.slice(0, 10).map((skill) => (
 <button
 key={skill}
 onClick={() => searchSkill(skill)}
 className={`px-2.5 py-1 rounded-lg text-xs transition-all hover:scale-105 ${UNIFORM_BADGE_STYLE}`}
 >
 {skill}
 </button>
 ))}
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Smart Suggestions */}
 <div>
 <div className="flex items-center gap-2 mb-3">
 <Lightbulb className="w-4 h-4 text-slate-500 dark:text-slate-400" />
 <h3 className="text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">Boost Your Match</h3>
 </div>
 <p className="text-slate-500 dark:text-slate-500 text-xs mb-2.5">Adding these skills to your resume could improve matches:</p>
 <div className="flex flex-wrap gap-1.5">
 {SUGGESTED_SKILLS.map((skill) => (
 <button
 key={skill}
 onClick={() => searchSkill(skill)}
 className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all ${UNIFORM_BADGE_STYLE}`}
 >
 <PlusCircle className="w-3 h-3 text-slate-400 dark:text-slate-500" />
 {skill}
 </button>
 ))}
 </div>
 </div>
 </div>
 );
}
