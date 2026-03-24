export default function MatchBadge({ score }) {
 if (score === undefined || score === null) return null;

 let colorClass, label;

 if (score > 70) {
 colorClass = 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30';
 label = `${score}% Match`;
 } else if (score >= 40) {
 colorClass = 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
 label = `${score}% Match`;
 } else {
 colorClass = 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30';
 label = `${score}% Match`;
 }

 return (
 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
 {label}
 </span>
 );
}
