import React, { useState, useEffect } from 'react';
import API from '../api';
import { Phone, MapPin, FileText, X, Trash2 } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; text: string; bg: string }> = {
    pending: { label: 'جديد', text: 'text-amber-700', bg: 'bg-amber-100 border-amber-200' },
    confirmed: { label: 'مؤكد', text: 'text-blue-700', bg: 'bg-blue-100 border-blue-200' },
    shipped: { label: 'في الشحن', text: 'text-violet-700', bg: 'bg-violet-100 border-violet-200' },
    delivered: { label: 'تم التسليم', text: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200' },
    cancelled: { label: 'ملغي', text: 'text-red-700', bg: 'bg-red-100 border-red-200' },
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [selected, setSelected] = useState<any | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const params = filterStatus !== 'all' ? { status: filterStatus } : {};
            const r = await API.get('/api/orders.php', { params });
            setOrders(r.data);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [filterStatus]);

    const openOrder = async (order: any) => {
        setSelected(order);
        if (!order.items) {
            setDetailLoading(true);
            try {
                const r = await API.get(`/api/orders.php?id=${order.id}`);
                setSelected(r.data);
            } catch { } finally { setDetailLoading(false); }
        }
    };

    const updateStatus = async (orderId: number, status: string) => {
        try {
            await API.put(`/api/orders.php?id=${orderId}`, { status });
            setOrders(o => o.map(x => x.id === orderId ? { ...x, status } : x));
            setSelected((s: any) => s ? { ...s, status } : s);
        } catch { alert('خطأ في التحديث'); }
    };

    const deleteOrder = async (orderId: number, e: React.MouseEvent) => {
        e.stopPropagation(); // prevent modal from opening
        if (!confirm('هل أنت متأكد من حذف هذا الطلب نهائياً والإلغاء من السجل؟')) return;

        try {
            await API.delete(`/api/orders.php?id=${orderId}`);
            setOrders(o => o.filter(x => x.id !== orderId));
            if (selected?.id === orderId) setSelected(null);
        } catch {
            alert('حدث خطأ أثناء الحذف.');
        }
    }

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">الطلبات <span className="text-slate-400 font-medium text-lg">({orders.length})</span></h1>
                </div>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${filterStatus === 'all' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    onClick={() => setFilterStatus('all')}
                >
                    الكل
                </button>
                {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <button
                        key={k}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${filterStatus === k ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                        onClick={() => setFilterStatus(k)}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            {/* Orders list */}
            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center p-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <div className="text-6xl mb-4 opacity-30">🛍️</div>
                    <p className="text-slate-500 font-bold text-lg">لا توجد طلبات</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {orders.map(order => {
                        const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
                        return (
                            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 flex items-center justify-between flex-wrap gap-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group" onClick={() => openOrder(order)}>
                                <div className="flex-1 min-w-[200px]">
                                    <div className="font-black text-slate-800 text-lg mb-1 flex items-center gap-2">
                                        <span className="text-slate-400 font-bold text-sm bg-slate-100 px-2 py-0.5 rounded-md">#{order.id}</span>
                                        {order.customer_name}
                                    </div>
                                    <div className="text-sm text-slate-500 font-medium flex items-center gap-4">
                                        <span className="flex items-center gap-1"><Phone size={14} className="text-slate-400" /><span dir="ltr">{order.phone}</span></span>
                                        <span>{new Date(order.created_at).toLocaleDateString('ar-EG')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-xl text-primary">
                                        {parseFloat(order.total_price).toFixed(0)} <span className="text-sm">ج.م</span>
                                    </span>
                                    <span className={`px-3 py-1 text-sm font-bold rounded-full border ${st.bg} ${st.text}`}>
                                        {st.label}
                                    </span>
                                    <button
                                        onClick={(e) => deleteOrder(order.id, e)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        title="حذف الطلب نهائياً"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── Order Detail Modal ─── */}
            {selected && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
                    <div className="modal-content">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <span className="font-black text-lg text-slate-800">تفاصيل الطلب <span className="text-slate-400">#{selected.id}</span></span>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" onClick={(e) => deleteOrder(selected.id, e)}>
                                    <Trash2 size={18} />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setSelected(null)}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Customer info */}
                            <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="font-black text-lg text-slate-800">{selected.customer_name}</span>
                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${STATUS_MAP[selected.status]?.bg} ${STATUS_MAP[selected.status]?.text}`}>
                                        {STATUS_MAP[selected.status]?.label}
                                    </span>
                                </div>
                                <div className="space-y-2.5 text-sm text-slate-600 font-medium">
                                    <div className="flex items-start gap-2">
                                        <Phone size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                        <span dir="ltr">{selected.phone}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                        <span>{selected.address}</span>
                                    </div>
                                    {selected.notes && (
                                        <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-amber-100 text-amber-800 mt-2">
                                            <FileText size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                            <span>{selected.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Items */}
                            <div className="font-bold text-slate-800 mb-3 px-1">المنتجات المطلوبة</div>
                            {detailLoading ? (
                                <div className="flex justify-center p-8">
                                    <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="bg-white border text-center border-slate-100 rounded-2xl overflow-hidden mb-6">
                                    <div className="divide-y divide-slate-100 text-right">
                                        {selected.items?.map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                                                <div>
                                                    <div className="font-bold text-slate-800 text-[15px]">{item.product_name}</div>
                                                    {item.variant_value && (
                                                        <div className="text-xs font-bold text-slate-500 mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded border border-slate-200">
                                                            {item.variant_type}: {item.variant_value}
                                                        </div>
                                                    )}
                                                    <div className="text-sm font-bold text-slate-500 mt-1">
                                                        السعر: {item.unit_price} × <span className="text-slate-800 bg-slate-100 px-1 rounded">{item.quantity}</span>
                                                    </div>
                                                </div>
                                                <div className="font-black text-lg text-primary">
                                                    {(item.unit_price * item.quantity).toFixed(0)} ج.م
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center text-right">
                                        <span className="font-black text-slate-800 text-lg">الإجمالي الكلي</span>
                                        <span className="font-black text-2xl text-primary">{parseFloat(selected.total_price).toFixed(0)} <span className="text-sm">ج.م</span></span>
                                    </div>
                                </div>
                            )}

                            {/* Status update */}
                            <div className="font-bold text-slate-800 mb-3 px-1">تحديث حالة الطلب</div>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(STATUS_MAP).map(([k, v]) => (
                                    <button
                                        key={k}
                                        onClick={() => updateStatus(selected.id, k)}
                                        className={`px-4 flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${selected.status === k
                                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                            : `bg-white ${v.text} border-slate-200 hover:bg-slate-50`
                                            }`}
                                    >
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                            <button className="btn btn-secondary w-full" onClick={() => setSelected(null)}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
