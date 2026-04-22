import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHashHistory } from "vue-router";
import CanvasView from "@/views/CanvasView.vue";

const routes: RouteRecordRaw[] = [{ path: "/", name: "canvas", component: CanvasView }];

export default createRouter({
    history: createWebHashHistory(),
    routes,
});
