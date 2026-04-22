<script setup lang="ts">
import type { Screen } from "@/schemas/manifest.schema";
import { ref } from "vue";
import { TITLE_HEIGHT } from "@/utils/layout";

interface Props {
    screen: Screen;
}

const props = defineProps<Props>();

const iframeError = ref(false);

function onIframeError(): void {
    iframeError.value = true;
}
</script>

<template>
    <div
        class="frame"
        :style="{
            width: `${props.screen.width}px`,
            height: `${props.screen.height + TITLE_HEIGHT}px`,
        }"
    >
        <div class="title" :style="{ height: `${TITLE_HEIGHT}px` }">
            {{ props.screen.title }}
        </div>
        <div
            class="body"
            :style="{
                width: `${props.screen.width}px`,
                height: `${props.screen.height}px`,
            }"
        >
            <iframe
                v-if="!iframeError"
                class="iframe"
                :src="props.screen.path"
                :width="props.screen.width"
                :height="props.screen.height"
                loading="lazy"
                frameborder="0"
                @error="onIframeError"
            />
            <div v-else class="not-found">
                <p>{{ props.screen.path }}</p>
                <p class="hint">not found</p>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.frame {
    position: absolute;
    display: flex;
    flex-direction: column;

    .title {
        display: flex;
        align-items: center;
        padding: 0 0.75rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--ui-text);
        background: transparent;
        user-select: none;
    }

    .body {
        background: var(--ui-bg);
        border: 1px solid var(--ui-border);
        overflow: hidden;

        .iframe {
            display: block;
            width: 100%;
            height: 100%;
            pointer-events: none;
            background: var(--ui-bg);
        }

        .not-found {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            padding: 1rem;
            color: var(--ui-text-muted);
            font-family: monospace;
            font-size: 0.875rem;
            gap: 0.25rem;

            .hint {
                font-family: inherit;
                font-size: 0.75rem;
                opacity: 0.7;
            }
        }
    }
}
</style>
