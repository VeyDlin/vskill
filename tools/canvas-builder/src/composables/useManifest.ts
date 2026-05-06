import type { Manifest, ManifestConfig } from "@/schemas/manifest.schema";
import { onMounted, ref } from "vue";
import { manifestConfigSchema, manifestSchema } from "@/schemas/manifest.schema";

declare global {
    interface Window {
        SCREENS?: unknown;
        SCREENS_CONFIG?: unknown;
    }
}

type ManifestState = "loading" | "empty" | "error" | "ready";

const MANIFEST_SRC = "./screens.js";

export function useManifest() {
    const state = ref<ManifestState>("loading");
    const screens = ref<Manifest>([]);
    const config = ref<ManifestConfig>(undefined);
    const error = ref<string | null>(null);

    onMounted(() => {
        const script = document.createElement("script");
        script.src = MANIFEST_SRC;

        script.onload = () => {
            const raw = window.SCREENS;
            if (raw === undefined) {
                state.value = "error";
                error.value = `${MANIFEST_SRC} loaded but window.SCREENS is undefined.`;
                return;
            }

            const result = manifestSchema.safeParse(raw);
            if (!result.success) {
                state.value = "error";
                error.value = formatZodError(result.error);
                return;
            }

            const cfgRaw = window.SCREENS_CONFIG;
            if (cfgRaw !== undefined) {
                const cfgResult = manifestConfigSchema.safeParse(cfgRaw);
                if (!cfgResult.success) {
                    state.value = "error";
                    error.value = `SCREENS_CONFIG: ${formatZodError(cfgResult.error)}`;
                    return;
                }
                config.value = cfgResult.data;
            }

            if (result.data.length === 0) {
                state.value = "empty";
                return;
            }

            screens.value = result.data;
            state.value = "ready";
        };

        script.onerror = () => {
            state.value = "error";
            error.value = `Can't load ${MANIFEST_SRC}. Make sure it sits next to canvas.html and assigns window.SCREENS.`;
        };

        document.head.appendChild(script);
    });

    return { state, screens, config, error };
}

function formatZodError(err: { issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }> }): string {
    const first = err.issues[0];
    if (first === undefined) {
        return "Manifest failed schema validation.";
    }
    const path = first.path.join(".") || "(root)";
    return `Manifest entry ${path}: ${first.message}`;
}
