import { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useJobStore } from '../store/jobStore';
import { useApplicationStore } from '../store/applicationStore';
import { useAuthStore } from '../store/authStore';
import { getUserLocationCity } from '../services/geolocationService';
import Navbar from '../components/Navbar';
import FilterPanel from '../components/FilterPanel';
import JobCard from '../components/JobCard';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import ApplyPopup from '../components/ApplyPopup';
import QuickFilterChips from '../components/QuickFilterChips';
import SmartSuggestions from '../components/SmartSuggestions';
import { Trophy, SlidersHorizontal, X, RefreshCw, Zap, Badge, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function JobFeedPage() {
 const { jobs, bestMatches, total, loading, loadingmore, fetchJobs, loadMoreManual, filters, setFilters } = useJobStore();
 const { pendingApply, setPendingApply, clearPendingApply, addApplication, isApplied } = useApplicationStore();
 const { user } = useAuthStore();
 const [filterOpen, setFilterOpen] = useState(false);
 const [locationStatus, setLocationStatus] = useState(''); // 'detecting', 'detected', 'error'
 const mainContentRef = useRef(null);
 const locationDetectedRef = useRef(false);

 // Initial load with auto location detection
 useEffect(() => {
 const initializeJobFeed = async () => {
 // If already initialized (e.g. navigated here from ResumePage after fetchJobs),
 // skip re-init so we don't overwrite a fresh resume-based fetch.
 if (locationDetectedRef.current) {
 return;
 }

 // Priority 1: Get location from resume if available
 if (user?.resumeLocation) {
 console.log('📍 Using location from resume:', user.resumeLocation);
 setLocationStatus('detected');
 setFilters({ location: user.resumeLocation });
 toast.success(`📍 Showing jobs in ${user.resumeLocation} and nearby areas`, {
 duration: 3,
 });
 locationDetectedRef.current = true;
 // Triggers manual fetch since filter changes only apply locally
 fetchJobs();
 return;
 }

 // Priority 2: Try to get user's browser location as fallback
 setLocationStatus('detecting');
 const city = await getUserLocationCity();
 
 if (city) {
 console.log('📍 Auto-detected location from browser:', city);
 setLocationStatus('detected');
 setFilters({ location: city });
 toast.success(`📍 Showing jobs in ${city}`, {
 duration: 3,
 });
 } else {
 console.log('⚠️ Could not detect location');
 setLocationStatus('error');
 }

 locationDetectedRef.current = true;
 fetchJobs();
 };

 initializeJobFeed();
 }, [user]);

 // Auto-load skills from resume if available and no skills filter set
 const applyResumeSkills = async () => {
 if (user?.resumeSkills && user.resumeSkills.length > 0 && (!filters.skills || filters.skills.length === 0)) {
 setFilters({ skills: user.resumeSkills });
 await fetchJobs();
 toast.success(`Applied ${user.resumeSkills.length} skills from your resume!`);
 }
 };

 // Debounced filter fetch (LOCAL FILTERING ONLY)
 useEffect(() => {
 const timer = setTimeout(() => useJobStore.getState().applyLocalFilters(), 300);
 return () => clearTimeout(timer);
 }, [filters]);

 // Infinite scroll - auto-load batches when scrolling
 useEffect(() => {
 const handleScroll = () => {
 if (!mainContentRef.current) return;
 
 const element = mainContentRef.current;
 const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 300;
 
 if (isNearBottom && !loading && !loadingmore) {
 loadMoreManual();
 }
 };

 const element = mainContentRef.current;
 if (element) {
 element.addEventListener('scroll', handleScroll);
 return () => element.removeEventListener('scroll', handleScroll);
 }
 }, [loading, loadingmore, loadMoreManual]);

 // Sort and categorize jobs
 const { unappliedBest, unappliedRest, appliedList } = useMemo(() => {
 const jobIds = new Set(jobs.map(j => j.id));
 
 // Filter bestMatches to exclude any already in jobs array
 const uniqueBestMatches = bestMatches.filter(j => !jobIds.has(j.id));
 
 const map = new Map();
 // Mark best matches
 uniqueBestMatches.forEach(j => map.set(j.id, { ...j, isBestMatch: true }));
 // Add all regular jobs
 jobs.forEach(j => {
 map.set(j.id, { ...j, isBestMatch: uniqueBestMatches.some(bm => bm.id === j.id) });
 });

 const all = Array.from(map.values());
 
 // Sort all by match_score DESC
 all.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

 const uBest = [];
 const uRest = [];
 const appList = [];

 all.forEach(j => {
 if (isApplied(j.id)) {
 appList.push(j);
 } else if (j.isBestMatch) {
 uBest.push(j);
 } else {
 uRest.push(j);
 }
 });

 return { unappliedBest: uBest, unappliedRest: uRest, appliedList: appList };
 }, [jobs, bestMatches, isApplied]);

 // Handle Apply click
 const handleApply = (job) => {
 // Open external link in new tab
 window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
 // Set pending apply
 setPendingApply({
 jobId: job.id,
 jobTitle: job.title,
 company: job.company,
 location: job.location,
 applyUrl: job.applyUrl,
 });
 };

 // Handle popup confirm
 const handleConfirmApply = async (status, appliedAt) => {
 try {
 await addApplication(pendingApply, appliedAt);
 toast.success(`Application tracked for ${pendingApply.jobTitle}!`);
 } catch {
 toast.error('Failed to save application');
 } finally {
 clearPendingApply();
 }
 };

 return (
 <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-neutral-200 pb-12 flex flex-col">
 <Navbar />

 <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0 min-h-0">
 {/* Page Header */}
 <div className="mb-6 flex-shrink-0">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-200">Job Feed</h1>
 <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
 {loading ? 'Loading...' : `${total} opportunities found`}
 </p>
 </div>
 <div className="flex items-center gap-2">
 {/* Refresh button */}
 <button
 onClick={fetchJobs}
 disabled={loading}
 className="hidden sm:flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-all"
 title="Refresh jobs"
 >
 <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
 Refresh
 </button>
 {/* Mobile filter toggle */}
 <button
 onClick={() => setFilterOpen(!filterOpen)}
 className="sm:hidden flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm"
 >
 {filterOpen ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
 {filterOpen ? 'Close Filters' : 'Filters'}
 </button>
 </div>
 </div>

 {/* Resume Skills Banner */}
 {user?.resumeSkills && user.resumeSkills.length > 0 && filters.skills && filters.skills.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 className="mb-4 px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg flex items-start gap-3"
 >
 <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
 <div className="flex-1">
 <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">
 Filtered by resume skills
 </p>
 <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
 Showing jobs matched to {filters.skills.length} skill{filters.skills.length !== 1 ? 's' : ''} from your resume
 </p>
 </div>
 <button
 onClick={() => { setFilters({ skills: [] }); fetchJobs(); }}
 className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
 >
 Clear
 </button>
 </motion.div>
 )}

 {/* Auto-Detected Location Banner */}
 {locationStatus === 'detected' && filters.location && (
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 className="mb-4 px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800/50 rounded-lg flex items-start gap-3"
 >
 <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
 <div className="flex-1">
 <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
 📍 {user?.resumeLocation ? 'Location from resume' : 'Auto-detected location'}
 </p>
 <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
 Showing jobs in {filters.location} {user?.resumeLocation ? 'and nearby areas' : ''} from your resume. To see jobs from other locations, update the location filter below.
 </p>
 </div>
 </motion.div>
 )}

 {/* Quick filter chips */}
 <div className="mt-4">
 <QuickFilterChips />
 </div>
 </div>

 <div className="flex gap-6 flex-1 min-h-0 pb-6 relative overflow-hidden">
 {/* Sidebar filters */}
 <aside className={`${filterOpen ? 'flex' : 'hidden'} sm:flex flex-col w-full sm:w-64 lg:w-72 flex-shrink-0 overflow-y-auto custom-scrollbar pr-2 pb-6 block sm:relative absolute z-10 sm:z-0 bg-slate-50 dark:bg-neutral-950 sm:bg-transparent h-full sm:h-auto`}>
 <div className="bg-white dark:bg-white/4 border border-slate-200 dark:border-white/8 shadow-sm dark:shadow-none rounded-2xl p-5 mb-4">
 <FilterPanel />
 </div>
 <SmartSuggestions />
 </aside>

 {/* Main content */}
 <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar pr-2 pb-6" ref={mainContentRef}>
 {loading && unappliedBest.length === 0 && unappliedRest.length === 0 && appliedList.length === 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
 {Array.from({ length: 6 }).map((_, i) => (
 <SkeletonCard key={i} />
 ))}
 </div>
 ) : unappliedBest.length === 0 && unappliedRest.length === 0 && appliedList.length === 0 ? (
 <EmptyState />
 ) : (
 <div className={`transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
 {/* Best Matches section */}
 {unappliedBest.length > 0 && (
 <motion.section
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="mb-8 mt-2"
 >
 <div className="flex items-center gap-2 mb-4">
 <div className="w-7 h-7 bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center justify-center">
 <Trophy className="w-4 h-4 text-amber-400" />
 </div>
 <h2 className="text-slate-900 dark:text-neutral-200 font-semibold">Best Matches</h2>
 <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25 rounded-full text-xs">
 {unappliedBest.length} jobs
 </span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
 {unappliedBest.map((job, i) => (
 <JobCard
 key={job.id}
 job={job}
 index={i}
 onApply={handleApply}
 isApplied={false}
 />
 ))}
 </div>
 </motion.section>
 )}

 {/* All jobs */}
 {(unappliedRest.length > 0 || appliedList.length > 0) && (
 <div>
 <div className="flex items-center gap-2 mb-4">
 <h2 className="text-slate-900 dark:text-neutral-200 font-semibold">
 {unappliedBest.length > 0 ? 'More Jobs' : 'All Jobs'}
 </h2>
 <span className="px-2 py-0.5 bg-neutral-100 dark:bg-white/5 dark:bg-neutral-100 dark:bg-white/50/15 text-black dark:text-neutral-200 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 dark:border-black dark:border-white/25 rounded-full text-xs">
 {unappliedRest.length + appliedList.length}
 </span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
 {[...unappliedRest, ...appliedList].map((job, i) => (
 <JobCard
 key={job.id}
 job={job}
 index={i}
 onApply={handleApply}
 isApplied={isApplied(job.id)}
 />
 ))}
 </div>
 </div>
 )}

 {/* Loading more indicator */}
 {loadingmore && (
 <div className="flex justify-center items-center gap-2 py-8">
 <div className="flex gap-1">
 <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" />
 <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
 <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
 </div>
 <span className="text-slate-500 dark:text-slate-400 text-xs">Loading more jobs...</span>
 </div>
 )}
 </div>
 )}
 </main>
 </div>
 </div>

 {/* Apply confirmation popup */}
 {pendingApply && (
 <ApplyPopup
 job={pendingApply}
 onConfirm={handleConfirmApply}
 onDismiss={clearPendingApply}
 />
 )}
 </div>
 );
}
