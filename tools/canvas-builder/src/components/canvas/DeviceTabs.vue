<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";
import { computed } from "vue";

interface Props {
    devices: ReadonlyArray<string>;
    modelValue: string;
}

interface Emits {
    (event: "update:modelValue", value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const items = computed<TabsItem[]>(() =>
    props.devices.map(device => ({
        label: device,
        value: device,
    })),
);

const value = computed({
    get: () => props.modelValue,
    set: (next: string) => emit("update:modelValue", next),
});
</script>

<template>
    <UTabs
        v-model="value"
        :items="items"
        size="sm"
        variant="pill"
        class="device-tabs"
    />
</template>

<style scoped lang="scss">
.device-tabs {
    position: fixed;
    top: 1.25rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    user-select: none;
}
</style>
