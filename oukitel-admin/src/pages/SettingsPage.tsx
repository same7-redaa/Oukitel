import React, { useState, useEffect } from 'react';
import { Save, Phone, Mail, Settings as SettingsIcon } from 'lucide-react';
import API from '../api';

interface Settings {
    phone: string;
    email: string;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({ phone: '', email: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        API.get('/api/settings.php')
            .then((res: any) => {
                setSettings(res.data);
                setLoading(false);
            })
            .catch(() => {
                alert('خطأ في تحميل الإعدادات');
                setLoading(false);
            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await API.post('/api/settings.php', settings);
            alert('تم حفظ الإعدادات بنجاح!');
        } catch {
            alert('خطأ أثناء الحفظ');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center text-slate-500 font-bold">جاري التحميل...</div>;

    return (
        <div className="animate-in fade-in duration-300 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <SettingsIcon size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800">إعدادات الموقع</h1>
                    <p className="text-sm text-slate-500 font-medium">تعديل بيانات التواصل الأساسية</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                            <Phone size={16} className="text-slate-400" /> رقم الهاتف المحمول
                        </label>
                        <input
                            type="text"
                            value={settings.phone}
                            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                            dir="ltr"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-left"
                            placeholder="+20 100 000 0000"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                            <Mail size={16} className="text-slate-400" /> البريد الإلكتروني
                        </label>
                        <input
                            type="email"
                            value={settings.email}
                            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                            dir="ltr"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-left"
                            placeholder="email@example.com"
                        />
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary w-full py-3.5 text-lg flex justify-center gap-2 disabled:opacity-70"
                        >
                            <Save size={20} />
                            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
