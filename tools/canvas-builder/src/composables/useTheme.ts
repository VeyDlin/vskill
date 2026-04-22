import { ref, watch } from "vue";

type Theme = "light" | "dark";

const STORAGE_KEY = "canvas-theme";
const current = ref<Theme>("light");

function getInitial(): Theme {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark") {
            return stored;
        }
    }
    catch {
        // localStorage may throw in file:// with strict policies; ignore.
    }
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }
    return "light";
}

function apply(theme: Theme): void {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.dataset.theme = theme;
}

export function initTheme(): void {
    current.value = getInitial();
    apply(current.value);
    watch(current, (next) => {
        apply(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        }
        catch {
            // localStorage write may fail silently.
        }
    });
}

export function useTheme() {
    function toggle(): void {
        current.value = current.value === "light" ? "dark" : "light";
    }
    return { theme: current, toggle };
}
