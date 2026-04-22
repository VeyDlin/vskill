<script setup lang="ts">
interface Props {
    message?: string;
}

const props = withDefaults(defineProps<Props>(), {
    message: "No screens yet. Create screens.js next to canvas.html with a window.SCREENS array.",
});
</script>

<template>
    <div class="empty-state">
        <UIcon name="i-material-symbols:inbox-outline" class="icon" />
        <p class="text">
            {{ props.message }}
        </p>
    </div>
</template>

<style scoped lang="scss">
.empty-state {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: var(--canvas-text-muted);
    pointer-events: none;

    .icon {
        width: 3rem;
        height: 3rem;
        opacity: 0.6;
    }

    .text {
        max-width: 32rem;
        text-align: center;
        padding: 0 1rem;
        font-size: 0.9375rem;
    }
}
</style>
