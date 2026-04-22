<script setup lang="ts">
interface Emits {
    (event: "zoomIn"): void;
    (event: "zoomOut"): void;
    (event: "fitAll"): void;
    (event: "reset"): void;
}

const emit = defineEmits<Emits>();
</script>

<template>
    <div class="toolbar">
        <UButton icon="i-material-symbols:remove-rounded" variant="ghost" size="sm" @click="emit('zoomOut')" />
        <UButton icon="i-material-symbols:add-rounded" variant="ghost" size="sm" @click="emit('zoomIn')" />
        <div class="divider" />
        <UButton variant="ghost" size="sm" @click="emit('fitAll')"> Fit all </UButton>
        <UButton variant="ghost" size="sm" @click="emit('reset')"> 100% </UButton>
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
    background: var(--ui-bg-elevated);
    border: 1px solid var(--ui-border);
    box-shadow: 0 10px 30px rgb(0 0 0 / 0.12);
    z-index: 10;
    user-select: none;

    .divider {
        width: 1px;
        height: 1.25rem;
        background: var(--ui-border);
        margin: 0 0.25rem;
    }
}
</style>
