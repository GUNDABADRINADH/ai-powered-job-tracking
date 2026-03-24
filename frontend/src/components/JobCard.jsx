import { motion } from 'framer-motion';
import { MapPin, Building2, Clock, Briefcase, Monitor, ExternalLink, CheckCircle } from 'lucide-react';
import MatchBadge from './MatchBadge';

const UNIFORM_BADGE_STYLE = "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10";

function timeAgo(dateStr) {
 const diff = Date.now() - new Date(dateStr).getTime();
 const days = Math.floor(diff / (1000 * 60 * 60 * 24));
 if (days === 0) return 'Today';
 if (days === 1) return 'Yesterday';
 if (days < 7) return `${days}d ago`;
 if (days < 30) return `${Math.floor(days / 7)}w ago`;
 return `${Math.floor(days / 30)}mo ago`;
}

export default function JobCard({ job, onApply, isApplied, index = 0 }) {
 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.3, delay: index * 0.04 }}
 className="group bg-white dark:bg-white/4 hover:bg-slate-50 dark:hover:bg-white/7 border border-slate-200 dark:border-white/8 hover:border-black dark:border-white/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5 flex flex-col"
 >
 {/* Header */}
 <div className="flex items-start justify-between gap-3 mb-3">
 <div className="flex-1 min-w-0">
 <h3 className="text-slate-900 dark:text-neutral-200 font-semibold text-base leading-tight group-hover:text-black dark:text-neutral-200 dark:group-hover:text-neutral-300 dark:hover:text-neutral-200 transition-colors truncate">
 {job.title}
 </h3>
 <div className="flex items-center gap-1.5 mt-1 text-slate-500 dark:text-slate-400 text-sm">
 <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
 <span className="truncate">{job.company}</span>
 </div>
 </div>
 <MatchBadge score={job.match_score} />
 </div>

 {/* Meta chips */}
 <div className="flex flex-wrap gap-2 mb-3">
 <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${UNIFORM_BADGE_STYLE}`}>
 <Briefcase className="w-3.5 h-3.5" />
 {job.jobType}
 </div>
 <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${UNIFORM_BADGE_STYLE}`}>
 <Monitor className="w-3.5 h-3.5" />
 {job.workMode}
 </div>
 <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${UNIFORM_BADGE_STYLE}`}>
 <MapPin className="w-3.5 h-3.5" />
 {job.location}
 </div>
 <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${UNIFORM_BADGE_STYLE}`}>
 <Clock className="w-3.5 h-3.5" />
 {timeAgo(job.postedAt)}
 </div>
 </div>

 {/* Description */}
 <div className="mb-3 flex-1 overflow-y-auto max-h-24 pr-2">
  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
   {job.description}
  </p>
 </div>

 {/* Skills */}
 <div className="flex flex-wrap gap-1.5 mb-4">
 {job.skills?.slice(0, 4).map((skill) => (
 <span key={skill} className={`px-2 py-0.5 rounded text-xs font-medium ${UNIFORM_BADGE_STYLE}`}>
 {skill}
 </span>
 ))}
 {job.skills?.length > 4 && (
 <span className={`px-2 py-0.5 rounded text-xs font-medium ${UNIFORM_BADGE_STYLE}`}>
 +{job.skills.length - 4}
 </span>
 )}
 </div>

 {/* Salary + match explanation */}
 {job.salary && (
 <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-2">{job.salary}</p>
 )}
 {job.match_explanation && (
 <p className="text-slate-600 dark:text-slate-500 text-xs mb-3 italic leading-relaxed line-clamp-2">
 💡 {job.match_explanation}
 </p>
 )}

 {/* Actions */}
 <div className="flex gap-2 mt-auto">
 {isApplied ? (
 <button
 disabled
 className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium cursor-default"
 >
 <CheckCircle className="w-4 h-4" />
 Applied
 </button>
 ) : (
 <button
 onClick={() => onApply(job)}
 className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-white/10"
 >
 <ExternalLink className="w-4 h-4" />
 Apply Now
 </button>
 )}
 </div>
 </motion.div>
 );
}
