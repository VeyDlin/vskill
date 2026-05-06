<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useDarkMode } from "@/composables/useDarkMode";

interface Props {
    scale: number;
    panX: number;
    panY: number;
}

const props = defineProps<Props>();

const { mode } = useDarkMode();

const BASE_STEP = 32;
const MIN_PX = 16;
const MAX_PX = 64;

const canvas = ref<HTMLCanvasElement | null>(null);
let resizeObserver: ResizeObserver | null = null;
let rafId = 0;

function scheduleDraw(): void {
    if (rafId !== 0) {
        return;
    }
    rafId = requestAnimationFrame(() => {
        rafId = 0;
        draw();
    });
}

function draw(): void {
    const el = canvas.value;
    if (el === null) {
        return;
    }
    const ctx = el.getContext("2d");
    if (ctx === null) {
        return;
    }

    const dpr = window.devicePixelRatio || 1;
    const cssW = el.clientWidth;
    const cssH = el.clientHeight;
    const pxW = Math.round(cssW * dpr);
    const pxH = Math.round(cssH * dpr);
    if (el.width !== pxW || el.height !== pxH) {
        el.width = pxW;
        el.height = pxH;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    let step = BASE_STEP;
    let onScreen = step * props.scale;
    while (onScreen < MIN_PX) {
        step *= 2;
        onScreen *= 2;
    }
    while (onScreen > MAX_PX) {
        step /= 2;
        onScreen /= 2;
    }

    const color = getComputedStyle(el).getPropertyValue("--canvas-grid").trim() || "rgba(127,127,127,0.3)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();

    const startX = ((props.panX % onScreen) + onScreen) % onScreen;
    for (let x = startX; x < cssW; x += onScreen) {
        const px = Math.floor(x) + 0.5;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, cssH);
    }

    const startY = ((props.panY % onScreen) + onScreen) % onScreen;
    for (let y = startY; y < cssH; y += onScreen) {
        const py = Math.floor(y) + 0.5;
        ctx.moveTo(0, py);
        ctx.lineTo(cssW, py);
    }

    ctx.stroke();
}

watch(() => [props.scale, props.panX, props.panY, mode.value], scheduleDraw);

onMounted(() => {
    resizeObserver = new ResizeObserver(scheduleDraw);
    if (canvas.value !== null) {
        resizeObserver.observe(canvas.value);
    }
    scheduleDraw();
});

onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    if (rafId !== 0) {
        cancelAnimationFrame(rafId);
    }
});
</script>

<template>
    <canvas ref="canvas" class="grid-canvas" />
</template>

<style scoped lang="scss">
.grid-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    display: block;
}
</style>
