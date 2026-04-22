import type { FetchOptions } from "ofetch";
import { ofetch } from "ofetch";
import router from "@/router";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export function apiClient<T>(url: string, options?: FetchOptions): Promise<T> {
    return ofetch<T>(url, {
        baseURL: API_BASE,
        headers: {
            "Content-Type": "application/json",
        },
        onRequest({ options: opts }) {
            const token = localStorage.getItem("access_token");
            if (token) {
                opts.headers = {
                    ...opts.headers,
                    Authorization: `Bearer ${token}`,
                };
            }
        },
        onResponseError({ response }) {
            if (response.status === 401) {
                router.push("/auth/login");
            }
        },
        ...options,
    });
}
