/**
 * api.ts — All API calls use relative paths via PHP backend
 * No VITE_API_URL needed — works on any domain after upload!
 */

export const imgUrl = (path: string): string => {
    if (!path) return '/Oukitel-Mate-Clear-1.jpg';
    if (path.startsWith('http')) return path;
    return path; // relative paths like /api/uploads/... work as-is
};

async function apiFetch(url: string, options?: RequestInit) {
    const res = await fetch(url, options);
    if (!res.ok) {
        const text = await res.text();
        try { throw new Error(JSON.parse(text)?.error || text); }
        catch { throw new Error(text); }
    }
    return res.json();
}

export const api = {
    getCategories: () => apiFetch('/api/categories.php'),
    getProducts: (category?: string) =>
        apiFetch(category ? `/api/products.php?category=${category}` : '/api/products.php'),
    getProduct: (id: number | string) => apiFetch(`/api/products.php?id=${id}`),
    createOrder: (data: any) =>
        apiFetch('/api/orders.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }),
    getSettings: () => apiFetch('/api/settings.php'),
};

export default api;
