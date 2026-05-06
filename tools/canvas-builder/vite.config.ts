import { fileURLToPath, URL } from "node:url";
import ui from "@nuxt/ui/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { uiConfig } from "./src/ui/config";

export default defineConfig({
    plugins: [
        vue(),
        ui({ ui: uiConfig }),
        viteSingleFile({
            useRecommendedBuildConfig: true,
            removeViteModuleLoader: true,
        }),
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
});
