import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:5173/#/";
const outPng = process.argv[3] ?? ".review/canvas.png";
const outLog = ".review/console.log";
const outDiag = ".review/diagnostics.json";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const logs = [];
page.on("console", msg => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", err => logs.push(`[pageerror] ${err.message}`));
page.on("requestfailed", req => logs.push(`[requestfailed] ${req.url()} — ${req.failure()?.errorText}`));
page.on("response", (resp) => {
    if (!resp.ok()) {
        logs.push(`[http ${resp.status()}] ${resp.url()}`);
    }
});

await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
await page.waitForTimeout(1500);

const diagnostics = await page.evaluate(() => {
    const viewport = document.querySelector(".viewport");
    const world = document.querySelector(".world");
    const frames = [...document.querySelectorAll(".frame")];
    const vpRect = viewport?.getBoundingClientRect();
    const worldRect = world?.getBoundingClientRect();
    const worldStyle = world ? window.getComputedStyle(world) : null;
    return {
        viewport: vpRect ? { width: vpRect.width, height: vpRect.height, x: vpRect.x, y: vpRect.y } : null,
        world: worldRect
            ? {
                    width: worldRect.width,
                    height: worldRect.height,
                    x: worldRect.x,
                    y: worldRect.y,
                    declaredWidth: world.style.width,
                    declaredHeight: world.style.height,
                    transform: worldStyle?.transform,
                    transformOrigin: worldStyle?.transformOrigin,
                }
            : null,
        frameCount: frames.length,
        frames: frames.map((f) => {
            const r = f.getBoundingClientRect();
            const iframe = f.querySelector("iframe");
            return {
                title: f.querySelector(".title")?.textContent?.trim(),
                worldLeft: f.style.left,
                worldTop: f.style.top,
                screenRect: { width: r.width, height: r.height, x: r.x, y: r.y },
                iframeSrc: iframe?.src,
            };
        }),
    };
});

writeFileSync(outDiag, JSON.stringify(diagnostics, null, 2));
await page.screenshot({ path: outPng, fullPage: false });
writeFileSync(outLog, `${logs.join("\n")}\n`);

await browser.close();

console.log(`screenshot: ${outPng}`);
console.log(`diagnostics: ${outDiag}`);
console.log(`frames in DOM: ${diagnostics.frameCount}`);
