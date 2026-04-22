<script setup lang="ts">
import { computed } from "vue";
import { useTheme } from "@/composables/useTheme";

interface Emits {
    (event: "zoomIn"): void;
    (event: "zoomOut"): void;
    (event: "fitAll"): void;
    (event: "reset"): void;
}

const emit = defineEmits<Emits>();

const { theme, toggle } = useTheme();

const themeIcon = computed(() =>
    theme.value === "dark"
        ? "i-material-symbols:light-mode-outline"
        : "i-material-symbols:dark-mode-outline",
);
</script>

<template>
    <div class="toolbar">
        <UButton icon="i-material-symbols:remove-rounded" variant="ghost" size="sm" color="neutral" @click="emit('zoomOut')" />
        <UButton icon="i-material-symbols:add-rounded" variant="ghost" size="sm" color="neutral" @click="emit('zoomIn')" />
        <div class="divider" />
        <UButton variant="ghost" size="sm" color="neutral" @click="emit('fitAll')">
            Fit all
        </UButton>
        <UButton variant="ghost" size="sm" color="neutral" @click="emit('reset')">
            100%
        </UButton>
        <div class="divider" />
        <UButton :icon="themeIcon" variant="ghost" size="sm" color="neutral" @click="toggle" />
    </div>
</template>

<style scoped lang="scss">
.toolbar {
    position: fixed;
    bottom: 1.25rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem;
    border-radius: 0.5rem;
    background: var(--canvas-toolbar-bg);
    color: var(--canvas-toolbar-text);
    border: 1px solid var(--canvas-toolbar-border);
    box-shadow: var(--canvas-toolbar-shadow);
    z-index: 10;
    user-select: none;

    .divider {
        width: 1px;
        height: 1.25rem;
        background: var(--canvas-toolbar-border);
        margin: 0 0.25rem;
    }
}
</style>
