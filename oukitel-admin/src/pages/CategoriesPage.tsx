import React, { useState, useEffect } from 'react';
import API from '../api';
import { Plus, Edit2, Trash2, Camera, Image as ImgIcon, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '';

const compress = async (file: File) => {
    try {
        const cf = await imageCompression(file, { maxSizeMB: 0.7, maxWidthOrHeight: 1100, useWebWorker: true });
        return new File([cf], file.name, { type: cf.type });
    } catch { return file; }
};

export default function CategoriesPage() {
    const [cats, setCats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    /* edit modal */
    const [editModal, setEditModal] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [editDesc, setEditDesc] = useState('');
    const [editArabicName, setEditArabicName] = useState('');
    const [editImg, setEditImg] = useState<File | null>(null);
    const [editPrev, setEditPrev] = useState('');
    const [saving, setSaving] = useState(false);

    /* add modal */
    const [addModal, setAddModal] = useState(false);
    const [newCat, setNewCat] = useState({ id: '', name: '', arabic_name: '', description: '', sort_order: 0 });
    const [newImg, setNewImg] = useState<File | null>(null);
    const [newPrev, setNewPrev] = useState('');

    const load = async () => {
        setLoading(true);
        try { const r = await API.get('/api/categories.php'); setCats(r.data); }
        catch { } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    /* Edit */
    const openEdit = (cat: any) => {
        setEditing(cat);
        setEditDesc(cat.description || '');
        setEditArabicName(cat.arabic_name || '');
        setEditImg(null);
        setEditPrev(cat.image ? `${API_BASE}${cat.image}` : '');
        setEditModal(true);
    };
    const pickEdit = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]; if (!f) return;
        setEditPrev(URL.createObjectURL(f));
        setEditImg(await compress(f));
    };
    const handleSaveEdit = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('_method', 'PUT');
            fd.append('arabic_name', editArabicName);
            fd.append('description', editDesc);
            if (editImg) fd.append('image', editImg);
            await API.post(`/api/categories.php?id=${editing.id}`, fd);
            setEditModal(false); load();
        } catch { alert('خطأ في الحفظ'); }
        finally { setSaving(false); }
    };

    /* Add */
    const openAdd = () => {
        setNewCat({ id: '', name: '', arabic_name: '', description: '', sort_order: 0 });
        setNewImg(null); setNewPrev(''); setAddModal(true);
    };
    const pickNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]; if (!f) return;
        setNewPrev(URL.createObjectURL(f));
        setNewImg(await compress(f));
    };
    const handleCreate = async () => {
        if (!newCat.id.trim() || !newCat.name.trim() || !newCat.arabic_name.trim())
            return alert('يرجى ملء المعرف والاسمين');
        setSaving(true);
        try {
            const fd = new FormData();
            Object.entries(newCat).forEach(([k, v]) => fd.append(k, String(v)));
            if (newImg) fd.append('image', newImg);
            await API.post('/api/categories.php', fd);
            setAddModal(false); load();
        } catch { alert('خطأ في إنشاء الفئة'); }
        finally { setSaving(false); }
    };

    /* Delete */
    const handleDelete = async (id: string) => {
        if (!confirm('حذف الفئة نهائياً؟')) return;
        try { await API.delete(`/api/categories.php?id=${id}`); load(); }
        catch { alert('خطأ في الحذف'); }
    };

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">الفئات <span className="text-slate-400 font-medium text-lg">({cats.length})</span></h1>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={18} /> إضافة فئة جديدة
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
                </div>
            ) : cats.length === 0 ? (
                <div className="text-center p-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <div className="text-6xl mb-4 opacity-30">🗂️</div>
                    <p className="text-slate-500 font-bold text-lg">لا توجد فئات للأسف</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {cats.map(cat => (
                        <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                            <div className="h-40 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                                {cat.image
                                    ? <img src={`${API_BASE}${cat.image}`} alt={cat.arabic_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    : <ImgIcon size={48} className="text-slate-300" />}
                            </div>
                            <div className="p-5">
                                <div className="font-black text-lg mb-1 text-slate-800">{cat.arabic_name}</div>
                                <p className="text-sm text-slate-500 font-medium mb-5 h-10 line-clamp-2">{cat.description || 'بدون وصف'}</p>
                                <div className="flex gap-2">
                                    <button className="btn btn-secondary flex-1 py-2 text-sm" onClick={() => openEdit(cat)}>
                                        <Edit2 size={14} /> تعديل
                                    </button>
                                    <button className="btn btn-danger p-2 h-auto shrink-0 group/del" onClick={() => handleDelete(cat.id)}>
                                        <Trash2 size={16} className="text-red-500 group-hover/del:text-red-700 transition-colors" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Edit Modal ─── */}
            {editModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditModal(false)}>
                    <div className="modal-content">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <span className="font-black text-lg text-slate-800">تعديل: {editing?.arabic_name}</span>
                            <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setEditModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="form-group">
                                <label className="form-label">الاسم بالعربية</label>
                                <input className="form-input" value={editArabicName} onChange={e => setEditArabicName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">الوصف</label>
                                <textarea className="form-input h-24 resize-none" value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="وصف الفئة..." />
                            </div>
                            <div className="form-group">
                                <label className="form-label">صورة الفئة</label>
                                {editPrev && <img src={editPrev} alt="" className="w-full h-40 object-cover rounded-xl border border-slate-200 mb-3" />}
                                <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all text-slate-500 font-bold text-sm">
                                    <Camera size={18} /> {editPrev ? 'تغيير الصورة' : 'رفع صورة من الجهاز'}
                                    <input type="file" accept="image/*" className="hidden" onChange={pickEdit} />
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                            <button className="btn btn-primary px-8" onClick={handleSaveEdit} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</button>
                            <button className="btn btn-secondary" onClick={() => setEditModal(false)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Add Modal ─── */}
            {addModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAddModal(false)}>
                    <div className="modal-content">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <span className="font-black text-lg text-slate-800">إضافة فئة جديدة</span>
                            <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="form-group">
                                <label className="form-label">معرف الفئة (بالإنجليزية بدون مسافات) *</label>
                                <input className="form-input" dir="ltr" value={newCat.id}
                                    onChange={e => setNewCat(n => ({ ...n, id: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                                    placeholder="مثال: pod_systems" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group mb-0">
                                    <label className="form-label">الاسم بالإنجليزية *</label>
                                    <input className="form-input" dir="ltr" value={newCat.name}
                                        onChange={e => setNewCat(n => ({ ...n, name: e.target.value }))}
                                        placeholder="Pod Systems" />
                                </div>
                                <div className="form-group mb-0">
                                    <label className="form-label">الاسم بالعربية *</label>
                                    <input className="form-input" value={newCat.arabic_name}
                                        onChange={e => setNewCat(n => ({ ...n, arabic_name: e.target.value }))}
                                        placeholder="أجهزة بود" />
                                </div>
                            </div>
                            <div className="form-group mt-4">
                                <label className="form-label">الوصف</label>
                                <textarea className="form-input h-20 resize-none" value={newCat.description}
                                    onChange={e => setNewCat(n => ({ ...n, description: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">الترتيب</label>
                                <input className="form-input" type="number" value={newCat.sort_order}
                                    onChange={e => setNewCat(n => ({ ...n, sort_order: +e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">صورة الفئة</label>
                                {newPrev && <img src={newPrev} alt="" className="w-full h-40 object-cover rounded-xl border border-slate-200 mb-3" />}
                                <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all text-slate-500 font-bold text-sm">
                                    <Camera size={18} /> {newPrev ? 'تغيير الصورة' : 'رفع صورة من الجهاز'}
                                    <input type="file" accept="image/*" className="hidden" onChange={pickNew} />
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                            <button className="btn btn-primary px-8" onClick={handleCreate} disabled={saving}>{saving ? 'جاري الإنشاء...' : 'إضافة الفئة'}</button>
                            <button className="btn btn-secondary" onClick={() => setAddModal(false)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
