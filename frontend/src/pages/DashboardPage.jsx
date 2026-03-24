import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApplicationStore } from '../store/applicationStore';
import Navbar from '../components/Navbar';
import {
 Briefcase, Clock, CheckCircle2, XCircle, TrendingUp,
 Trash2, ChevronDown, Award, Calendar, MessageSquare, MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['applied', 'interview', 'offer', 'rejected'];

const UNIFORM_COLOR = 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-neutral-200 border border-slate-200 dark:border-white/10';
const UNIFORM_DOT = 'bg-slate-400 dark:bg-white/30';

const STATUS_CONFIG = {
  applied: { label: 'Applied', color: UNIFORM_COLOR, icon: Briefcase, dot: UNIFORM_DOT },
  interview: { label: 'Interview', color: UNIFORM_COLOR, icon: TrendingUp, dot: UNIFORM_DOT },
  offer: { label: 'Offer 🎉', color: UNIFORM_COLOR, icon: Award, dot: UNIFORM_DOT },
  rejected: { label: 'Rejected', color: UNIFORM_COLOR, icon: XCircle, dot: UNIFORM_DOT },
};

function StatusBadge({ status }) {
 const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['applied'];
 const Icon = cfg.icon;
 return (
 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
 <Icon className="w-3 h-3" />
 {cfg.label}
 </span>
 );
}

function TimelineDot({ status, isLast }) {
 const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['applied'];
 return (
 <div className="flex flex-col items-center">
 <div className={`w-3 h-3 rounded-full ${cfg.dot} ring-4 ring-white dark:ring-neutral-900`} />
 {!isLast && <div className="w-0.5 h-8 bg-slate-200 dark:bg-white/10 mt-1" />}
 </div>
 );
}

function ApplicationCard({ app }) {
 const { updateStatus, removeApplication } = useApplicationStore();
 const [expanded, setExpanded] = useState(false);
 const [updating, setUpdating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [statusDate, setStatusDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

 const nextStatuses = STATUS_STEPS.filter((s) => s !== app.status && s !== 'applied');

 const handleStatusClick = (newStatus) => {
    setPendingStatus(newStatus);
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setStatusDate(now.toISOString().slice(0, 16));
  };

  const confirmStatus = async () => {
    const newTime = new Date(statusDate).getTime();
    if (pendingStatus === 'offer' || pendingStatus === 'rejected') {
      const currentRealTime = new Date().getTime();
      if (newTime > currentRealTime) {
        toast.error('Rejection and Offer times cannot exceed the exact current local time');
        return;
      }
    }
    
    if (app.timeline && app.timeline.length > 0) {
      const lastEvent = app.timeline[app.timeline.length - 1];
      const lastTime = new Date(lastEvent.timestamp).getTime();
      
      if (newTime <= lastTime) {
        toast.error('Please enter a valid time strictly after the previous step');
        return;
      }
    }
    setUpdating(true);
    try {
      await updateStatus(app.id, pendingStatus, null, new Date(statusDate).toISOString());
      toast.success(`Status updated to ${STATUS_CONFIG[pendingStatus]?.label}`);
      setPendingStatus(null);
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(false);
    }
  };

const handleDelete = async () => {
  try {
  await removeApplication(app.id);
  toast.success('Application removed');
  } catch {
  toast.error('Failed to remove');
  }
  };

 return (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-white dark:bg-white/4 border border-slate-200 dark:border-white/8 rounded-2xl overflow-hidden hover:border-black dark:border-white/30 dark:hover:border-black dark:border-white/20 transition-all shadow-sm dark:shadow-none"
 >
 {/* Card header */}
 <div
 className="flex items-start justify-between gap-3 px-5 py-4 cursor-pointer"
 onClick={() => setExpanded(!expanded)}
 >
 <div className="flex-1 min-w-0">
 <h3 className="text-slate-900 dark:text-neutral-200 font-semibold text-sm truncate">{app.jobTitle}</h3>
 <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{app.company} • {app.location}</p>
 </div>
 <div className="flex items-center gap-2 flex-shrink-0">
 <StatusBadge status={app.status} />
 <ChevronDown
 className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
 />
 </div>
 </div>

 {/* Applied date strip */}
 <div className="px-5 pb-3 flex items-center gap-1.5 text-slate-500 text-xs">
 <Calendar className="w-3 h-3" />
 Applied {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
 </div>

 {/* Expanded section */}
 <AnimatePresence>
 {expanded && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 className="overflow-hidden"
 >
 <div className="px-5 pb-5 border-t border-slate-100 dark:border-white/5">
 {/* Timeline */}
 <div className="mt-4 mb-5">
 <p className="text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Timeline</p>
 <div className="space-y-0">
 {app.timeline?.map((entry, i) => (
 <div key={i} className="flex gap-3">
 <TimelineDot status={entry.status} isLast={i === app.timeline.length - 1} />
 <div className="pb-4">
 <p className="text-slate-900 dark:text-slate-200 text-sm font-medium">
 {STATUS_CONFIG[entry.status]?.label || entry.status}
 </p>
 <p className="text-slate-600 dark:text-slate-400 text-xs">{entry.note}</p>
 <p className="text-slate-500 dark:text-slate-500 text-xs mt-0.5">
 {new Date(entry.timestamp).toLocaleString('en-US', {
 month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
 })}
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Status actions */}
 {app.status !== 'offer' && app.status !== 'rejected' && (
        <div className="flex flex-col gap-3 mb-3">
          {pendingStatus ? (
            <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                When did this happen?
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="datetime-local"
                  value={statusDate}
                  onChange={(e) => setStatusDate(e.target.value)}
                  max={(() => {const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)})()}
                  className="flex-1 px-3 py-2 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-black dark:ring-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setPendingStatus(null)}
                    className="px-4 py-2 text-sm font-medium bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 rounded-lg transition-colors text-slate-700 dark:text-neutral-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmStatus}
                    disabled={updating}
                    className="px-4 py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((s) => {
                const cfg = STATUS_CONFIG[s];
                const Icon = cfg.icon;
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusClick(s)}
                    disabled={updating}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-50 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white ${cfg.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    Mark as {cfg.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

  {confirmDelete ? (
  <div className="flex items-center gap-2">
  <span className="text-xs text-slate-500 dark:text-slate-400">Remove this application?</span>
  <button
  onClick={handleDelete}
  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
  >
  Yes, Remove
  </button>
  <button
  onClick={() => setConfirmDelete(false)}
  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-neutral-200 transition-colors"
  >
  Cancel
  </button>
  </div>
  ) : (
  <button
  onClick={() => setConfirmDelete(true)}
  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-200"
  >
  <Trash2 className="w-3 h-3" />
  Remove
  </button>
  )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 );
}

export default function DashboardPage() {
 const { applications, fetchApplications, loading } = useApplicationStore();
 const [activeTab, setActiveTab] = useState('all');

 useEffect(() => {
 fetchApplications();
 }, []);


 const filtered = activeTab === 'all'
 ? applications
 : applications.filter((a) => a.status === activeTab);

 const counts = {
 all: applications.length,
 applied: applications.filter((a) => a.status === 'applied').length,
 interview: applications.filter((a) => a.status === 'interview').length,
 offer: applications.filter((a) => a.status === 'offer').length,
 rejected: applications.filter((a) => a.status === 'rejected').length,
 };

 return (
 <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-neutral-200">
 <Navbar />

 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 {/* Header */}
 <div className="mb-8">
 <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-200 mb-1">Application Dashboard</h1>
 <p className="text-slate-500 dark:text-slate-400 text-sm">Track your job applications and career journey</p>
 </div>

 {/* Stats */}
 <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
 {[
 { label: 'Total Applied', tabKey: 'all', count: counts.all, color: 'from-slate-900 to-slate-700 dark:from-white dark:to-neutral-300' },
 { label: 'Applied', tabKey: 'applied', count: counts.applied, color: 'from-slate-700 to-slate-500 dark:from-neutral-200 dark:to-neutral-400' },
 { label: 'Interviews', tabKey: 'interview', count: counts.interview, color: 'from-slate-800 to-slate-600 dark:from-neutral-100 dark:to-neutral-400' },
 { label: 'Offers', tabKey: 'offer', count: counts.offer, color: 'from-black to-slate-800 dark:from-white dark:to-neutral-200' },
 { label: 'Rejected', tabKey: 'rejected', count: counts.rejected, color: 'from-slate-500 to-slate-400 dark:from-neutral-400 dark:to-neutral-600' },
 ].map((stat) => (
 <button
 key={stat.label}
 onClick={() => setActiveTab(stat.tabKey)}
 className={`text-left bg-white dark:bg-white/4 border shadow-sm dark:shadow-none rounded-2xl p-4 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-black dark:ring-white ${
 activeTab === stat.tabKey
 ? 'border-black dark:border-white dark:border-neutral-800 dark:border-neutral-200 ring-1 ring-black dark:ring-white dark:ring-neutral-800 dark:ring-neutral-200 bg-neutral-100/50 dark:bg-white/5 dark:bg-white/10'
 : 'border-slate-200 dark:border-white/8 hover:border-neutral-600 dark:hover:border-neutral-400 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10'
 }`}
 >
 <div className={`text-2xl font-bold bg-gradient-to-r text-transparent bg-clip-text ${stat.color}`}>
 {stat.count}
 </div>
 <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">{stat.label}</p>
 </button>
 ))}
 </div>


 {/* Applications list */}
 {loading ? (
 <div className="space-y-3">
 {[1, 2, 3].map((i) => (
 <div key={i} className="bg-white/3 border border-white/5 rounded-2xl p-5 animate-pulse">
 <div className="flex justify-between mb-3">
 <div className="space-y-2">
 <div className="h-4 bg-white/10 rounded w-48" />
 <div className="h-3 bg-white/5 rounded w-32" />
 </div>
 <div className="h-6 bg-neutral-100 dark:bg-white/50/20 rounded-full w-20" />
 </div>
 </div>
 ))}
 </div>
 ) : filtered.length === 0 ? (
 <div className="text-center py-16">
 <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
 <Briefcase className="w-8 h-8 text-slate-600" />
 </div>
 <h3 className="text-slate-900 dark:text-neutral-200 font-semibold mb-2">
 {activeTab === 'all' ? 'No applications yet' : `No ${activeTab} applications`}
 </h3>
 <p className="text-slate-500 dark:text-slate-400 text-sm">
 {activeTab === 'all'
 ? 'Start applying to jobs and they\'ll appear here'
 : 'No applications with this status yet'}
 </p>
 </div>
 ) : (
 <div className="space-y-3">
 {filtered.map((app) => (
 <ApplicationCard key={app.id} app={app} />
 ))}
 </div>
 )}
 </div>
 </div>
 );
}
