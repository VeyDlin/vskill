import type { Manifest, ManifestConfig } from "@/schemas/manifest.schema";
import type { Ref } from "vue";
import { computed, ref, watch } from "vue";
import { bucketByDevice, DEFAULT_DEVICE } from "@/utils/layout";

export function useDeviceTabs(screens: Ref<Manifest>, config: Ref<ManifestConfig>) {
    const devices = computed(() =>
        bucketByDevice(screens.value, config.value?.devices).map(b => b.device),
    );

    const activeDevice = ref<string>(DEFAULT_DEVICE);

    watch(
        devices,
        (next) => {
            if (next.length === 0) {
                activeDevice.value = DEFAULT_DEVICE;
                return;
            }
            if (!next.includes(activeDevice.value)) {
                activeDevice.value = next[0]!;
            }
        },
        { immediate: true },
    );

    const activeScreens = computed(() =>
        screens.value.filter(s => (s.device ?? DEFAULT_DEVICE) === activeDevice.value),
    );

    return {
        devices,
        activeDevice,
        activeScreens,
    };
}
