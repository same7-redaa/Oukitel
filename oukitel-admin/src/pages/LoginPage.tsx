import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Zap, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
        } catch (err: any) {
            setError(err.response?.data?.error || 'خطأ في تسجيل الدخول');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900" dir="rtl">
            <div className="w-full max-w-md p-8 bg-slate-800 rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative text-center mb-10">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
                        <Zap size={32} className="text-white" fill="currentColor" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-1">Oukitel Egypt</h1>
                    <p className="text-slate-400 font-medium">لوحة التحكم السريعة</p>
                </div>

                <form onSubmit={handleSubmit} className="relative space-y-5">
                    <div>
                        <label className="block text-slate-300 text-sm font-bold mb-2 mx-1">اسم المستخدم</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full px-5 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600 font-medium"
                            placeholder="الوظيفة أو اسم الدخول..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-slate-300 text-sm font-bold mb-2 mx-1">كلمة المرور</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-5 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600 font-medium tracking-widest"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 mt-2 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={20} className="animate-spin" />}
                        {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                    </button>
                </form>
            </div>
        </div>
    );
}
