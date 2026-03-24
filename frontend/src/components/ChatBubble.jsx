import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles, Minimize2 } from 'lucide-react';
import { useJobStore } from '../store/jobStore';
import { askAssistant } from '../services/api';

const WELCOME_MSG = {
 id: 'welcome',
 role: 'assistant',
 content: "Hi! I'm your AI Job Assistant 🤖\n\nI can help you:\n• Find remote jobs\n• Show top matches\n• Filter by job type or skills\n• Search specific roles\n\nTry: \"Show me remote React jobs\" or \"What are my best matches?\"",
 ts: new Date().toISOString(),
};

export default function ChatBubble() {
 const [open, setOpen] = useState(false);
 const [messages, setMessages] = useState([WELCOME_MSG]);
 const [input, setInput] = useState('');
 const [loading, setLoading] = useState(false);
 const { filters, setFilters, fetchJobs, resetFilters } = useJobStore();
 const bottomRef = useRef(null);
 const inputRef = useRef(null);

 useEffect(() => {
 bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [messages]);

 useEffect(() => {
 if (open) setTimeout(() => inputRef.current?.focus(), 300);
 }, [open]);

 const sendMessage = async () => {
 const text = input.trim();
 if (!text || loading) return;

 const userMsg = { id: Date.now(), role: 'user', content: text, ts: new Date().toISOString() };
 setMessages((prev) => [...prev, userMsg]);
 setInput('');
 setLoading(true);

 try {
 console.log('Sending message to assistant:', text, 'Current filters:', filters);
 const res = await askAssistant(text, filters);
 console.log('Full assistant response:', res.data);

 const { reply, action, filters: newFilters } = res.data;
 console.log('Extracted from response - Action:', action, 'NewFilters:', newFilters);

 const botMsg = {
 id: Date.now() + 1,
 role: 'assistant',
 content: reply,
 action,
 ts: new Date().toISOString(),
 };
 setMessages((prev) => [...prev, botMsg]);

 // Apply filter actions
 if ((action === 'update_filters' || action === 'search_jobs') && newFilters) {
 console.log('Applying new filters:', newFilters);
 setFilters(newFilters);
 // Fetch jobs after setting filters
 setTimeout(() => {
  fetchJobs();
 }, 100);
 } else if (action === 'clear_filters') {
 console.log('Clearing filters');
 resetFilters();
 setTimeout(() => fetchJobs(), 100);
 }
 } catch (err) {
 console.error('Error sending message:', err);
 setMessages((prev) => [
 ...prev,
 {
 id: Date.now() + 1,
 role: 'assistant',
 content: 'Sorry, I had trouble connecting. Please try again!',
 ts: new Date().toISOString(),
 },
 ]);
 } finally {
 setLoading(false);
 }
 };

 const handleKey = (e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 sendMessage();
 }
 };

 return (
 <>
 {/* Chat window */}
 <AnimatePresence>
 {open && (
 <motion.div
 initial={{ opacity: 0, y: 20, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 20, scale: 0.95 }}
 transition={{ type: 'spring', stiffness: 300, damping: 25 }}
 className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm"
 >
 <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 flex flex-col overflow-hidden"
 style={{ height: '480px' }}
 >
 {/* Header */}
 <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/5 bg-black dark:bg-white/10 text-white dark:text-black">
 <div className="w-8 h-8 bg-black dark:bg-white rounded-xl flex items-center justify-center">
 <Bot className="w-4 h-4 text-white dark:text-black" />
 </div>
 <div className="flex-1">
 <p className="text-slate-900 dark:text-neutral-200 font-semibold text-sm">AI Job Assistant</p>
 <div className="flex items-center gap-1.5">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
 <p className="text-emerald-600 dark:text-emerald-300 text-xs">Online</p>
 </div>
 </div>
 <button
 onClick={() => setOpen(false)}
 className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-lg transition-all"
 >
 <Minimize2 className="w-4 h-4" />
 </button>
 </div>

 {/* Messages */}
 <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
 {messages.map((msg) => (
 <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
 {/* Avatar */}
 <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5 ${
 msg.role === 'assistant'
 ? 'bg-black dark:bg-white '
 : 'bg-slate-200 dark:bg-slate-700'
 }`}>
 {msg.role === 'assistant'
 ? <Bot className="w-3.5 h-3.5 text-white" />
 : <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
 }
 </div>
 {/* Bubble */}
 <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
 msg.role === 'user'
 ? 'bg-black dark:bg-white text-white dark:text-black rounded-tr-sm'
 : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/8 rounded-tl-sm'
 }`}>
 <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
 {msg.action && msg.action !== 'help' && (
 <div className="mt-1.5 flex items-center gap-1">
 <Sparkles className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
 <span className="text-black dark:text-neutral-200 dark:text-neutral-200 text-xs">
 {msg.action === 'update_filters' ? 'Filters updated' : 'Searching jobs...'}
 </span>
 </div>
 )}
 </div>
 </div>
 ))}
 {loading && (
 <div className="flex gap-2.5">
 <div className="w-6 h-6 rounded-lg bg-black dark:bg-white flex items-center justify-center">
 <Bot className="w-3.5 h-3.5 text-white dark:text-black" />
 </div>
 <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
 <div className="flex gap-1.5">
 {[0, 1, 2].map((i) => (
 <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
 style={{ animationDelay: `${i * 0.15}s` }} />
 ))}
 </div>
 </div>
 </div>
 )}
 <div ref={bottomRef} />
 </div>

 {/* Input */}
 <div className="px-4 py-3 border-t border-slate-200 dark:border-white/5">
 <div className="flex items-end gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2">
 <textarea
 ref={inputRef}
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyDown={handleKey}
 placeholder="Ask me anything..."
 rows={1}
 className="flex-1 bg-transparent text-slate-900 dark:text-slate-200 text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none resize-none max-h-24 overflow-y-auto"
 style={{ lineHeight: '1.5' }}
 />
 <button
 onClick={sendMessage}
 disabled={!input.trim() || loading}
 className="w-8 h-8 flex-shrink-0 bg-black dark:bg-white hover:bg-neutral-100 dark:bg-white/50 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all"
 >
 <Send className="w-3.5 h-3.5 text-white dark:text-black" />
 </button>
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Trigger button */}
 <motion.button
 onClick={() => setOpen(!open)}
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-2xl shadow-xl shadow-indigo-500/30 flex items-center justify-center transition-all"
 >
 <AnimatePresence mode="wait">
 <motion.div
 key={open ? 'close' : 'open'}
 initial={{ rotate: -90, opacity: 0 }}
 animate={{ rotate: 0, opacity: 1 }}
 exit={{ rotate: 90, opacity: 0 }}
 transition={{ duration: 0.15 }}
 >
 {open ? (
 <X className="w-6 h-6 text-white dark:text-black" />
 ) : (
 <MessageCircle className="w-6 h-6 text-white dark:text-black" />
 )}
 </motion.div>
 </AnimatePresence>
 {/* Unread dot */}
 {!open && (
 <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
 )}
 </motion.button>
 </>
 );
}
