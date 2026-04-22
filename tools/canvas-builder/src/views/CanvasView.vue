<script setup lang="ts">
import type { PlacedFrame } from "@/utils/layout";
import { computed, nextTick, ref, watch } from "vue";
import CanvasEmptyState from "@/components/canvas/CanvasEmptyState.vue";
import CanvasErrorPanel from "@/components/canvas/CanvasErrorPanel.vue";
import CanvasFrame from "@/components/canvas/CanvasFrame.vue";
import CanvasToolbar from "@/components/canvas/CanvasToolbar.vue";
import { useCanvasPanzoom } from "@/composables/useCanvasPanzoom";
import { useManifest } from "@/composables/useManifest";
import { packLayout, TITLE_HEIGHT } from "@/utils/layout";

const { state, screens, error } = useManifest();

const viewport = ref<HTMLElement | null>(null);
const world = ref<HTMLElement | null>(null);

const layout = computed(() => packLayout(screens.value));

const worldStyle = computed(() => ({
    width: `${layout.value.totalWidth}px`,
    height: `${layout.value.totalHeight}px`,
}));

const pz = useCanvasPanzoom(viewport, world);

function onFrameDoubleClick(frame: PlacedFrame): void {
    pz.fitToRect({
        x: frame.x,
        y: frame.y,
        width: frame.screen.width,
        height: frame.screen.height + TITLE_HEIGHT,
    });
}

function fitAll(): void {
    pz.fitToRect({
        x: 0,
        y: 0,
        width: layout.value.totalWidth,
        height: layout.value.totalHeight,
    });
}

watch(state, async (next) => {
    if (next === "ready") {
        await nextTick();
        fitAll();
    }
});
</script>

<template>
    <div class="canvas-root">
        <div ref="viewport" class="viewport">
            <div ref="world" class="world" :style="worldStyle">
                <CanvasFrame
                    v-for="frame in layout.frames"
                    :key="frame.screen.path"
                    :screen="frame.screen"
                    :style="{
                        position: 'absolute',
                        left: `${frame.x}px`,
                        top: `${frame.y}px`,
                    }"
                    @dblclick="onFrameDoubleClick(frame)"
                />
            </div>
        </div>

        <div v-if="state === 'loading'" class="overlay-center">
            <p>Loading…</p>
        </div>
        <CanvasEmptyState v-else-if="state === 'empty'" />
        <CanvasErrorPanel v-else-if="state === 'error'" :message="error" />

        <CanvasToolbar
            v-if="state === 'ready'"
            @zoom-in="pz.zoomIn"
            @zoom-out="pz.zoomOut"
            @fit-all="fitAll"
            @reset="pz.resetZoom"
        />
    </div>
</template>

<style scoped lang="scss">
.canvas-root {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: var(--canvas-bg);

    .viewport {
        position: absolute;
        inset: 0;
        cursor: grab;
        overflow: hidden;
        background-color: var(--canvas-bg);
        background-image:
            linear-gradient(var(--canvas-grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--canvas-grid) 1px, transparent 1px);
        background-size: 32px 32px;

        &:active {
            cursor: grabbing;
        }

        .world {
            position: relative;
            transform-origin: 0 0;
        }
    }

    .overlay-center {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--canvas-text-muted);
        pointer-events: none;
    }
}
</style>
