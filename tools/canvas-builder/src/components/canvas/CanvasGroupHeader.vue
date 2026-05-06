<script setup lang="ts">
interface Props {
    name: string;
}

defineProps<Props>();
</script>

<template>
    <div class="group-header">
        {{ name }}
    </div>
</template>

<style scoped lang="scss">
.group-header {
    font-size: 28px;
    font-weight: 600;
    color: var(--ui-text);
    line-height: 1;
    letter-spacing: -0.01em;
    user-select: none;
}
</style>
