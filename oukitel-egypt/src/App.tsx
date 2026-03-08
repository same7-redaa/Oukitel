import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, ChevronLeft, ChevronRight, Star, Truck, ShieldCheck, Zap, Instagram, Facebook, Trash2, Plus, Minus, User, Phone, MapPin, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api, { imgUrl } from './services/api';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';

type Product = {
  id: number;
  name: string;
  price: string;
  image: string;
  category_id: string;
  category_arabic: string;
  description: string;
  variants: any[];
  gallery: any[];
};

type CartItem = {
  product: Product;
  quantity: number;
  selectedVariant?: any;
};

const heroSlides = [
  {
    image: "/Oukitel-Mate-Clear-1.jpg",
    title: "ارتقِ بتجربة",
    highlight: "الفيب الخاصة بك",
    description: "نقدم لك أحدث أجهزة الفيب والنكهات العالمية الأصلية 100%. اكتشف مجموعة أوكيتيل الحصرية الآن مع توصيل سريع لجميع محافظات مصر."
  },
  {
    image: "/Oukitel-Mate-Max-4.jpg",
    title: "نكهات جديدة",
    highlight: "تأسر حواسك",
    description: "اكتشف تشكيلة النكهات الجديدة والمميزة. جودة عالية ومذاق رائع يدوم طويلاً، مصممة خصيصاً لعشاق التميز."
  },
  {
    image: "/Oukitel-Mate-Max-5.jpg",
    title: "أحدث الأجهزة",
    highlight: "بين يديك",
    description: "نوفر لك أحدث الأجهزة الذكية بتصاميم عصرية وأداء قوي. احصل على جهازك الآن وتمتع بتجربة لا مثيل لها."
  }
];

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Small delay to let page render before scrolling
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

