import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Briefcase, Mail, Lock, Eye, EyeOff, Sparkles, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
 const { login, register } = useAuthStore();
 const navigate = useNavigate();
 const [isRegister, setIsRegister] = useState(false);
 
 // Login state
 const [email, setEmail] = useState('test@gmail.com');
 const [password, setPassword] = useState('test@123');
 
 // Register state
 const [name, setName] = useState('');
 const [regEmail, setRegEmail] = useState('');
 const [regPassword, setRegPassword] = useState('');
 const [regConfirmPassword, setRegConfirmPassword] = useState('');
 
 const [showPass, setShowPass] = useState(false);
 const [loading, setLoading] = useState(false);

 const handleLogin = async (e) => {
 e.preventDefault();
 setLoading(true);
 try {
 const user = await login(email, password);
 toast.success(`Welcome back, ${user.name}!`);
 if (!user.resumeFileName) {
 navigate('/resume');
 } else {
 navigate('/jobs');
 }
 } catch (err) {
 toast.error(err.response?.data?.error || 'Login failed. Check your credentials.');
 } finally {
 setLoading(false);
 }
 };

 const handleRegister = async (e) => {
 e.preventDefault();
 if (regPassword !== regConfirmPassword) {
 toast.error('Passwords do not match');
 return;
 }
 if (regPassword.length < 6) {
 toast.error('Password must be at least 6 characters');
 return;
 }
 setLoading(true);
 try {
 const user = await register(name, regEmail, regPassword);
 toast.success(`Welcome, ${user.name}! Please upload your resume.`);
 navigate('/resume');
 } catch (err) {
 toast.error(err.response?.data?.error || 'Registration failed. Try another email.');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-gradient-to-br transition-colors duration-300 from-slate-50 via-neutral-100 to-slate-100 dark:from-black dark:via-neutral-900 dark:to-black flex items-center justify-center p-4">
 {/* Animated orbs */}
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 <div className="absolute -top-40 -right-40 w-80 h-80 bg-neutral-300 dark:bg-white rounded-full opacity-10 blur-3xl animate-pulse" />
 <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-neutral-400 dark:bg-white rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
 </div>

 <motion.div
 initial={{ opacity: 0, y: 20, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 transition={{ duration: 0.5 }}
 className="relative w-full max-w-md"
 >
 {/* Card */}
 <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-300/50 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
 {/* Logo */}
 <div className="flex items-center gap-3 justify-center mb-8">
 <div className="w-12 h-12 bg-black dark:bg-white rounded-2xl flex items-center justify-center shadow-lg">
 <Briefcase className="w-6 h-6 text-white dark:text-black" />
 </div>
 <div>
 <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-200">JobTracker AI</h1>
 <p className="text-slate-600 dark:text-neutral-300 text-xs font-medium">Powered by intelligence</p>
 </div>
 </div>

 {/* Badge */}
 <div className="flex items-center gap-2 bg-transparent dark:bg-white/5 border border-slate-300 dark:border-white/20 rounded-xl px-4 py-2 mb-6">
 <Sparkles className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
 <p className="text-black dark:text-neutral-200 dark:text-neutral-200 font-medium text-sm">AI-powered job matching & tracking</p>
 </div>

 <h2 className="text-xl font-semibold text-slate-900 dark:text-neutral-200 mb-2">
 {isRegister ? 'Create Account' : 'Welcome back'}
 </h2>
 <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
 {isRegister 
 ? 'Register to get started with AI job matching'
 : 'Sign in to access your job dashboard'
 }
 </p>

 {isRegister ? (
 // REGISTRATION FORM
 <form onSubmit={handleRegister} className="space-y-4">
 {/* Name */}
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
 <div className="relative">
 <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 required
 placeholder="John Doe"
 className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-black dark:ring-white focus:border-transparent transition-all"
 />
 </div>
 </div>

 {/* Email */}
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
 <input
 type="email"
 value={regEmail}
 onChange={(e) => setRegEmail(e.target.value)}
 required
 placeholder="you@example.com"
 className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-black dark:ring-white focus:border-transparent transition-all"
 />
 </div>
 </div>

 {/* Password */}
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
 <input
 type={showPass ? 'text' : 'password'}
 value={regPassword}
 onChange={(e) => setRegPassword(e.target.value)}
 required
 placeholder="••••••••"
 className="w-full pl-10 pr-10 py-3 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-black dark:ring-white focus:border-transparent transition-all"
 />
 <button
 type="button"
 onClick={() => setShowPass(!showPass)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
 >
 {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>

 {/* Confirm Password */}
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
 <input
 type={showPass ? 'text' : 'password'}
 value={regConfirmPassword}
 onChange={(e) => setRegConfirmPassword(e.target.value)}
 required
 placeholder="••••••••"
 className="w-full pl-10 pr-10 py-3 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-black dark:ring-white focus:border-transparent transition-all"
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full py-3 px-4 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
 >
 {loading ? (
 <span className="flex items-center justify-center gap-2">
 <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
 </svg>
 Creating account...
 </span>
 ) : (
 'Create Account'
 )}
 </button>

 <p className="text-center text-slate-600 dark:text-slate-400 text-sm">
 Already have an account?{' '}
 <button
 type="button"
 onClick={() => setIsRegister(false)}
 className="text-black dark:text-white font-semibold hover:underline"
 >
 Sign In
 </button>
 </p>
 </form>
 ) : (
 // LOGIN FORM
 <form onSubmit={handleLogin} className="space-y-4">
 {/* Email */}
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 placeholder="test@gmail.com"
 className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-black dark:ring-white focus:border-transparent transition-all"
 />
 </div>
 </div>

 {/* Password */}
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
 <input
 type={showPass ? 'text' : 'password'}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 placeholder="••••••••"
 className="w-full pl-10 pr-10 py-3 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-black dark:ring-white focus:border-transparent transition-all"
 />
 <button
 type="button"
 onClick={() => setShowPass(!showPass)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
 >
 {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full py-3 px-4 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-indigo-500/25"
 >
 {loading ? (
 <span className="flex items-center justify-center gap-2">
 <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
 </svg>
 Signing in...
 </span>
 ) : (
 'Sign In'
 )}
 </button>

 <p className="text-center text-slate-600 dark:text-slate-400 text-sm">
 Don't have an account?{' '}
 <button
 type="button"
 onClick={() => setIsRegister(true)}
 className="text-black dark:text-white font-semibold hover:underline"
 >
 Register
 </button>
 </p>
 </form>
 )}

 
 </div>

 {/* Footer */}
 <p className="text-center text-slate-500 dark:text-slate-600 text-xs mt-6">
 AI-Powered Job Tracker © 2026 — Ready for LangChain Integration
 </p>
 </motion.div>
 </div>
 );
}
