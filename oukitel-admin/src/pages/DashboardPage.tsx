import { useEffect, useState } from 'react';
import API from '../api';
import { Package, Clock, CheckCircle, TrendingUp, ShoppingBag, BarChart2 } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
    pending: 'جديد', confirmed: 'مؤكد', shipped: 'في الشحن', delivered: 'تم التسليم', cancelled: 'ملغي'
};
const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-600',
    confirmed: 'bg-blue-100 text-blue-600',
    shipped: 'bg-violet-100 text-violet-600',
    delivered: 'bg-emerald-100 text-emerald-600',
    cancelled: 'bg-red-100 text-red-600',
};

export default function DashboardPage() {
    const [stats, setStats] = useState({ total_orders: 0, pending: 0, delivered: 0, revenue: 0 });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            API.get('/api/orders.php?stats=1'),
            API.get('/api/orders.php'),
        ]).then(([s, o]) => {
            setStats(s.data);
            setRecentOrders(o.data.slice(0, 8));
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const cards = [
        { label: 'إجمالي الطلبات', value: stats.total_orders, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'طلبات جديدة', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'تم التسليم', value: stats.delivered, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'الإيرادات (ج.م)', value: `${parseFloat(String(stats.revenue)).toFixed(0)}`, icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-50' },
    ];

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">لوحة التحكم</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">مرحباً بك في متجر Oukitel Egypt</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                    <BarChart2 size={16} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-600">إحصائيات المبيعات</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${card.bg} ${card.color}`}>
                            <card.icon size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-500 mb-1">{card.label}</div>
                            <div className="text-2xl font-black text-slate-800">{loading ? '—' : card.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-primary" />
                    <span className="font-bold text-lg text-slate-800">أحدث الطلبات</span>
                </div>

                {loading ? (
                    <div className="p-10 flex justify-center">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div className="p-16 text-center text-slate-400">
                        <div className="text-5xl opacity-40 mb-3">📋</div>
                        <p className="font-medium">لا توجد طلبات بعد</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">الطلب</th>
                                    <th className="px-6 py-4">العميل</th>
                                    <th className="px-6 py-4">الهاتف</th>
                                    <th className="px-6 py-4">الإجمالي</th>
                                    <th className="px-6 py-4">الحالة</th>
                                    <th className="px-6 py-4">التاريخ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {recentOrders.map(o => {
                                    const stClass = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
                                    return (
                                        <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-400">#{o.id}</td>
                                            <td className="px-6 py-4 font-bold">{o.customer_name}</td>
                                            <td className="px-6 py-4 tracking-wider"><span dir="ltr">{o.phone}</span></td>
                                            <td className="px-6 py-4 font-black text-primary">{parseFloat(o.total_price).toFixed(0)} ج.م</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${stClass}`}>
                                                    {STATUS_LABELS[o.status] || o.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-500">{new Date(o.created_at).toLocaleDateString('ar-EG')}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
