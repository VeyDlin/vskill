<script setup lang="ts">
import { computed } from "vue";
import { useDarkMode } from "@/composables/useDarkMode";

interface Emits {
    (event: "zoomIn"): void;
    (event: "zoomOut"): void;
    (event: "fitAll"): void;
    (event: "reset"): void;
}

const emit = defineEmits<Emits>();

const { mode, toggle } = useDarkMode();

const themeIcon = computed(() =>
    mode.value === "dark"
        ? "i-material-symbols:light-mode-outline"
        : "i-material-symbols:dark-mode-outline",
);
</script>

<template>
    <UCard
        :ui="{ body: 'p-1.5 sm:p-1.5 flex items-center gap-0.5' }"
        class="fixed bottom-5 left-1/2 -translate-x-1/2 z-10 shadow-lg select-none"
    >
        <UButton
            icon="i-material-symbols:remove-rounded"
            variant="ghost"
            size="sm"
            color="neutral"
            @click="emit('zoomOut')"
        />
        <UButton
            icon="i-material-symbols:add-rounded"
            variant="ghost"
            size="sm"
            color="neutral"
            @click="emit('zoomIn')"
        />
        <USeparator orientation="vertical" class="h-5 mx-1" />
        <UButton
            variant="ghost"
            size="sm"
            color="neutral"
            @click="emit('fitAll')"
        >
            Fit all
        </UButton>
        <UButton
            variant="ghost"
            size="sm"
            color="neutral"
            @click="emit('reset')"
        >
            100%
        </UButton>
        <USeparator orientation="vertical" class="h-5 mx-1" />
        <UButton
            :icon="themeIcon"
            variant="ghost"
            size="sm"
            color="neutral"
            @click="toggle"
        />
    </UCard>
</template>
