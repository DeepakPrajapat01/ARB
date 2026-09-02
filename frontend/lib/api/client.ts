import { auth } from "../firebase/auth";

export class ApiClient {
    static async request(endpoint: string, options: RequestInit = {}) {
        const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
        const headers = new Headers(options.headers || {});

        // Inject Firebase ID Token automatically for authenticated requests
        const currentUser = auth.currentUser;
        if (currentUser) {
            const token = await currentUser.getIdToken();
            headers.set("Authorization", `Bearer ${token}`);
        }

        if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
            headers.set("Content-Type", "application/json");
        }

        const response = await fetch(`${baseURL}${endpoint}`, { ...options, headers });

        if (!response.ok) {
            if (response.status === 401) {
                console.warn("Unauthenticated request rejected by backend.");
            }
            const errorData = await response.json().catch(() => null) as { message?: string } | null;
            throw new Error(errorData?.message ?? `API request failed: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return response.json();
        }
        return response.text();
    }

    static get(endpoint: string, options?: RequestInit) {
        return this.request(endpoint, { ...options, method: "GET" });
    }

    static post(endpoint: string, body: unknown, options?: RequestInit) {
        return this.request(endpoint, { ...options, method: "POST", body: JSON.stringify(body) });
    }

    static put(endpoint: string, body: unknown, options?: RequestInit) {
        return this.request(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) });
    }
}
