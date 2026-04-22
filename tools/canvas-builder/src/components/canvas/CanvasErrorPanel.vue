<script setup lang="ts">
interface Props {
    message: string | null;
}

const props = defineProps<Props>();
</script>

<template>
    <div class="error-panel">
        <UAlert
            color="error"
            variant="subtle"
            icon="i-material-symbols:error-outline-rounded"
            title="Manifest error"
            :description="props.message ?? 'Unknown error loading screens.js.'"
        />
    </div>
</template>

<style scoped lang="scss">
.error-panel {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    pointer-events: none;

    :deep(*) {
        pointer-events: auto;
    }
}
</style>
