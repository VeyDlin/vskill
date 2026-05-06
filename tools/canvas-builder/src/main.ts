import ui from "@nuxt/ui/vue-plugin";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { createApp } from "vue";

import App from "@/App.vue";
import { initDarkMode } from "@/composables/useDarkMode";
import { useTheme } from "@/composables/useTheme";
import router from "@/router";

import "@/assets/css/main.css";

initDarkMode();
useTheme();

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);
app.use(VueQueryPlugin);
app.use(ui);

app.mount("#app");
