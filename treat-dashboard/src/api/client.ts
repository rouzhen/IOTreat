const BASE_URL = import.meta.env.VITE_API_URL;

async function api(path: string, options: RequestInit = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    if (!res.ok) {
        throw new Error(`API error ${res.status}`);
    }
    return res.json();
}

export const apiGet = (path: string) => api(path);
export const apiPost = (path: string, body: any) =>
    api(path, { method: "POST", body: JSON.stringify(body) });
