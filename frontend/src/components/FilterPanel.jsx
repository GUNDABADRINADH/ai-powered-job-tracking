import { useJobStore } from '../store/jobStore';
import { useAuthStore } from '../store/authStore';
import { Search, X, ChevronDown, Badge } from 'lucide-react';
import { useState } from 'react';

const DEFAULT_SKILLS = [
 'React', 'Node.js', 'Python', 'TypeScript', 'JavaScript',
 'Vue.js', 'Angular', 'Next.js', 'GraphQL', 'PostgreSQL',
 'MongoDB', 'Docker', 'AWS', 'Redux', 'CSS', 'TailwindCSS',
];

const SECTION = ({ title, children }) => {
 const [open, setOpen] = useState(true);
 return (
 <div className="border-b border-slate-200 dark:border-white/5 pb-4 mb-4">
 <button
 onClick={() => setOpen(!open)}
 className="flex items-center justify-between w-full text-left mb-3"
 >
 <span className="text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">{title}</span>
 <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
 </button>
 {open && children}
 </div>
 );
};

const CHECKBOX = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2.5 cursor-pointer group py-1" onClick={onChange}>
      <div
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
          checked ? 'bg-black dark:bg-white border-black dark:border-white' : 'bg-white dark:bg-transparent border-slate-300 dark:border-white/20 group-hover:border-black dark:border-white'
        }`}
      >
        {checked && <svg viewBox="0 0 12 12" className="w-3 h-3 text-white dark:text-black"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </div>
      <span className="text-slate-600 dark:text-slate-400 text-sm group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">{label}</span>
    </label>
);

const RADIO = ({ label, value, current, onChange }) => (
    <label className="flex items-center gap-2.5 cursor-pointer group py-1" onClick={() => onChange(value)}>
      <div
        className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${
          current === value ? 'border-black dark:border-white bg-transparent' : 'bg-white dark:bg-transparent border-slate-300 dark:border-white/20 group-hover:border-black dark:border-white'
        }`}
      >
        {current === value && <div className="w-2 h-2 rounded-full bg-black dark:bg-white" />}
      </div>
      <span className="text-slate-600 dark:text-slate-400 text-sm group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">{label}</span>
    </label>
);

