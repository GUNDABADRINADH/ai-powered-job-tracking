export default function SkeletonCard() {
 return (
 <div className="bg-white dark:bg-white/3 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none rounded-2xl p-5 animate-pulse">
 <div className="flex justify-between mb-3">
 <div className="space-y-2 flex-1 mr-4">
 <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4" />
 <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-1/2" />
 </div>
 <div className="h-5 bg-neutral-100 dark:bg-white/50/10 dark:bg-neutral-100 dark:bg-white/50/20 rounded-full w-20" />
 </div>
 <div className="flex gap-2 mb-3">
 <div className="h-5 bg-slate-100 dark:bg-white/5 rounded w-16" />
 <div className="h-5 bg-slate-100 dark:bg-white/5 rounded w-20" />
 <div className="h-5 bg-slate-100 dark:bg-white/5 rounded w-24" />
 </div>
 <div className="space-y-2 mb-4">
 <div className="h-3 bg-slate-100 dark:bg-white/5 rounded" />
 <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-5/6" />
 </div>
 <div className="flex gap-1 mb-4">
 {[1, 2, 3].map((i) => (
 <div key={i} className="h-5 bg-slate-100 dark:bg-white/5 rounded w-14" />
 ))}
 </div>
 <div className="h-10 bg-neutral-100 dark:bg-white/50/5 dark:bg-neutral-100 dark:bg-white/50/10 rounded-xl" />
 </div>
 );
}
