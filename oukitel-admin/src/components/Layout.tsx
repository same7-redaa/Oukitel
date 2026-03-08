import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Home, Package, FolderOpen, ShoppingBag, LogOut, Zap, Settings } from 'lucide-react';

const navItems = [
    { to: '/', icon: Home, label: 'الرئيسية' },
    { to: '/products', icon: Package, label: 'المنتجات' },
    { to: '/categories', icon: FolderOpen, label: 'الفئات' },
    { to: '/orders', icon: ShoppingBag, label: 'الطلبات' },
    { to: '/settings', icon: Settings, label: 'الإعدادات' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
    const { logout } = useAuth();
    const { pathname } = useLocation();

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 right-0 w-64 bg-slate-900 shadow-xl z-50 flex flex-col">
                <div className="flex items-center gap-3 p-6 border-b border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                        <Zap size={22} className="text-white" fill="currentColor" />
                    </div>
                    <div>
                        <div className="text-white font-black text-lg tracking-wide leading-tight">Oukitel Egypt</div>
                        <div className="text-white/50 text-xs font-bold">لوحة التحكم السريعة</div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    {navItems.map(item => {
                        const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 border ${isActive
                                    ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                                    : 'text-white/60 border-transparent hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={logout}
                        className="flex items-center justify-center w-full gap-2 p-3 text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-xl font-bold transition-colors border border-red-400/20 text-sm"
                    >
                        <LogOut size={16} />
                        تسجيل الخروج
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 mr-64 flex flex-col min-h-screen">
                <div className="flex-1 p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
