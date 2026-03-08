import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ShieldCheck, Truck, Zap, Plus, Minus, X, User, Phone, MapPin, MessageSquare, Mail, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api, { imgUrl } from '../services/api';

// ── Types ────────────────────────────────────────────────
interface Variant { id: number; variant_type: string; variant_value: string; stock: number; }
interface GalleryImg { id: number; image_url: string; }
interface Product {
    id: number; name: string; description: string; price: string;
    category_id: string; category_arabic: string; image: string;
    variants: Variant[]; gallery: GalleryImg[];
}

// ── Order Form ────────────────────────────────────────────
interface OrderForm { name: string; phone: string; email: string; address: string; notes: string; }
const EMPTY_FORM: OrderForm = { name: '', phone: '', email: '', address: '', notes: '' };

const VARIANT_LABELS: Record<string, string> = {
    color: 'اختر اللون', flavor: 'اختر الطعم', resistance: 'اختر المقاومة'
};

export default function ProductPage({ addToCart }: { addToCart: (p: any, qty: number, variant?: any) => void }) {
    const { productId } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
    const [showOrder, setShowOrder] = useState(false);
    const [orderForm, setOrderForm] = useState<OrderForm>(EMPTY_FORM);
    const [ordering, setOrdering] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [lightbox, setLightbox] = useState<string | null>(null);

    useEffect(() => {
        if (!productId) return;
        setLoading(true);
        api.getProduct(productId)
            .then(data => { setProduct(data); if (data.variants?.length) setSelectedVariant(data.variants[0]); })
            .catch(() => setProduct(null))
            .finally(() => setLoading(false));
    }, [productId]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center pt-24" style={{ background: 'var(--color-lighter)' }}>
            <div className="text-center">
                <div style={{ width: 48, height: 48, border: '4px solid #FF4E00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: '#64748b', fontWeight: 600 }}>جاري التحميل...</p>
            </div>
        </div>
    );

    if (!product) return (
        <div className="min-h-screen flex items-center justify-center pt-24 flex-col gap-4">
            <p className="text-2xl font-bold text-gray-900">المنتج غير موجود</p>
            <Link to="/" className="text-[var(--color-brand)] underline">العودة للرئيسية</Link>
        </div>
    );

    const handleAddToCart = () => {
        addToCart(product, quantity, selectedVariant);
    };

    const handleOrder = async () => {
        if (!orderForm.name || !orderForm.phone || !orderForm.address) {
            alert('يرجى ملء الاسم ورقم الهاتف والعنوان كحد أدنى');
            return;
        }
        setOrdering(true);
        try {
            await api.createOrder({
                customer_name: orderForm.name,
                phone: orderForm.phone,
                // Passing email in notes if provided, since original backend didn't have email column. Or ignore if not needed in backend.
                address: orderForm.address,
                notes: orderForm.email ? `الإيميل: ${orderForm.email}\n${orderForm.notes}` : orderForm.notes,
                items: [{
                    product_id: product.id,
                    variant_id: selectedVariant?.id || null,
                    quantity,
                }],
            });
            setOrderSuccess(true);
            setOrderForm(EMPTY_FORM);
        } catch {
            alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى');
        } finally {
            setOrdering(false);
        }
    };

    return (
        <div className="min-h-screen text-gray-900 bg-gray-50 pb-16">

            {/* Product Card Container - With top padding to avoid header overlap */}
            <div className="pt-28 lg:pt-36 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row border border-gray-100"
                >
                    {/* Left — Product Image */}
                    <div className="lg:w-1/2 bg-gray-50/50 p-8 lg:p-12 flex items-center justify-center relative border-b lg:border-b-0 lg:border-l border-gray-100">
                        <img
                            src={imgUrl(product.image)}
                            alt={product.name}
                            className="w-full h-auto max-h-[500px] object-contain drop-shadow-xl"
                        />
                    </div>

                    {/* Right — Product Details */}
                    <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-white">
                        <h1 className="text-3xl lg:text-4xl font-black mb-4 text-gray-900 leading-tight">
                            {product.name}
                        </h1>
                        <p className="text-4xl font-black mb-6 flex items-baseline gap-2" style={{ color: 'var(--color-brand)' }}>
                            {parseFloat(product.price).toFixed(0)} <span className="text-2xl text-gray-400">ج.م</span>
                        </p>
                        <p className="text-gray-600 leading-relaxed text-lg mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            {product.description}
                        </p>

                        {/* Variant Selector */}
                        {product.variants.length > 0 && (
                            <div className="mb-8">
                                <h3 className="font-black text-gray-900 mb-4 text-lg border-b border-gray-100 pb-2">
                                    {VARIANT_LABELS[product.variants[0]?.variant_type] || 'اختر نوع'}
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {product.variants.map(v => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v)}
                                            disabled={v.stock === 0}
                                            className="px-6 py-3 rounded-xl font-bold text-sm transition-all border-2"
                                            style={{
                                                borderColor: selectedVariant?.id === v.id ? 'var(--color-brand)' : '#f1f5f9',
                                                background: selectedVariant?.id === v.id ? 'var(--color-brand)' : '#f8fafc',
                                                color: selectedVariant?.id === v.id ? '#fff' : v.stock === 0 ? '#cbd5e1' : '#475569',
                                                opacity: v.stock === 0 ? 0.6 : 1,
                                                cursor: v.stock === 0 ? 'not-allowed' : 'pointer',
                                                boxShadow: selectedVariant?.id === v.id ? '0 4px 14px rgba(255, 78, 0, 0.25)' : 'none'
                                            }}
                                        >
                                            {v.variant_value}
                                        </button>
                                    ))}
                                </div>
                                {/* Removed available stock count as requested */}
                            </div>
                        )}

                        {/* Quantity + Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8 pt-6 border-t border-gray-100">
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-2 gap-3 shrink-0">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 text-gray-600 hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors">
                                    <Minus className="w-5 h-5" />
                                </button>
                                <span className="text-xl font-black text-gray-900 w-8 text-center">{quantity}</span>
                                <button onClick={() => setQuantity(q => q + 1)}
                                    className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 text-gray-600 hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                            <button onClick={handleAddToCart}
                                className="flex-1 h-16 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3 text-white"
                                style={{ background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))' }}>
                                <ShoppingCart className="w-6 h-6" />
                                أضف للسلة
                            </button>
                        </div>

                        {/* Order Now Button */}
                        <button
                            onClick={() => setShowOrder(true)}
                            className="w-full h-16 rounded-2xl font-black text-xl border-2 border-[var(--color-brand)] text-[var(--color-brand)] bg-orange-50/50 hover:bg-[var(--color-brand)] hover:text-white hover:shadow-lg transition-all flex items-center justify-center gap-3"
                        >
                            🛍️ اطلب الآن مباشرة
                        </button>
                    </div>
                </motion.div>

                {/* Trust Badges - Below the card */}
                <div className="flex flex-wrap justify-center gap-6 lg:gap-12 mt-12">
                    <div className="flex items-center gap-3 text-gray-600 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
                        <ShieldCheck className="w-6 h-6 text-green-500" />
                        <span className="text-base font-bold">منتج أصلي 100%</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
                        <Truck className="w-6 h-6 text-blue-500" />
                        <span className="text-base font-bold">توصيل سريع</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
                        <Zap className="w-6 h-6 text-[var(--color-brand)]" />
                        <span className="text-base font-bold">جودة مضمونة</span>
                    </div>
                </div>
            </div>

            {/* Gallery Images Truly Edge to Edge without any max-width */}
            {product.gallery.length > 0 && (
                <div className="mt-16 w-full max-w-[100vw] overflow-hidden">
                    <h2 className="text-2xl lg:text-3xl font-black text-center text-gray-800 mb-8">تفاصيل المنتج والميزات</h2>
                    <div className="w-full flex flex-col items-center">
                        {product.gallery.map((g, idx) => (
                            <motion.div
                                key={g.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6 }}
                                className="w-full m-0 p-0 leading-none"
                            >
                                <img src={imgUrl(g.image_url)} alt={`${product.name} - التفاصيل ${idx + 1}`}
                                    className="w-full h-auto block m-0 p-0 object-cover"
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Order Modal */}
            <AnimatePresence>
                {showOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                        style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-lg overflow-y-auto shadow-2xl"
                            style={{ maxHeight: '90vh', direction: 'rtl' }}
                        >
                            {orderSuccess ? (
                                <div className="text-center py-10">
                                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                                    </div>
                                    <h3 className="text-3xl font-black text-gray-900 mb-4">تم إرسال طلبك!</h3>
                                    <p className="text-gray-500 text-lg mb-8 leading-relaxed">سنتواصل معك قريباً لتأكيد تفاصيل الطلب وترتيب التوصيل إلى عنوانك.</p>
                                    <button onClick={() => { setShowOrder(false); setOrderSuccess(false); }}
                                        className="w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg hover:-translate-y-1 transition-transform"
                                        style={{ background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))' }}>
                                        الاستمرار في التسوق
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-2xl font-black text-gray-900">إتمام الطلب السريع</h3>
                                        <button onClick={() => setShowOrder(false)}
                                            className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Order Summary */}
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-8 shadow-inner">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-20 h-20 bg-white rounded-xl shadow-sm p-1 border border-slate-100 shrink-0">
                                                <img src={imgUrl(product.image)} alt={product.name} className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900 line-clamp-1">{product.name}</p>
                                                {selectedVariant && <p className="text-sm font-semibold text-[var(--color-brand)] mt-1">{selectedVariant.variant_value}</p>}
                                                <p className="text-sm text-gray-500 mt-1">الكمية: {quantity}</p>
                                            </div>
                                            <div className="text-left shrink-0">
                                                <p className="font-black text-xl" style={{ color: 'var(--color-brand)' }}>
                                                    {(parseFloat(product.price) * quantity).toFixed(0)} <span className="text-sm">ج.م</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="space-y-4">
                                        {[
                                            { icon: User, label: 'الاسم الكامل *', key: 'name', placeholder: 'الاسم ثلاثي', type: 'text' },
                                            { icon: Phone, label: 'رقم الهاتف *', key: 'phone', placeholder: 'مثال: 01012345678', type: 'tel' },
                                            { icon: Mail, label: 'البريد الإلكتروني (اختياري)', key: 'email', placeholder: 'example@email.com', type: 'email' },
                                            { icon: MapPin, label: 'العنوان بالتفصيل *', key: 'address', placeholder: 'المحافظة، المدينة، الشارع، رقم البناية، الدور', type: 'text' },
                                            { icon: MessageSquare, label: 'ملاحظات (اختياري)', key: 'notes', placeholder: 'أي تفاصيل عن موعد الاستلام المفضل...', type: 'text' },
                                        ].map(field => (
                                            <div key={field.key}>
                                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                                    <field.icon className="w-4 h-4 text-gray-400" />
                                                    {field.label}
                                                </label>
                                                <input
                                                    type={field.type}
                                                    value={(orderForm as any)[field.key]}
                                                    onChange={e => setOrderForm(f => ({ ...f, [field.key]: e.target.value }))}
                                                    placeholder={field.placeholder}
                                                    className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand)]/10 text-gray-900 bg-white font-medium transition-all"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleOrder}
                                        disabled={ordering}
                                        className="w-full py-4 rounded-xl font-black text-white text-xl mt-8 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                                        style={{ background: ordering ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)' }}
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        {ordering ? 'جاري الإرسال...' : 'تأكيد الطلب السريع'}
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lightbox for Gallery (If needed, though we disabled zoom earlier, keeping for manual clicks) */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
                        style={{ background: 'rgba(0,0,0,0.95)' }}
                        onClick={() => setLightbox(null)}
                    >
                        <img src={lightbox} alt="preview" className="max-w-full max-h-full object-contain rounded-lg" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
