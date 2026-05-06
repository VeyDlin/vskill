<script setup lang="ts">
import type { LayoutResult, PlacedFrame } from "@/utils/layout";
import { computed, nextTick, ref, watch } from "vue";
import CanvasEmptyState from "@/components/canvas/CanvasEmptyState.vue";
import CanvasErrorPanel from "@/components/canvas/CanvasErrorPanel.vue";
import CanvasFrame from "@/components/canvas/CanvasFrame.vue";
import CanvasGrid from "@/components/canvas/CanvasGrid.vue";
import CanvasGroupHeader from "@/components/canvas/CanvasGroupHeader.vue";
import CanvasToolbar from "@/components/canvas/CanvasToolbar.vue";
import DeviceTabs from "@/components/canvas/DeviceTabs.vue";
import { useCanvasPanzoom } from "@/composables/useCanvasPanzoom";
import { useDeviceTabs } from "@/composables/useDeviceTabs";
import { useManifest } from "@/composables/useManifest";
import { bucketByDevice, DEFAULT_GROUP, packLayoutByGroups, TITLE_HEIGHT } from "@/utils/layout";

interface DeviceLayout {
    device: string;
    layout: LayoutResult;
}

const { state, screens, config, error } = useManifest();

const viewport = ref<HTMLElement | null>(null);
const world = ref<HTMLElement | null>(null);

const { devices, activeDevice } = useDeviceTabs(screens, config);

const deviceLayouts = computed<DeviceLayout[]>(() =>
    bucketByDevice(screens.value, config.value?.devices).map(b => ({
        device: b.device,
        layout: packLayoutByGroups(b.screens, config.value),
    })),
);

const activeLayout = computed<LayoutResult>(() => {
    const found = deviceLayouts.value.find(d => d.device === activeDevice.value);
    return found?.layout ?? { groups: [], frames: [], totalWidth: 0, totalHeight: 0 };
});

const worldStyle = computed(() => ({
    width: `${activeLayout.value.totalWidth}px`,
    height: `${activeLayout.value.totalHeight}px`,
}));

const showDeviceTabs = computed(() => devices.value.length > 1);

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
        width: activeLayout.value.totalWidth,
        height: activeLayout.value.totalHeight,
    });
}

function shouldShowGroupHeader(name: string, groupCount: number): boolean {
    if (groupCount > 1) {
        return true;
    }
    return name !== DEFAULT_GROUP;
}

watch(state, async (next) => {
    if (next === "ready") {
        await nextTick();
        fitAll();
    }
});

watch(activeDevice, async () => {
    if (state.value !== "ready") {
        return;
    }
    await nextTick();
    fitAll();
});
</script>

<template>
    <div class="canvas-root">
        <div ref="viewport" class="viewport">
            <CanvasGrid
                :scale="pz.state.scale"
                :pan-x="pz.state.panX"
                :pan-y="pz.state.panY"
            />
            <div ref="world" class="world" :style="worldStyle">
                <div
                    v-for="entry in deviceLayouts"
                    v-show="entry.device === activeDevice"
                    :key="entry.device"
                    class="device-layer"
                >
                    <template v-for="group in entry.layout.groups" :key="group.name">
                        <CanvasGroupHeader
                            v-if="shouldShowGroupHeader(group.name, entry.layout.groups.length)"
                            :name="group.name"
                            :style="{
                                position: 'absolute',
                                left: '0px',
                                top: `${group.headerY}px`,
                            }"
                        />
                        <CanvasFrame
                            v-for="frame in group.frames"
                            :key="frame.screen.path"
                            :screen="frame.screen"
                            :style="{
                                position: 'absolute',
                                left: `${frame.x}px`,
                                top: `${frame.y}px`,
                            }"
                            @dblclick="onFrameDoubleClick(frame)"
                        />
                    </template>
                </div>
            </div>
        </div>

        <DeviceTabs
            v-if="state === 'ready' && showDeviceTabs"
            v-model="activeDevice"
            :devices="devices"
        />

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

        &:active {
            cursor: grabbing;
        }

        .world {
            position: relative;
            transform-origin: 0 0;

            .device-layer {
                position: absolute;
                inset: 0;
            }
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
