import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useAuthStore } from '../store/authStore';
import { useJobStore } from '../store/jobStore';
import { uploadResume } from '../services/api';
import Navbar from '../components/Navbar';
import {
 Upload, FileText, CheckCircle2, Sparkles, ChevronRight,
 RefreshCw, X, Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResumePage() {
 const { user, updateUser } = useAuthStore();
 const { setFilters, fetchJobs } = useJobStore();
 const navigate = useNavigate();
 const [uploading, setUploading] = useState(false);
 const [uploadedData, setUploadedData] = useState(
 user?.resumeText ? { skills: user.resumeSkills || [], filename: user.resumeFileName } : null
 );
 const [dragFile, setDragFile] = useState(null);

 const onDrop = useCallback((acceptedFiles) => {
 if (acceptedFiles.length > 0) setDragFile(acceptedFiles[0]);
 }, []);

 const { getRootProps, getInputProps, isDragActive } = useDropzone({
 onDrop,
 accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
 maxFiles: 1,
 });

 const handleUpload = async () => {
 if (!dragFile) return;
 setUploading(true);
 const formData = new FormData();
 formData.append('file', dragFile);
 try {
  const res = await uploadResume(formData);
  const { skills, extractedText, filename, name } = res.data;
  setUploadedData({ skills, filename });
  const updates = { resumeText: extractedText, resumeSkills: skills, resumeFileName: filename };
  if (name) updates.name = name;
  updateUser(updates);
  toast.success('Resume uploaded and analyzed!');
 setDragFile(null);
 } catch {
 toast.error('Upload failed. Please try again.');
 } finally {
 setUploading(false);
 }
 };

 const handleBrowseJobs = async () => {
 // Pre-populate skills filter if available
 if (uploadedData?.skills && uploadedData.skills.length > 0) {
 setFilters({ skills: uploadedData.skills });
 await fetchJobs();
 }
 navigate('/jobs');
 };

 return (
 <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-neutral-200">
 <Navbar />
 <div className="max-w-3xl mx-auto px-4 py-12">
 {/* Header */}
 <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
 <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-transparent border border-slate-300 dark:border-white/20 rounded-full text-slate-500 dark:text-neutral-400 text-sm mb-4">
 <Cpu className="w-3.5 h-3.5" />
 Resume Analysis
 </div>
 <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-indigo-600 dark:from-white dark:to-indigo-300 text-transparent bg-clip-text mb-3">
 Upload Your Resume
 </h1>
 <p className="text-slate-600 dark:text-slate-400 text-lg">
 We'll extract your skills and match you with the best opportunities
 </p>
 </motion.div>

 <AnimatePresence mode="wait">
 {!uploadedData ? (
 <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
 {/* Dropzone */}
 <div
 {...getRootProps()}
 className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 ${
 isDragActive
 ? 'border-neutral-800 dark:border-neutral-200 bg-neutral-100/50 dark:bg-white/5 dark:bg-neutral-100 dark:bg-white/50/10 scale-[1.01]'
 : 'border-slate-300 dark:border-white/10 bg-white dark:bg-white/3 hover:border-black dark:border-white/50 hover:bg-slate-50 dark:hover:bg-white/5'
 }`}
 >
 <input {...getInputProps()} />
 <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-neutral-500 dark:text-neutral-400' : 'text-slate-500'}`} />
 {dragFile ? (
 <div className="space-y-2">
 <div className="flex items-center justify-center gap-2 text-indigo-300">
 <FileText className="w-5 h-5" />
 <span className="font-medium">{dragFile.name}</span>
 <button onClick={(e) => { e.stopPropagation(); setDragFile(null); }}>
 <X className="w-4 h-4 text-slate-400 hover:text-white" />
 </button>
 </div>
 <p className="text-slate-500 text-sm">{(dragFile.size / 1024).toFixed(1)} KB</p>
 </div>
 ) : (
 <>
 <p className="text-slate-900 dark:text-neutral-200 text-lg font-medium mb-1">
 {isDragActive ? 'Drop it here!' : 'Drag & drop your resume'}
 </p>
 <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">or click to browse files</p>
 <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-500 dark:text-slate-400 text-xs border border-slate-200 dark:border-white/10">
 Supports PDF and TXT
 </span>
 </>
 )}
 </div>

 {dragFile && (
 <motion.button
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 onClick={handleUpload}
 disabled={uploading}
 className="mt-6 w-full py-4 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-2xl font-semibold text-white dark:text-black flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
 >
 {uploading ? (
 <>
 <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
 </svg>
 Analyzing resume...
 </>
 ) : (
 <>
 <Sparkles className="w-5 h-5" />
 Upload & Extract Skills
 </>
 )}
 </motion.button>
 )}

 <button
 onClick={() => navigate('/jobs')}
 className="mt-4 w-full py-3 text-slate-500 dark:text-slate-400 hover:text-black dark:text-neutral-200 dark:hover:text-white text-sm transition-colors"
 >
 Skip for now — browse jobs without matching
 </button>
 </motion.div>
 ) : (
 /* Success state */
 <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
 <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-3xl p-8">
 <div className="flex items-center gap-3 mb-6">
 <CheckCircle2 className="w-8 h-8 text-emerald-400" />
 <div>
 <h3 className="text-slate-900 dark:text-neutral-200 font-semibold">Resume analyzed successfully!</h3>
 <p className="text-slate-500 dark:text-slate-400 text-sm">{uploadedData.filename}</p>
 </div>
 </div>

 {/* Skills */}
 <div className="mb-6">
 <p className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-3">
 <Sparkles className="inline w-4 h-4 mr-1 text-neutral-500 dark:text-neutral-400" />
 {uploadedData.skills.length} skills extracted
 </p>
 <div className="flex flex-wrap gap-2">
 {uploadedData.skills.map((skill) => (
 <span
 key={skill}
 className="px-3 py-1 rounded-full text-sm font-medium transition-all bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-neutral-200 border border-slate-200 dark:border-white/10"
 >
 {skill}
 </span>
 ))}
 {uploadedData.skills.length === 0 && (
 <p className="text-slate-500 text-sm">No specific skills detected. You can still browse all jobs.</p>
 )}
 </div>
 </div>

 <div className="flex gap-3">
 <button
 onClick={() => { setUploadedData(null); setDragFile(null); }}
 className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 text-sm transition-all"
 >
 <RefreshCw className="w-4 h-4" />
 Replace Resume
 </button>
 <button
 onClick={handleBrowseJobs}
 className="flex-1 flex items-center justify-center gap-2 py-2 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-xl text-white dark:text-black font-semibold text-sm transition-all"
 >
 Browse Matched Jobs
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 );
}
