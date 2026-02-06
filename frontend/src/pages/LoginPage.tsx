import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/login', { email, password });
            login(response.data.access_token, response.data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 relative overflow-hidden font-sans">
            {/* Soft decorative blur circles */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-sky-200/30 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md px-6 z-10"
            >
                <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl shadow-sky-900/5 border border-white flex flex-col items-center">
                    <div className="mb-8 flex flex-col items-center text-center">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-16 h-16 bg-gradient-to-tr from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30 mb-5"
                        >
                            <MessageSquare className="w-8 h-8 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Skygram</h2>
                        <p className="text-slate-500 mt-2 font-medium">Clear skies, smooth chats. Welcome back!</p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="w-full overflow-hidden"
                            >
                                <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-semibold flex items-center gap-3 border border-red-100">
                                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                                    {error}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="w-full space-y-5">
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <input
                                type="email"
                                className="w-full px-5 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                                <a href="#" className="text-xs font-bold text-sky-600 hover:text-blue-700 transition-colors">Forgot?</a>
                            </div>
                            <input
                                type="password"
                                className="w-full px-5 py-4 bg-slate-100/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-sky-500/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-slate-500 font-medium">
                            First time at Skygram? <Link to="/signup" className="text-sky-600 font-bold hover:underline transition-all">Create account</Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-center gap-8 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    <span className="hover:text-sky-500 cursor-pointer transition-colors">Privacy</span>
                    <span className="hover:text-sky-500 cursor-pointer transition-colors">Terms</span>
                    <span className="hover:text-sky-500 cursor-pointer transition-colors">Help</span>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
