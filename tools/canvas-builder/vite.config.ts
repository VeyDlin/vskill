import { fileURLToPath, URL } from "node:url";
import ui from "@nuxt/ui/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
    plugins: [
        vue(),
        ui({
            ui: {
                colors: {
                    primary: "blue",
                    neutral: "slate",
                },
            },
        }),
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
