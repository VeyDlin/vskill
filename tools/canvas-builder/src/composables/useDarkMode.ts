import { ref, watch } from "vue";

type Mode = "light" | "dark";

const STORAGE_KEY = "canvas-theme";
const current = ref<Mode>("light");

function getInitial(): Mode {
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

function apply(mode: Mode): void {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.dataset.theme = mode;
}

export function initDarkMode(): void {
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

export function useDarkMode() {
    function toggle(): void {
        current.value = current.value === "light" ? "dark" : "light";
    }
    return { mode: current, toggle };
}
