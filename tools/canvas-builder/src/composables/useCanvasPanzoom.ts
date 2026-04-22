import type { Ref } from "vue";
import { onBeforeUnmount, reactive, watch } from "vue";

export interface CanvasRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const MIN_SCALE = 0.05;
const MAX_SCALE = 4;
const WHEEL_ZOOM_FACTOR = 0.004;
const BUTTON_ZOOM_RATIO = 1.25;
const FIT_PADDING = 0.05;

interface TransformState {
    scale: number;
    panX: number;
    panY: number;
}

export function useCanvasPanzoom(viewport: Ref<HTMLElement | null>, world: Ref<HTMLElement | null>) {
    const state = reactive<TransformState>({ scale: 1, panX: 0, panY: 0 });
    let detachAll: (() => void) | null = null;

    const stopWatch = watch(
        [viewport, world],
        () => {
            const vp = viewport.value;
            const wd = world.value;
            if (detachAll !== null || vp === null || wd === null) {
                return;
            }

            wd.style.transformOrigin = "0 0";
            wd.style.willChange = "transform";
            apply(wd, state);

            let dragging = false;
            let startClientX = 0;
            let startClientY = 0;
            let startPanX = 0;
            let startPanY = 0;

            const onPointerDown = (event: PointerEvent) => {
                if (event.button !== 0) {
                    return;
                }
                dragging = true;
                startClientX = event.clientX;
                startClientY = event.clientY;
                startPanX = state.panX;
                startPanY = state.panY;
                vp.setPointerCapture(event.pointerId);
                vp.style.cursor = "grabbing";
            };

            const onPointerMove = (event: PointerEvent) => {
                if (!dragging) {
                    return;
                }
                state.panX = startPanX + (event.clientX - startClientX);
                state.panY = startPanY + (event.clientY - startClientY);
                apply(wd, state);
            };

            const onPointerUp = (event: PointerEvent) => {
                if (!dragging) {
                    return;
                }
                dragging = false;
                vp.releasePointerCapture(event.pointerId);
                vp.style.cursor = "grab";
            };

            const onWheel = (event: WheelEvent) => {
                event.preventDefault();
                const vpRect = vp.getBoundingClientRect();
                const px = event.clientX - vpRect.x;
                const py = event.clientY - vpRect.y;
                const factor = Math.exp(-event.deltaY * WHEEL_ZOOM_FACTOR);
                const nextScale = clamp(state.scale * factor, MIN_SCALE, MAX_SCALE);
                zoomAroundPoint(state, nextScale, px, py);
                apply(wd, state);
            };

            vp.style.cursor = "grab";
            vp.addEventListener("pointerdown", onPointerDown);
            vp.addEventListener("pointermove", onPointerMove);
            vp.addEventListener("pointerup", onPointerUp);
            vp.addEventListener("pointercancel", onPointerUp);
            vp.addEventListener("wheel", onWheel, { passive: false });

            detachAll = () => {
                vp.removeEventListener("pointerdown", onPointerDown);
                vp.removeEventListener("pointermove", onPointerMove);
                vp.removeEventListener("pointerup", onPointerUp);
                vp.removeEventListener("pointercancel", onPointerUp);
                vp.removeEventListener("wheel", onWheel);
            };
        },
        { immediate: true },
    );

    onBeforeUnmount(() => {
        stopWatch();
        detachAll?.();
    });

    function zoomIn(): void {
        zoomToCenter(state.scale * BUTTON_ZOOM_RATIO);
    }

    function zoomOut(): void {
        zoomToCenter(state.scale / BUTTON_ZOOM_RATIO);
    }

    function resetZoom(): void {
        zoomToCenter(1);
    }

    function zoomToCenter(nextScaleRaw: number): void {
        const vp = viewport.value;
        const wd = world.value;
        if (vp === null || wd === null) {
            return;
        }
        const nextScale = clamp(nextScaleRaw, MIN_SCALE, MAX_SCALE);
        zoomAroundPoint(state, nextScale, vp.clientWidth / 2, vp.clientHeight / 2);
        apply(wd, state);
    }

    function fitToRect(rect: CanvasRect): void {
        const vp = viewport.value;
        const wd = world.value;
        if (vp === null || wd === null) {
            return;
        }

        const vw = vp.clientWidth;
        const vh = vp.clientHeight;
        if (vw === 0 || vh === 0 || rect.width === 0 || rect.height === 0) {
            return;
        }

        const scaleX = (vw * (1 - FIT_PADDING * 2)) / rect.width;
        const scaleY = (vh * (1 - FIT_PADDING * 2)) / rect.height;
        const nextScale = clamp(Math.min(scaleX, scaleY), MIN_SCALE, MAX_SCALE);

        state.scale = nextScale;
        state.panX = vw / 2 - nextScale * (rect.x + rect.width / 2);
        state.panY = vh / 2 - nextScale * (rect.y + rect.height / 2);
        apply(wd, state);
    }

    return { state, zoomIn, zoomOut, resetZoom, fitToRect };
}

function apply(world: HTMLElement, state: TransformState): void {
    world.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`;
}

function zoomAroundPoint(state: TransformState, nextScale: number, clientPx: number, clientPy: number): void {
    const worldX = (clientPx - state.panX) / state.scale;
    const worldY = (clientPy - state.panY) / state.scale;
    state.panX = clientPx - nextScale * worldX;
    state.panY = clientPy - nextScale * worldY;
    state.scale = nextScale;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
