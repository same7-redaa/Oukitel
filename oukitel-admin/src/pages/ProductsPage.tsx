import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api';
import { Plus, Edit2, Trash2, Camera, X, Image as ImgIcon, Tag, Store, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

/* ─── Types ─────── */
interface Variant { id?: number; type: string; value: string; stock: number | string; }
interface GalleryImg { id: number; image_url: string; }
interface Category { id: string; arabic_name: string; name: string; }
interface Product {
    id?: number; name: string; description: string; price: number | string;
    category_id: string; image: string; variants: Variant[];
    gallery?: GalleryImg[]; is_active?: boolean; category_arabic?: string;
}

const EMPTY_PRODUCT: Product = { name: '', description: '', price: '', category_id: '', image: '', variants: [], gallery: [] };
const VARIANT_CONFIG: Record<string, { type: string; placeholder: string }> = {
    devices: { type: 'color', placeholder: 'اللون مثال: أحمر' },
    disposables: { type: 'flavor', placeholder: 'الطعم مثال: برتقال' },
    cartridges: { type: 'resistance', placeholder: 'مقاومة مثال: 0.6' },
};
const CAT_COLORS: Record<string, string> = { devices: 'bg-blue-100 text-blue-700', disposables: 'bg-amber-100 text-amber-700', cartridges: 'bg-emerald-100 text-emerald-700' };

const API_BASE = (import.meta.env.VITE_API_URL as string) || '';
const imgUrl = (p: string) => p ? (p.startsWith('http') ? p : `${API_BASE}${p}`) : '';

/* ─── Image compression helper ─── */
const compress = async (file: File) => {
    try {
        const cf = await imageCompression(file, { maxSizeMB: 0.7, maxWidthOrHeight: 1100, useWebWorker: true });
        return new File([cf], file.name, { type: cf.type });
    } catch { return file; }
};

/* ════════════════════════════════════════════ */
export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCat, setFilterCat] = useState('all');

    /* modal state */
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [form, setForm] = useState<Product>(EMPTY_PRODUCT);
    const [imgFile, setImgFile] = useState<File | null>(null);
    const [imgPrev, setImgPrev] = useState('');
    const [saving, setSaving] = useState(false);

    /* gallery state — works even before saving (queued files) */
    const [galFiles, setGalFiles] = useState<File[]>([]); // pending files for new product
    const [galUploading, setGalUploading] = useState(false);
    const [galUploadProgress, setGalUploadProgress] = useState(0);
    const galRef = useRef<HTMLInputElement>(null);

    /* fetch */
    const loadProducts = useCallback(async () => {
        setLoading(true);
        try { const r = await API.get('/api/products.php?admin=1'); setProducts(r.data); }
        catch { } finally { setLoading(false); }
    }, []);

    const loadCategories = useCallback(async () => {
        try { const r = await API.get('/api/categories.php'); setCategories(r.data); }
        catch { }
    }, []);

    useEffect(() => { loadProducts(); loadCategories(); }, []);

    /* open / close */
    const openAdd = () => {
        setEditing(null);
        setForm({ ...EMPTY_PRODUCT, category_id: categories[0]?.id || '' });
        setImgFile(null); setImgPrev('');
        setGalFiles([]);
        setModal(true);
    };
    const openEdit = (p: Product) => {
        setEditing(p);
        const mappedVariants = p.variants?.map((v: any) => ({
            id: v.id,
            type: v.variant_type || v.type || 'variant',
            value: v.variant_value || v.value || '',
            stock: v.stock
        })) || [];
        setForm({ ...p, variants: mappedVariants });
        setImgFile(null); setImgPrev(p.image ? imgUrl(p.image) : '');
        setGalFiles([]);
        setModal(true);
    };
    const closeModal = () => { setModal(false); setEditing(null); setGalFiles([]); };

    /* image pick */
    const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]; if (!f) return;
        setImgPrev(URL.createObjectURL(f));
        setImgFile(await compress(f));
    };

    /* variants */
    const addVariant = () => {
        const cfg = VARIANT_CONFIG[form.category_id] || { type: 'variant', placeholder: 'قيمة' };
        setForm(f => ({ ...f, variants: [...f.variants, { type: cfg.type, value: '', stock: 0 }] }));
    };
    const updV = (i: number, k: string, v: any) =>
        setForm(f => { const vs = [...f.variants]; vs[i] = { ...vs[i], [k]: v }; return { ...f, variants: vs }; });
    const remV = (i: number) => setForm(f => ({ ...f, variants: f.variants.filter((_, j) => j !== i) }));

    /* gallery — pick multiple files */
    const pickGalleryFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        if (editing?.id) {
            // Existing product: upload immediately
            setGalUploading(true);
            setGalUploadProgress(0);
            let uploaded = 0;
            const newImgs: GalleryImg[] = [];
            for (const file of files) {
                try {
                    const cf = await compress(file);
                    const fd = new FormData(); fd.append('image', cf);
                    const r = await API.post(`/api/products.php?gallery&id=${editing.id}`, fd);
                    newImgs.push({ id: r.data.id || Date.now(), image_url: r.data.image_url });
                } catch { /* skip failed */ }
                uploaded++;
                setGalUploadProgress(Math.round((uploaded / files.length) * 100));
            }
            if (newImgs.length) {
                setForm(f => ({ ...f, gallery: [...(f.gallery || []), ...newImgs] }));
                setEditing(e => e ? { ...e, gallery: [...(e.gallery || []), ...newImgs] } : e);
            }
            setGalUploading(false);
            setGalUploadProgress(0);
        } else {
            // New product: queue files, compress them
            const compressed: File[] = [];
            for (const file of files) {
                compressed.push(await compress(file));
            }
            setGalFiles(prev => [...prev, ...compressed]);
        }
        if (galRef.current) galRef.current.value = '';
    };

    const removeQueuedGal = (i: number) => setGalFiles(prev => prev.filter((_, j) => j !== i));

    const deleteGallery = async (gid: number) => {
        if (!editing?.id || !confirm('حذف هذه الصورة؟')) return;
        try {
            await API.delete(`/api/products.php?gallery&id=${editing.id}&gid=${gid}`);
            setForm(f => ({ ...f, gallery: f.gallery?.filter(g => g.id !== gid) }));
            setEditing(e => e ? { ...e, gallery: e.gallery?.filter(g => g.id !== gid) } : e);
        } catch { alert('خطأ'); }
    };

    /* save product — then upload queued gallery */
    const handleSave = async () => {
        if (!form.name.trim() || !form.price) return alert('يرجى إدخال الاسم والسعر');
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('description', form.description || '');
            fd.append('price', String(form.price));
            fd.append('category_id', form.category_id);
            fd.append('variants', JSON.stringify(form.variants));
            if (imgFile) fd.append('image', imgFile);
            else if (form.image) fd.append('keep_image', form.image);

            let productId: number | undefined = editing?.id;

            if (editing?.id) {
                fd.append('_method', 'PUT');
                await API.post(`/api/products.php?id=${editing.id}`, fd);
            } else {
                const r = await API.post('/api/products.php', fd);
                productId = r.data?.id;
            }

            // Upload queued gallery images for new product
            if (productId && galFiles.length > 0) {
                setGalUploading(true);
                setGalUploadProgress(0);
                let uploaded = 0;
                for (const file of galFiles) {
                    try {
                        const gfd = new FormData(); gfd.append('image', file);
                        await API.post(`/api/products.php?gallery&id=${productId}`, gfd);
                    } catch { /* skip */ }
                    uploaded++;
                    setGalUploadProgress(Math.round((uploaded / galFiles.length) * 100));
                }
                setGalUploading(false);
                setGalUploadProgress(0);
                setGalFiles([]);
            }

            closeModal(); loadProducts();
        } catch (e: any) { alert(e?.response?.data?.error || 'حدث خطأ'); }
        finally { setSaving(false); }
    };

    /* delete product */
    const handleDelete = async (id: number) => {
        if (!confirm('سيتم حذف المنتج نهائياً. هل أنت متأكد؟')) return;
        try { await API.delete(`/api/products.php?id=${id}`); loadProducts(); }
        catch { alert('خطأ في الحذف'); }
    };

    const filtered = filterCat === 'all' ? products : products.filter(p => p.category_id === filterCat);
    const catMap: Record<string, string> = {};
    categories.forEach(c => { catMap[c.id] = c.arabic_name; });

    /* ─── Render ─────────────────────────────── */
    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">المنتجات <span className="text-slate-400 font-medium text-lg">({products.length})</span></h1>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={18} /> إضافة منتج جديد
                </button>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${filterCat === 'all' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    onClick={() => setFilterCat('all')}
                >
                    الكل ({products.length})
                </button>
                {categories.map(c => {
                    const count = products.filter(p => p.category_id === c.id).length;
                    const isActive = filterCat === c.id;
                    return (
                        <button
                            key={c.id}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${isActive ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                            onClick={() => setFilterCat(c.id)}
                        >
                            {c.arabic_name} ({count})
                        </button>
                    )
                })}
            </div>

            {/* Products grid */}
            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center p-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <div className="text-6xl mb-4 opacity-30">📦</div>
                    <p className="text-slate-500 font-bold text-lg">لا توجد منتجات في هذا القسم</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map(p => (
                        <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                            <div className="h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden shrink-0">
                                {p.image
                                    ? <img src={imgUrl(p.image)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    : <ImgIcon size={48} className="text-slate-300" />}

                                <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold ${CAT_COLORS[p.category_id] || 'bg-slate-100 text-slate-700'} backdrop-blur-md bg-opacity-90 shadow-sm`}>
                                    {catMap[p.category_id] || p.category_id}
                                </span>
                            </div>

                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-2 gap-2">
                                    <span className="font-black text-[15px] text-slate-800 line-clamp-2 leading-snug">{p.name}</span>
                                    <span className="font-black text-primary whitespace-nowrap">{p.price} ج.م</span>
                                </div>
                                <p className="text-sm text-slate-500 font-medium mb-4 line-clamp-2 flex-1">{p.description || 'بدون وصف'}</p>

                                {p.variants && p.variants.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {p.variants.map((v, i) => (
                                            <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200">
                                                {v.value || (v as any).variant_value} <span className="opacity-50">({v.stock})</span>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100">
                                    <button className="btn btn-secondary flex-1 py-2 text-xs" onClick={() => openEdit(p)}>
                                        <Edit2 size={14} /> تعديل
                                    </button>
                                    <button className="btn btn-danger p-2 h-auto shrink-0 group/del" onClick={() => p.id && handleDelete(p.id)}>
                                        <Trash2 size={16} className="text-red-500 group-hover/del:text-red-700 transition-colors" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Modal ─── */}
            {modal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal-content">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <span className="font-black text-lg text-slate-800">{editing ? 'تعديل المنتج' : 'إضافة منتج جديد'}</span>
                            <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Main Image */}
                            <div className="form-group">
                                {imgPrev && <img src={imgPrev} alt="" className="w-full h-48 object-cover rounded-xl border border-slate-200 mb-3" />}
                                <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all text-slate-500 font-bold text-sm">
                                    <Camera size={18} />
                                    {imgPrev ? 'تغيير الصورة الرئيسية' : 'رفع صورة رئيسية'}
                                    <input type="file" accept="image/*" className="hidden" onChange={pickImage} />
                                </label>
                            </div>

                            {/* Name + Price */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group col-span-2">
                                    <label className="form-label">اسم المنتج *</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="اسم المنتج" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">السعر (ج.م) *</label>
                                    <input className="form-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" min="0" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الفئة</label>
                                    <select className="form-input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value, variants: [] }))}>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.arabic_name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group col-span-2">
                                    <label className="form-label">الوصف</label>
                                    <textarea className="form-input h-24 resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف المنتج..." />
                                </div>
                            </div>

                            {/* Variants */}
                            <div className="form-group mt-4 pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="form-label mb-0 flex items-center gap-1.5 text-slate-800">
                                        <Tag size={16} className="text-primary" />
                                        المتغيرات (ألوان / طعوم / مقاومات)
                                    </label>
                                    <button className="btn btn-secondary py-1.5 px-3 text-xs" onClick={addVariant}>+ إضافة متغير</button>
                                </div>
                                {form.variants.length === 0 && (
                                    <p className="text-xs text-slate-400 font-medium text-center py-2">لم تُضف متغيرات بعد</p>
                                )}
                                {form.variants.map((v, i) => (
                                    <div key={i} className="flex gap-2 mb-2 animate-in slide-in-from-right-2">
                                        <input
                                            className="form-input flex-[2] py-2"
                                            value={v.value}
                                            onChange={e => updV(i, 'value', e.target.value)}
                                            placeholder={VARIANT_CONFIG[form.category_id]?.placeholder || 'قيمة'}
                                        />
                                        <input
                                            className="form-input flex-1 py-2"
                                            type="number" min="0"
                                            value={v.stock}
                                            onChange={e => updV(i, 'stock', e.target.value)}
                                            placeholder="الكمية"
                                        />
                                        <button className="btn btn-danger p-2 h-auto" onClick={() => remV(i)}><X size={16} /></button>
                                    </div>
                                ))}
                            </div>

                            {/* Gallery — works for BOTH new and existing products */}
                            <div className="form-group mt-6 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="form-label mb-0 flex items-center gap-1.5 text-slate-800">
                                        <Store size={16} className="text-primary" />
                                        معرض الصور الإضافية
                                    </label>
                                    <label className="btn btn-secondary py-1.5 px-3 text-xs cursor-pointer">
                                        {galUploading
                                            ? <><Loader2 size={14} className="animate-spin" /> {galUploadProgress}%</>
                                            : <><Plus size={14} /> إضافة صور</>}
                                        <input ref={galRef} type="file" accept="image/*" multiple className="hidden"
                                            onChange={pickGalleryFiles} disabled={galUploading} />
                                    </label>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {/* Existing uploaded gallery (edit mode) */}
                                    {form.gallery?.map(g => (
                                        <div key={g.id} className="relative group/gal animate-in zoom-in-95">
                                            <img src={imgUrl(g.image_url)} alt="" className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
                                            <button onClick={() => deleteGallery(g.id)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/gal:opacity-100 transition-opacity shadow-sm hover:bg-red-600">
                                                <X size={12} strokeWidth={3} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Queued files (new product) */}
                                    {galFiles.map((file, i) => (
                                        <div key={i} className="relative group/gal animate-in zoom-in-95">
                                            <img src={URL.createObjectURL(file)} alt="" className="w-20 h-20 object-cover rounded-xl border-2 border-dashed border-primary/40" />
                                            <div className="absolute inset-0 bg-primary/10 rounded-xl flex items-center justify-center">
                                                <span className="text-[9px] font-black text-primary bg-white/90 px-1.5 py-0.5 rounded-full">جاهزة</span>
                                            </div>
                                            <button onClick={() => removeQueuedGal(i)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/gal:opacity-100 transition-opacity shadow-sm">
                                                <X size={12} strokeWidth={3} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Empty state */}
                                    {(form.gallery?.length || 0) + galFiles.length === 0 && (
                                        <div className="w-full text-center py-4 text-slate-400 text-sm font-medium">
                                            لا توجد صور في المعرض. اضغط "إضافة صور" لرفع صور متعددة دفعة واحدة.
                                        </div>
                                    )}
                                </div>

                                {galFiles.length > 0 && !editing?.id && (
                                    <p className="text-xs text-amber-600 font-bold mt-2 flex items-center gap-1">
                                        💡 سيتم رفع {galFiles.length} صورة تلقائياً عند حفظ المنتج
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                            <button className="btn btn-primary px-8" onClick={handleSave} disabled={saving || galUploading}>
                                {saving ? 'جاري الحفظ...' : galUploading ? `جاري رفع الصور ${galUploadProgress}%...` : 'حفظ المنتج'}
                            </button>
                            <button className="btn btn-secondary" onClick={closeModal}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