function MainLayout({ children, isScrolled, isMobileMenuOpen, setIsMobileMenuOpen, cartCount, isCartOpen, setIsCartOpen, cartItems, cartTotal, updateQuantity, removeFromCart, clearCart, settings }: any) {
  const { pathname } = useLocation();
  // Apply glass pills only on pages with a hero image background
  const isHeroPage = pathname === '/' || pathname.startsWith('/category/');
  const useGlass = !isScrolled && isHeroPage;

  const [showCheckout, setShowCheckout] = useState(false);
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Reset states when cart opens/closes
  useEffect(() => {
    if (!isCartOpen) {
      setTimeout(() => {
        setShowCheckout(false);
        setOrderSuccess(false);
        setOrderForm({ name: '', phone: '', address: '', notes: '' });
      }, 300);
    }
  }, [isCartOpen]);

  const handleCreateOrder = async () => {
    if (!orderForm.name || !orderForm.phone || !orderForm.address) {
      alert('يرجى ملء الاسم والهاتف والعنوان');
      return;
    }
    setOrdering(true);
    try {
      await api.createOrder({
        customer_name: orderForm.name,
        phone: orderForm.phone,
        address: orderForm.address,
        notes: orderForm.notes,
        items: cartItems.map((item: any) => ({
          product_id: item.product.id,
          variant_id: item.selectedVariant?.id || null,
          quantity: item.quantity,
        })),
      });
      setOrderSuccess(true);
      clearCart();
    } catch {
      alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-lighter)] text-gray-900 overflow-x-hidden flex flex-col">
      <ScrollToTop />
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled || !isHeroPage
        ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 py-4 shadow-sm'
        : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">

            {/* Logo */}
            <Link to="/" className={`flex items-center gap-2 cursor-pointer transition-all ${useGlass ? 'bg-white/15 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full shadow-md' : ''
              }`}>
              <Zap className={`w-7 h-7 transition-colors ${isScrolled || !isHeroPage ? 'text-[var(--color-brand)]' : 'text-white'}`} />
              <span className={`text-xl font-bold tracking-wider uppercase transition-colors ${isScrolled || !isHeroPage ? 'text-gray-900' : 'text-white'}`}>
                Oukitel <span className={isScrolled || !isHeroPage ? 'text-[var(--color-brand)]' : 'text-white/80'}>Egypt</span>
              </span>
            </Link>

            {/* Desktop Nav - each link its own glass pill */}
            <div className="hidden md:flex items-center gap-3">
              {[{ to: '/', label: 'الرئيسية' }, { to: '/#products', label: 'المنتجات' }, { to: '/#features', label: 'المميزات' }, { to: '/#contact', label: 'تواصل معنا' }].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-semibold transition-all px-4 py-2 rounded-full ${isScrolled || !isHeroPage
                    ? 'text-gray-800 hover:text-[var(--color-brand)] hover:bg-gray-100'
                    : 'text-white bg-white/15 backdrop-blur-md border border-white/30 shadow-md hover:bg-white/25'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Actions - each its own glass pill */}
            <div className="flex items-center gap-3">
              <button
                className={`relative p-2.5 rounded-full transition-all ${isScrolled || !isHeroPage
                  ? 'text-gray-800 hover:bg-gray-100'
                  : 'text-white bg-white/15 backdrop-blur-md border border-white/30 shadow-md hover:bg-white/25'
                  }`}
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[var(--color-brand)] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                className={`md:hidden p-2.5 rounded-full transition-all ${isScrolled || !isHeroPage
                  ? 'text-gray-800 hover:bg-gray-100'
                  : 'text-white bg-white/15 backdrop-blur-md border border-white/30 shadow-md hover:bg-white/25'
                  }`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-[var(--color-lighter)] pt-24 px-4 md:hidden overflow-y-auto"
          >
            <div className="flex flex-col gap-6 text-center">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-medium text-gray-900 border-b border-gray-100 pb-4">الرئيسية</Link>
              <a href="/#products" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-medium text-gray-900 border-b border-gray-100 pb-4">المنتجات</a>
              <a href="/#features" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-medium text-gray-900 border-b border-gray-100 pb-4">المميزات</a>
              <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-medium text-gray-900">تواصل معنا</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-[var(--color-brand)]" />
                  السلة ({cartCount})
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {orderSuccess ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3">تم إرسال طلبك!</h3>
                  <p className="text-gray-600 mb-8">سنتواصل معك قريباً لتأكيد الطلب وترتيب التوصيل.</p>
                  <button onClick={() => setIsCartOpen(false)}
                    className="w-full py-4 rounded-2xl font-bold text-white text-lg bg-[var(--color-brand)] shadow-lg">
                    الاستمرار في التسوق
                  </button>
                </div>
              ) : showCheckout ? (
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                  <button onClick={() => setShowCheckout(false)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-semibold mb-2">
                    <ChevronRight className="w-5 h-5" />
                    العودة للسلة
                  </button>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">بيانات التوصيل</h3>

                  {[
                    { icon: User, label: 'الاسم الكامل *', key: 'name', placeholder: 'اسمك الثلاثي', type: 'text' },
                    { icon: Phone, label: 'رقم الهاتف *', key: 'phone', placeholder: '01xxxxxxxxx', type: 'tel' },
                    { icon: MapPin, label: 'العنوان بالتفصيل *', key: 'address', placeholder: 'المحافظة، المدينة، الشارع، رقم العمارة...', type: 'text' },
                    { icon: MessageSquare, label: 'ملاحظات إضافية (اختياري)', key: 'notes', placeholder: 'أي تفاصيل أخرى...', type: 'text' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                        <field.icon className="w-4 h-4 text-[var(--color-brand)]" />
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        value={(orderForm as any)[field.key]}
                        onChange={e => setOrderForm(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[var(--color-brand)] text-gray-900 bg-gray-50 mb-2"
                      />
                    </div>
                  ))}

                  <div className="mt-4 border-t border-gray-100 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600 font-medium">المجموع (بدون الشحن)</span>
                      <span className="text-2xl font-black text-gray-900">{cartTotal.toLocaleString()} <span className="text-sm font-normal">ج.م</span></span>
                    </div>
                    <button
                      onClick={handleCreateOrder}
                      disabled={ordering || cartItems.length === 0}
                      className="w-full bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-400"
                    >
                      {ordering ? 'جاري الإرسال...' : 'تأكيد وإرسال الطلب'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {cartItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg">سلة المشتريات فارغة</p>
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="mt-6 text-[var(--color-brand)] font-semibold hover:underline"
                        >
                          تصفح المنتجات
                        </button>
                      </div>
                    ) : (
                      cartItems.map((item, idx) => (
                        <div key={`${item.product.id}-${item.selectedVariant?.id || 'base'}`} className="flex gap-4 p-4 border border-gray-100 rounded-2xl relative group">
                          <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                            <img src={imgUrl(item.product.image)} alt={item.product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-sm mb-1 pr-6">{item.product.name}</h3>
                            {item.selectedVariant && (
                              <p className="text-xs font-semibold text-slate-500 mb-2">{item.selectedVariant.variant_type}: {item.selectedVariant.variant_value}</p>
                            )}
                            <p className="text-[var(--color-brand)] font-semibold text-sm mb-3">{item.product.price}</p>
                            <div className="flex items-center gap-3 bg-gray-50 w-fit rounded-lg p-1 border border-gray-200">
                              <button
                                onClick={() => updateQuantity(item.product.id, -1, item.selectedVariant?.id)}
                                className="p-1 hover:bg-white rounded-md shadow-sm transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-4 text-center text-sm font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.product.id, 1, item.selectedVariant?.id)}
                                className="p-1 hover:bg-white rounded-md shadow-sm transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id, item.selectedVariant?.id)}
                            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {cartItems.length > 0 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600 font-medium">المجموع الإجمالي</span>
                        <span className="text-2xl font-black text-gray-900">{cartTotal.toLocaleString()} <span className="text-sm font-normal">ج.م</span></span>
                      </div>
                      <button
                        onClick={() => setShowCheckout(true)}
                        className="w-full bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                        إتمام الطلب
                        <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{cartCount}</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-[var(--color-surface)] pt-20 pb-10 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Link to="/"><Zap className="text-[var(--color-brand)] w-8 h-8" /></Link>
                <Link to="/"><span className="text-2xl font-bold tracking-wider uppercase text-gray-900">Oukitel <span className="text-[var(--color-brand)]">Egypt</span></span></Link>
              </div>
              <p className="text-gray-600 max-w-sm mb-8 leading-relaxed">
                الوجهة الأولى لمنتجات الفيب في مصر. نقدم لك أفضل الأجهزة والنكهات العالمية بأسعار تنافسية وتوصيل سريع.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://www.instagram.com/egyptoukitel?igsh=MXB4Mm53aXFweGJtbA=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[var(--color-brand)] hover:text-white hover:border-[var(--color-brand)] transition-all shadow-sm"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://www.facebook.com/share/1AeUKzjKwR/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[var(--color-brand)] hover:text-white hover:border-[var(--color-brand)] transition-all shadow-sm"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 text-gray-900">روابط سريعة</h4>
              <ul className="space-y-4">
                <li><Link to="/" className="text-gray-600 hover:text-[var(--color-brand)] transition-colors">الرئيسية</Link></li>
                <li><a href="/#products" className="text-gray-600 hover:text-[var(--color-brand)] transition-colors">المنتجات</a></li>
                <li><a href="/#features" className="text-gray-600 hover:text-[var(--color-brand)] transition-colors">المميزات</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 text-gray-900">تواصل معنا</h4>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-center gap-2">
                  <span dir="ltr" className="text-left inline-block">{settings.phone || '+20 100 000 0000'}</span>
                </li>
                <li>{settings.email || 'Oukitelegypt5@gmail.com'}</li>
                <li>القاهرة، مصر</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Oukitel Egypt. جميع الحقوق محفوظة.
            </p>
            <p className="text-gray-500 text-sm">
              تحذير: هذا الموقع مخصص للبالغين فقط (18+). منتجاتنا تحتوي على النيكوتين، وهي مادة تسبب الإدمان.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('oukitel_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('oukitel_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const [settings, setSettings] = useState({ phone: '', email: '' });
  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => { });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addToCart = (product: Product, quantity: number = 1, selectedVariant?: any) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id && item.selectedVariant?.id === selectedVariant?.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id && item.selectedVariant?.id === selectedVariant?.id
            ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        return [...prevItems, { product, quantity, selectedVariant }];
      }
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number, variantId?: number) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems
        .map((item) =>
          item.product.id === productId && item.selectedVariant?.id === variantId
            ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0);
      return updatedItems;
    });
  };

  const removeFromCart = (productId: string, variantId?: number) => {
    setCartItems((prevItems) => prevItems.filter((item) => !(item.product.id === productId && item.selectedVariant?.id === variantId)));
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <Router>
      <MainLayout
        isScrolled={isScrolled}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        cartCount={cartCount}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        cartItems={cartItems}
        cartTotal={cartTotal}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        clearCart={clearCart}
        settings={settings}
      >
        <Routes>
          <Route path="/" element={<HomePage addToCart={addToCart} heroSlides={heroSlides} />} />
          <Route path="/product/:productId" element={<ProductPage addToCart={addToCart} />} />
          <Route path="/category/:categoryId" element={<CategoryPage addToCart={addToCart} />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

const FALLBACK_IMAGES: Record<string, string> = {
  devices: '/Oukitel-Mate-Max-4.jpg',
  disposables: '/Oukitel-Mate-Clear-1.jpg',
  cartridges: '/Oukitel-Mate-Max-5.jpg',
};

function HomePage({ addToCart, heroSlides }: any) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState('All');
  const [apiCategories, setApiCategories] = useState<any[]>([]);
  const [apiProducts, setApiProducts] = useState<any[]>([]);

  useEffect(() => {
    api.getCategories().then(setApiCategories).catch(() => { });
    api.getProducts().then(setApiProducts).catch(() => { });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  return (
    <>
      <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Carousel Backgrounds */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-0"
          >
            <img
              src={heroSlides[currentSlide].image}
              alt="Vape Background"
              className="w-full h-full object-cover opacity-100"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brand)] via-[var(--color-brand)]/40 to-transparent mix-blend-multiply"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col md:flex-row items-center justify-between pb-24 md:pb-0">
          <div className="max-w-2xl w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="bg-white/85 backdrop-blur-lg p-8 sm:p-12 rounded-[2.5rem] border border-white shadow-2xl"
              >
                <span className="inline-block py-1 px-3 rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] text-sm font-semibold mb-6 border border-[var(--color-brand)]/20 shadow-sm">
                  التجربة الأفضل في مصر
                </span>
                <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight text-gray-900">
                  {heroSlides[currentSlide].title} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand)] to-orange-400">
                    {heroSlides[currentSlide].highlight}
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-xl leading-relaxed">
                  {heroSlides[currentSlide].description}
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="#products" className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white px-8 py-4 rounded-full font-bold transition-all flex items-center gap-2 shadow-lg shadow-[var(--color-brand)]/30">
                    تسوق الآن
                    <ChevronLeft className="w-5 h-5" />
                  </a>
                  <a href="#features" className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-full font-bold transition-all shadow-md border border-gray-200">
                    اكتشف المزيد
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop Carousel Controls */}
          <div className="hidden md:flex flex-col gap-4">
            <button
              onClick={prevSlide}
              className="p-3 rounded-full bg-white/80 hover:bg-[var(--color-brand)] hover:text-white text-gray-900 shadow-md backdrop-blur-sm transition-all hover:-translate-y-1 border border-gray-200 hover:border-transparent"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="p-3 rounded-full bg-white/80 hover:bg-[var(--color-brand)] hover:text-white text-gray-900 shadow-md backdrop-blur-sm transition-all hover:translate-y-1 border border-gray-200 hover:border-transparent"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6 md:hidden z-10 px-4">
          <button
            onClick={prevSlide}
            className="p-3 rounded-full bg-white/80 hover:bg-[var(--color-brand)] hover:text-white text-gray-900 shadow-md backdrop-blur-sm transition-all border border-gray-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex gap-2 items-center">
            {heroSlides.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${idx === currentSlide ? 'w-8 bg-[var(--color-brand)]' : 'w-2 bg-gray-300'}`}
                aria-label={`الشريحة ${idx + 1}`}
              />
            ))}
          </div>
          <button
            onClick={nextSlide}
            className="p-3 rounded-full bg-white/80 hover:bg-[var(--color-brand)] hover:text-white text-gray-900 shadow-md backdrop-blur-sm transition-all border border-gray-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[var(--color-surface)] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: "منتجات أصلية 100%", desc: "جميع منتجاتنا أصلية ومضمونة من المصدر مباشرة." },
              { icon: Truck, title: "توصيل سريع", desc: "توصيل لجميع محافظات مصر في أسرع وقت ممكن." },
              { icon: Star, title: "جودة استثنائية", desc: "نختار أفضل العلامات التجارية العالمية لضمان تجربة مميزة." }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[var(--color-brand)]/30 transition-all group"
              >
                <div className="w-14 h-14 bg-[var(--color-brand)]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[var(--color-brand)]/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-[var(--color-brand)]" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-24 relative bg-[var(--color-lighter)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Categories Section */}
          <section className="py-12 bg-white rounded-3xl mb-16 px-8">
            <div className="mb-10">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-2">تسوق حسب الفئة</h2>
              <p className="text-gray-500 text-lg">اختر الفئة التي تناسبك</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {apiCategories.map((cat: any, idx: number) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link
                    to={`/category/${cat.id}`}
                    className="block relative h-64 rounded-3xl overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <img
                      src={cat.image ? imgUrl(cat.image) : FALLBACK_IMAGES[cat.id] || '/Oukitel-Mate-Max-4.jpg'}
                      alt={cat.arabic_name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                      <span className="text-white/70 text-xs font-bold uppercase tracking-widest block mb-1">{cat.name}</span>
                      <h3 className="text-white text-2xl font-black">{cat.arabic_name}</h3>
                      <span className="inline-block mt-2 text-xs text-white/80 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">تصفح الآن ←</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl md:text-5xl font-black mb-4 text-gray-900">الأكثر مبيعاً</h2>
              <p className="text-gray-600 text-lg">اكتشف تشكيلتنا المميزة من أجهزة ونكهات الفيب</p>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-4 scrollbar-hide">
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap border ${activeCategory === 'All'
                ? 'bg-[var(--color-brand)] text-white border-transparent shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
            >الكل</button>
            {apiCategories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2 rounded-lg font-semibold transition-all whitespace-nowrap border ${activeCategory === cat.id
                  ? 'bg-[var(--color-brand)] text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
              >{cat.arabic_name}</button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {apiProducts
              .filter((p: Product) => activeCategory === 'All' || p.category_id === activeCategory)
              .map((product: Product, idx: number) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all group flex flex-col"
                >
                  <Link to={`/product/${product.id}`} className="relative h-64 overflow-hidden bg-gray-100 block">
                    <img
                      src={imgUrl(product.image)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-900 border border-gray-200 shadow-sm">
                      {product.category_arabic}
                    </div>
                  </Link>
                  <div className="p-6 flex flex-col flex-grow">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="text-lg font-bold line-clamp-1 text-gray-900 hover:text-[var(--color-brand)] transition-colors mb-1">{product.name}</h3>
                    </Link>
                    {product.variants?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {product.variants.slice(0, 3).map((v: any) => (
                          <span key={v.id} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{v.variant_value}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-[var(--color-brand)] font-bold text-xl mb-4">{parseFloat(product.price).toFixed(0)} ج.م</p>
                    <div className="mt-auto flex gap-3">
                      <button
                        onClick={() => addToCart(product, 1)}
                        className="flex-1 h-12 bg-gray-50 hover:bg-[var(--color-brand)] text-gray-900 hover:text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border border-gray-200 hover:border-transparent text-sm"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                      <Link
                        to={`/product/${product.id}`}
                        className="flex-[2] h-12 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-xl font-semibold transition-colors flex items-center justify-center border border-gray-200 text-sm"
                      >
                        التفاصيل
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>

          <div className="mt-10 text-center md:hidden">
            <a href="#" className="inline-flex items-center gap-2 text-[var(--color-brand)] font-semibold hover:text-[var(--color-brand-dark)] transition-colors">
              عرض الكل
              <ChevronLeft className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-brand)]">
          <div className="absolute inset-0 bg-white/10"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-white">هل تبحث عن نكهة معينة؟</h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            فريقنا مستعد لمساعدتك في اختيار الجهاز والنكهة الأنسب لك. تواصل معنا الآن للحصول على استشارة مجانية.
          </p>
          <a href="#contact" className="inline-block bg-white hover:bg-gray-50 text-[var(--color-brand)] px-10 py-4 rounded-full font-bold text-lg transition-colors shadow-2xl">
            تحدث معنا على واتساب
          </a>
        </div>
      </section>
    </>
  );
}
