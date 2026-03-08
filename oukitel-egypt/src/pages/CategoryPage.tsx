import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import api, { imgUrl } from '../services/api';

interface Variant { id: number; variant_type: string; variant_value: string; stock: number; }
interface Product {
    id: number; name: string; description: string; price: string;
    category_id: string; category_arabic: string; image: string;
    variants: Variant[]; is_active: boolean;
}
interface Category { id: string; name: string; arabic_name: string; image: string; description: string; }

const CATEGORY_ACCENT: Record<string, string> = {
    devices: 'rgba(59, 130, 246, 0.85)',
    disposables: 'rgba(249, 115, 22, 0.85)',
    cartridges: 'rgba(16, 185, 129, 0.85)',
};

const FALLBACK_BG: Record<string, string> = {
    devices: '/Oukitel-Mate-Max-4.jpg',
    disposables: '/Oukitel-Mate-Clear-1.jpg',
    cartridges: '/Oukitel-Mate-Max-5.jpg',
};

export default function CategoryPage({ addToCart }: { addToCart: (p: any, qty: number) => void }) {
    const { categoryId } = useParams<{ categoryId: string }>();
    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!categoryId) return;
        setLoading(true);
        Promise.all([
            api.getCategories(),
            api.getProducts(categoryId),
        ]).then(([cats, prods]) => {
            const cat = cats.find((c: Category) => c.id === categoryId);
            setCategory(cat || null);
            setProducts(prods);
        }).catch(() => {
            setCategory(null);
            setProducts([]);
        }).finally(() => setLoading(false));
    }, [categoryId]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center pt-24" style={{ background: 'var(--color-lighter)' }}>
            <div style={{ width: 48, height: 48, border: '4px solid #FF4E00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    );

    if (!category) return (
        <div className="min-h-screen flex items-center justify-center pt-24 flex-col gap-4">
            <p className="text-2xl font-bold">الفئة غير موجودة</p>
            <Link to="/" className="text-[var(--color-brand)] underline">العودة للرئيسية</Link>
        </div>
    );

    const accent = CATEGORY_ACCENT[category.id] || 'rgba(0,0,0,0.7)';
    const bgImage = category.image ? imgUrl(category.image) : FALLBACK_BG[category.id] || '/Oukitel-Mate-Max-4.jpg';

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-lighter)' }}>

            {/* Hero */}
            <section className="relative min-h-[55vh] flex items-end overflow-hidden">
                <motion.div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${bgImage})` }}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.2 }}
                />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${accent} 0%, transparent 60%)` }} />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 w-full">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <h1 className="text-5xl lg:text-7xl font-black text-white mb-4">{category.arabic_name}</h1>
                        {category.description && <p className="text-white/80 text-xl max-w-xl">{category.description}</p>}
                        <div className="flex gap-6 mt-6">
                            <div className="text-white/90">
                                <div className="text-3xl font-black">{products.length}</div>
                                <div className="text-sm text-white/70">منتج متاح</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Products Grid */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {products.length === 0 ? (
                        <div className="text-center py-24">
                            <p className="text-2xl font-bold text-gray-400">لا توجد منتجات في هذه الفئة حتى الآن</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((p, i) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Link
                                        to={`/product/${p.id}`}
                                        className="group block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1"
                                    >
                                        <div className="relative h-56 bg-gray-50 overflow-hidden">
                                            <img
                                                src={imgUrl(p.image)}
                                                alt={p.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-black text-gray-900 text-lg mb-1 line-clamp-1">{p.name}</h3>
                                            <p className="text-gray-500 text-sm line-clamp-2 mb-3">{p.description}</p>
                                            {/* Variants preview */}
                                            {p.variants.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {p.variants.slice(0, 4).map(v => (
                                                        <span key={v.id} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                                                            {v.variant_value}
                                                        </span>
                                                    ))}
                                                    {p.variants.length > 4 && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">+{p.variants.length - 4}</span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-2xl font-black" style={{ color: 'var(--color-brand)' }}>
                                                    {parseFloat(p.price).toFixed(0)} <span className="text-sm font-medium text-gray-400">ج.م</span>
                                                </span>
                                                <button
                                                    onClick={e => { e.preventDefault(); addToCart(p, 1); }}
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110"
                                                    style={{ background: 'var(--color-brand)' }}
                                                >
                                                    <ShoppingCart className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
