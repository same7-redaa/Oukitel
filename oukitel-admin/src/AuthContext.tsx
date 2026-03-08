import React, { createContext, useContext, useState } from 'react';
import API from './api';

interface AuthContextType {
    isLoggedIn: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('admin_token'));

    const login = async (username: string, password: string) => {
        // PHP admin endpoint: POST /api/admin.php?action=login
        const res = await API.post('/api/admin.php?action=login', { username, password });
        localStorage.setItem('admin_token', res.data.token);
        setIsLoggedIn(true);
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
};
