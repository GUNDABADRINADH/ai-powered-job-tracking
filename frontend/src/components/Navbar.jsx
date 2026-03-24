import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import {
 Briefcase, LayoutDashboard, FileText, Sun, Moon,
 LogOut, Menu, X, User
} from 'lucide-react';

export default function Navbar() {
 const { darkMode, toggleDark } = useUiStore();
 const { user, logout } = useAuthStore();
 const navigate = useNavigate();
 const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const getInitials = (name) => {
    if (!name) return null;
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

 const handleLogout = () => {
 logout();
 navigate('/login');
 };

 const links = [
 { to: '/jobs', label: 'Job Feed', icon: Briefcase },
 { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
 { to: '/resume', label: 'Resume', icon: FileText },
 ];

 return (
 <nav className="sticky top-0 z-40 bg-white/80 dark:bg-white/4 backdrop-blur-xl border-b border-slate-200 dark:border-white/8">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16">
 {/* Logo */}
 <Link to="/jobs" className="flex items-center gap-2.5">
 <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
 <Briefcase className="w-4 h-4 text-white dark:text-black" />
 </div>
 <span className="text-slate-900 dark:text-neutral-200 font-bold text-lg">
 Job<span className="text-black dark:text-neutral-200 dark:text-neutral-500 dark:text-neutral-400">Tracker</span>
 <span className="text-xs text-black dark:text-neutral-200 ml-1 font-normal">AI</span>
 </span>
 </Link>

 {/* Desktop nav */}
 <div className="hidden md:flex items-center gap-1">
 {links.map(({ to, label, icon: Icon }) => (
 <Link
 key={to}
 to={to}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
 location.pathname === to
 ? 'bg-neutral-100 dark:bg-white/5 dark:bg-neutral-100 dark:bg-white/50/20 text-black dark:text-neutral-200 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 dark:border-black dark:border-white/30'
 : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
 }`}
 >
 <Icon className="w-4 h-4" />
 {label}
 </Link>
 ))}
 </div>

 {/* Right side */}
 <div className="flex items-center gap-2 relative">
 {/* Dark mode toggle */}
 <button
 onClick={toggleDark}
 className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
 >
 {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
 </button>

 {/* User avatar */}
 <div className="hidden md:flex items-center gap-3">
 <div className="text-right">
 <p className="text-slate-900 dark:text-neutral-200 text-sm font-medium">{user?.name}</p>
 <p className="text-slate-500 text-xs">{user?.email}</p>
 </div>
  <div className="w-9 h-9 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black text-sm font-bold tracking-wider">
  {user?.name ? getInitials(user.name) : <User className="w-4 h-4" />}
  </div>
 <button
 onClick={() => setShowLogoutConfirm(true)}
 className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all"
 title="Logout"
 >
 <LogOut className="w-4 h-4" />
 </button>
 </div>

 {/* Mobile menu */}
 <button
 className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
 onClick={() => setMenuOpen(!menuOpen)}
 >
 {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
 </button>

 {/* Logout confirmation popup (Desktop & Mobile) */}
 <AnimatePresence>
 {showLogoutConfirm && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="absolute top-12 right-0 w-64 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 z-50 origin-top-right"
 >
 <h4 className="text-slate-900 dark:text-neutral-200 font-medium mb-1">Confirm Logout</h4>
 <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Are you sure you want to sign out?</p>
 <div className="flex gap-2 justify-end">
 <button
 onClick={() => setShowLogoutConfirm(false)}
 className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={() => {
 setShowLogoutConfirm(false);
 handleLogout();
 }}
 className="px-3 py-1.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
 >
 Logout
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 </div>

 {/* Mobile dropdown */}
 <AnimatePresence>
 {menuOpen && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="md:hidden border-t border-slate-200 dark:border-white/5 bg-white/95 dark:bg-slate-950/95 px-4 py-4 space-y-2"
 >
 {links.map(({ to, label, icon: Icon }) => (
 <Link
 key={to}
 to={to}
 onClick={() => setMenuOpen(false)}
 className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
 location.pathname === to
 ? 'bg-neutral-100 dark:bg-white/5 dark:bg-neutral-100 dark:bg-white/50/20 text-black dark:text-neutral-200 dark:text-neutral-200'
 : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
 }`}
 >
 <Icon className="w-4 h-4" />
 {label}
 </Link>
 ))}
 <button
 onClick={() => { setMenuOpen(false); setShowLogoutConfirm(true); }}
 className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 w-full"
 >
 <LogOut className="w-4 h-4" />
 Sign Out
 </button>
 </motion.div>
 )}
 </AnimatePresence>
 </nav>
 );
}
