import type { Ref } from 'vue';
import type { ThemeConfig } from '../utils/color-palettes';
import { computed, ref, watch } from 'vue';
import { config as defaultConfig } from '../ui/app-theme';
import {
    generateAllColors,
    generatePalette,
    tailwindShades,
    toTailwindShades,

} from '../utils/color-palettes';

const themeConfig = ref<ThemeConfig>({ ...defaultConfig });

/** Resolved palette for every named color, in Tailwind shade scale */
const resolvedColors = computed(() => {
    const cfg = themeConfig.value;
    const allColors = generateAllColors(cfg);
    const result: Record<string, Record<number, string>> = {};
    for (const [name, palette] of Object.entries(allColors)) {
        result[name] = toTailwindShades(palette);
    }
    return result;
});

/** Resolved primary palette in Tailwind shade scale */
const resolvedPrimary = computed(() => {
    const cfg = themeConfig.value;
    const palette = generatePalette(cfg.primaryColor, cfg.lightColor, cfg.darkColor, cfg.paletteStep);
    return toTailwindShades(palette);
});

/** Resolved surface/neutral palette in Tailwind shade scale */
const resolvedNeutral = computed(() => {
    const cfg = themeConfig.value;
    const palette = generatePalette(cfg.surfaceColor, cfg.lightColor, cfg.darkColor, cfg.paletteStep);
    return toTailwindShades(palette);
});

const STYLE_ID = 'app-theme-colors';

function applyToCSS() {
    const lines: string[] = [];

    // Primary palette
    for (const shade of tailwindShades) {
        lines.push(`--color-primary-${shade}: ${resolvedPrimary.value[shade]};`);
    }

    // Surface/neutral palette
    for (const shade of tailwindShades) {
        lines.push(`--color-surface-${shade}: ${resolvedNeutral.value[shade]};`);
    }

    // Named color palettes (overrides Tailwind built-in colors)
    for (const [name, shades] of Object.entries(resolvedColors.value)) {
        for (const shade of tailwindShades) {
            lines.push(`--color-${name}-${shade}: ${shades[shade]};`);
        }
    }

    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
        el = document.createElement('style');
        el.id = STYLE_ID;
        document.head.appendChild(el);
    }
    el.textContent = `:root {\n${lines.join('\n')}\n}`;
}

let watchStarted = false;

export function useTheme() {
    if (!watchStarted) {
        watchStarted = true;
        watch([resolvedPrimary, resolvedNeutral, resolvedColors], applyToCSS, { immediate: true });
    }

    /** Read a specific color value. Returns hex string. */
    function getColor(name: string, shade: number): string {
        if (name === 'primary') {
            return resolvedPrimary.value[shade] ?? '';
        }
        if (name === 'neutral') {
            return resolvedNeutral.value[shade] ?? '';
        }
        return resolvedColors.value[name]?.[shade] ?? '';
    }

    /** Update the primary color and regenerate the palette */
    function setPrimaryColor(hex: string) {
        themeConfig.value = { ...themeConfig.value, primaryColor: hex };
    }

    /** Update the surface/neutral color and regenerate the palette */
    function setNeutralColor(hex: string) {
        themeConfig.value = { ...themeConfig.value, surfaceColor: hex };
    }

    /** Replace the entire theme config */
    function setThemeConfig(cfg: ThemeConfig) {
        themeConfig.value = { ...cfg };
    }

    return {
        /** Reactive theme config — mutate to trigger CSS update */
        config: themeConfig as Ref<ThemeConfig>,
        /** Primary palette (Tailwind shades) — reactive */
        primary: resolvedPrimary,
        /** Neutral palette (Tailwind shades) — reactive */
        neutral: resolvedNeutral,
        /** All named color palettes — reactive */
        colors: resolvedColors,
        getColor,
        setPrimaryColor,
        setNeutralColor,
        setThemeConfig,
    };
}
