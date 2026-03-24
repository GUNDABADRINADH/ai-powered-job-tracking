import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

export default function ApplyPopup({ job, onConfirm, onDismiss }) {
 const [showDatePicker, setShowDatePicker] = useState(false);
 const [manualDate, setManualDate] = useState(
 new Date().toISOString().split('T')[0]
 );

 if (!job) return null;

 return (
 <AnimatePresence>
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 {/* Backdrop */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={onDismiss}
 className="absolute inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm"
 />

 {/* Modal */}
 <motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 transition={{ type: 'spring', stiffness: 300, damping: 25 }}
 className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl"
 >
 <button
 onClick={onDismiss}
 className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all"
 >
 <X className="w-4 h-4" />
 </button>

 {/* Header */}
 <div className="mb-6">
 <div className="w-12 h-12 bg-neutral-100 dark:bg-white/50/20 border border-black dark:border-white/30 rounded-2xl flex items-center justify-center mb-4">
 <CheckCircle className="w-6 h-6 text-neutral-500 dark:text-neutral-400" />
 </div>
 <h3 className="text-slate-900 dark:text-neutral-200 font-semibold text-lg mb-1">
 Did you apply?
 </h3>
 <p className="text-slate-400 text-sm">
 <span className="text-slate-900 dark:text-neutral-200 font-medium">{job.jobTitle}</span>
 {' '}at{' '}
 <span className="text-black dark:text-neutral-200 dark:text-neutral-200 font-medium">{job.company}</span>
 </p>
 </div>

 {/* Date picker (for "Applied Earlier") */}
 <AnimatePresence>
 {showDatePicker && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="mb-4 p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl"
 >
 <label className="block text-slate-700 dark:text-slate-300 text-sm mb-2">
 <Calendar className="inline w-4 h-4 mr-1.5 text-neutral-500 dark:text-neutral-400" />
 When did you apply?
 </label>
 <input
 type="date"
 value={manualDate}
 max={new Date().toISOString().split('T')[0]}
 onChange={(e) => setManualDate(e.target.value)}
 className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-neutral-200 text-sm focus:outline-none focus:ring-1 focus:ring-black dark:ring-white"
 />
 </motion.div>
 )}
 </AnimatePresence>

 {/* Action buttons */}
 <div className="space-y-2">
        <button
          onClick={() => onConfirm('applied', new Date().toISOString())}
          className="group w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-white/4 border border-slate-200 dark:border-white/10 hover:bg-black dark:hover:bg-white text-slate-800 dark:text-neutral-200 hover:text-white dark:hover:text-black rounded-2xl font-medium transition-all hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-white/10"
        >
          <CheckCircle className="w-5 h-5 group-hover:text-white dark:group-hover:text-black" />
          <div className="text-left">
            <p className="font-semibold">Yes, I applied!</p>
            <p className="text-slate-500 dark:text-slate-400 group-hover:text-neutral-300 dark:group-hover:text-neutral-700 text-xs transition-colors">Track it in your dashboard</p>
          </div>
        </button>

 {showDatePicker ? (
 <button
 onClick={() => onConfirm('applied', new Date(manualDate).toISOString())}
 className="group w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-white/4 border border-slate-200 dark:border-white/10 hover:bg-black dark:hover:bg-white text-slate-800 dark:text-neutral-200 hover:text-white dark:hover:text-black rounded-2xl font-medium transition-all hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-white/10"
 >
 <Calendar className="w-5 h-5 group-hover:text-white dark:group-hover:text-black" />
 <div className="text-left">
 <p className="font-semibold">Save with selected date</p>
 <p className="text-slate-500 dark:text-slate-400 group-hover:text-neutral-300 dark:group-hover:text-neutral-500 text-xs transition-colors">{manualDate}</p>
 </div>
 </button>
 ) : (
 <button
 onClick={() => setShowDatePicker(true)}
 className="group w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-white/4 border border-slate-200 dark:border-white/10 hover:bg-black dark:hover:bg-white text-slate-800 dark:text-neutral-200 hover:text-white dark:hover:text-black rounded-2xl font-medium transition-all hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-white/10"
 >
 <Clock className="w-5 h-5 group-hover:text-white dark:group-hover:text-black" />
 <div className="text-left">
 <p className="font-semibold">Applied earlier</p>
 <p className="text-slate-500 dark:text-slate-400 group-hover:text-neutral-300 dark:group-hover:text-neutral-500 text-xs transition-colors">Pick a date manually</p>
 </div>
 </button>
 )}

 <button
 onClick={onDismiss}
 className="group w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-white/4 border border-slate-200 dark:border-white/10 hover:bg-black dark:hover:bg-white text-slate-800 dark:text-neutral-200 hover:text-white dark:hover:text-black rounded-2xl font-medium transition-all hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-white/10"
 >
 <XCircle className="w-5 h-5 group-hover:text-white dark:group-hover:text-black" />
 <div className="text-left">
 <p className="font-semibold">No, just browsing</p>
 <p className="text-slate-500 dark:text-slate-400 group-hover:text-neutral-300 dark:group-hover:text-neutral-500 text-xs transition-colors">Don't track this one</p>
 </div>
 </button>
 </div>
 </motion.div>
 </div>
 </AnimatePresence>
 );
}