export default function FilterPanel() {
 const { filters, setFilter, resetFilters, fetchJobs } = useJobStore();
 const { user } = useAuthStore();
 
 // Use resume skills if available, otherwise use default skills
 const skillsOptions = user?.resumeSkills && user.resumeSkills.length > 0 
  ? user.resumeSkills 
  : DEFAULT_SKILLS;

 const toggleArray = (key, val) => {
 const arr = filters[key] || [];
 setFilter(key, arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
 };

 const hasActiveFilters = filters.title || filters.skills?.length > 0 ||
 filters.datePosted !== 'anytime' || filters.jobType?.length > 0 ||
 filters.workMode?.length > 0 || filters.location || filters.matchScore !== 'all' || filters.skillsOnly;

 // Apply all resume skills at once
 const applyAllResumeSkills = async () => {
 if (user?.resumeSkills && user.resumeSkills.length > 0) {
 setFilter('skills', user.resumeSkills);
 setTimeout(() => fetchJobs(), 100);
 }
 };

 return (
 <aside className="w-full">
 {/* Header */}
 <div className="flex items-center justify-between mb-5">
 <h2 className="text-slate-900 dark:text-neutral-200 font-semibold text-sm">Filters</h2>
 {hasActiveFilters && (
 <button
 onClick={resetFilters}
 className="flex items-center gap-1 text-xs text-black dark:text-neutral-200 dark:text-neutral-500 dark:text-neutral-400 hover:text-black dark:text-neutral-200 dark:hover:text-neutral-300 dark:hover:text-neutral-200 transition-colors"
 >
 <X className="w-3 h-3" />
 Clear all
 </button>
 )}
 </div>

 {/* Active Filters Display */}
 {hasActiveFilters && (
 <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-lg">
 <div className="flex items-center gap-2 mb-2">
 <Badge className="w-4 h-4 text-blue-600 dark:text-blue-400" />
 <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">Active Filters</p>
 </div>
 <div className="space-y-1.5">
 {filters.title && (
 <div className="flex items-center justify-between px-2 py-1 bg-white dark:bg-white/5 rounded border border-blue-200 dark:border-blue-800/50">
 <span className="text-xs text-slate-700 dark:text-slate-300"><span className="font-medium">Title:</span> {filters.title}</span>
 <button onClick={() => setFilter('title', '')} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
 <X className="w-3 h-3" />
 </button>
 </div>
 )}
 {filters.skills && filters.skills.length > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {filters.skills.map(skill => (
 <div key={skill} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-white/5 rounded text-xs border border-blue-200 dark:border-blue-800/50">
 <span className="text-slate-700 dark:text-slate-300">{skill}</span>
 <button onClick={() => toggleArray('skills', skill)} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
 <X className="w-3 h-3" />
 </button>
 </div>
 ))}
 </div>
 )}
 {filters.jobType && filters.jobType.length > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {filters.jobType.map(type => (
 <div key={type} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-white/5 rounded text-xs border border-blue-200 dark:border-blue-800/50">
 <span className="text-slate-700 dark:text-slate-300">{type}</span>
 <button onClick={() => toggleArray('jobType', type)} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
 <X className="w-3 h-3" />
 </button>
 </div>
 ))}
 </div>
 )}
 {filters.workMode && filters.workMode.length > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {filters.workMode.map(mode => (
 <div key={mode} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-white/5 rounded text-xs border border-blue-200 dark:border-blue-800/50">
 <span className="text-slate-700 dark:text-slate-300">{mode}</span>
 <button onClick={() => toggleArray('workMode', mode)} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
 <X className="w-3 h-3" />
 </button>
 </div>
 ))}
 </div>
 )}
 {filters.location && (
 <div className="flex items-center justify-between px-2 py-1 bg-white dark:bg-white/5 rounded border border-blue-200 dark:border-blue-800/50">
 <span className="text-xs text-slate-700 dark:text-slate-300"><span className="font-medium">Location:</span> {filters.location}</span>
 <button onClick={() => setFilter('location', '')} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
 <X className="w-3 h-3" />
 </button>
 </div>
 )}
 {filters.datePosted && filters.datePosted !== 'anytime' && (
 <div className="flex items-center justify-between px-2 py-1 bg-white dark:bg-white/5 rounded border border-blue-200 dark:border-blue-800/50">
 <span className="text-xs text-slate-700 dark:text-slate-300"><span className="font-medium">Date Posted:</span> {filters.datePosted}</span>
 <button onClick={() => setFilter('datePosted', 'anytime')} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
 <X className="w-3 h-3" />
 </button>
 </div>
 )}
 {filters.matchScore && filters.matchScore !== 'all' && (
 <div className="flex items-center justify-between px-2 py-1 bg-white dark:bg-white/5 rounded border border-blue-200 dark:border-blue-800/50">
 <span className="text-xs text-slate-700 dark:text-slate-300"><span className="font-medium">Match Score:</span> {filters.matchScore}</span>
 <button onClick={() => setFilter('matchScore', 'all')} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
 <X className="w-3 h-3" />
 </button>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Quick Apply Resume Skills */}
 {user?.resumeSkills && user.resumeSkills.length > 0 && (!filters.skills || filters.skills.length === 0) && (
 <button
 onClick={applyAllResumeSkills}
 className="w-full mb-4 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-950/40 transition-all"
 >
 ✓ Match with resume skills ({user.resumeSkills.length})
 </button>
 )}

 {/* Search / Role */}
 <SECTION title="Role / Title">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
 <input
 type="text"
 value={filters.title}
 onChange={(e) => setFilter('title', e.target.value)}
 placeholder="e.g. React Developer"
 className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-200 text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-black dark:ring-white"
 />
 </div>
 </SECTION>

 {/* Skills */}
 <SECTION title="Skills">
 <div className="flex flex-wrap gap-1.5">
 {skillsOptions.map((skill) => {
 const active = filters.skills?.includes(skill);
 return (
 <button
 key={skill}
 onClick={() => toggleArray('skills', skill)}
 className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
 active
 ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-md'
 : 'bg-white dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-neutral-800 dark:border-neutral-200 hover:bg-neutral-100 dark:bg-white/5 dark:hover:bg-white/10 hover:text-black dark:text-neutral-200 dark:hover:text-neutral-300 dark:hover:text-neutral-200'
 }`}
 >
 {skill}
 </button>
 );
 })}
 </div>
 </SECTION>

 {/* Date Posted */}
 <SECTION title="Date Posted">
 {[
 { label: 'Last 24 hours', value: '24h' },
 { label: 'Last week', value: 'week' },
 { label: 'Last month', value: 'month' },
 { label: 'Anytime', value: 'anytime' },
 ].map(({ label, value }) => (
 <RADIO key={value} label={label} value={value} current={filters.datePosted} onChange={(v) => setFilter('datePosted', v)} />
 ))}
 </SECTION>

 {/* Job Type */}
 <SECTION title="Job Type">
 {['Full-time', 'Part-time', 'Contract', 'Internship'].map((type) => (
 <CHECKBOX
 key={type}
 label={type}
 checked={filters.jobType?.includes(type)}
 onChange={() => toggleArray('jobType', type)}
 />
 ))}
 </SECTION>

 {/* Work Mode */}
 <SECTION title="Work Mode">
 {['Remote', 'Hybrid', 'On-site'].map((mode) => (
 <CHECKBOX
 key={mode}
 label={mode}
 checked={filters.workMode?.includes(mode)}
 onChange={() => toggleArray('workMode', mode)}
 />
 ))}
 </SECTION>

 {/* Location */}
 <SECTION title="Location">
 <input
 type="text"
 value={filters.location}
 onChange={(e) => setFilter('location', e.target.value)}
 placeholder="City, state, or region"
 className="w-full px-3 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-200 text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-black dark:ring-white"
 />
 </SECTION>

 {/* Match Score */}
 <SECTION title="Match Score">
 {[
 { label: 'High match (>70%)', value: 'high' },
 { label: 'Medium (40–70%)', value: 'medium' },
 { label: 'All jobs', value: 'all' },
 ].map(({ label, value }) => (
 <RADIO key={value} label={label} value={value} current={filters.matchScore} onChange={(v) => setFilter('matchScore', v)} />
 ))}
 </SECTION>

 {/* Resume Skills Only */}
 <SECTION title="Smart Filtering">
 <CHECKBOX
 label="Show only resume-matched jobs"
 checked={filters.skillsOnly || false}
 onChange={() => setFilter('skillsOnly', !filters.skillsOnly)}
 />
 <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Only display jobs that match your resume skills</p>
 </SECTION>
 </aside>
 );
}
