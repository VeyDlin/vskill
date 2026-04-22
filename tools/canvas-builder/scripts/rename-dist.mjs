import { copyFileSync, mkdirSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";

const builtFile = "dist/canvas.html";
renameSync("dist/index.html", builtFile);

const skillAssetPath = resolve("../../plugins/vskill/skills/screen-sketch/assets/canvas.html");
mkdirSync(dirname(skillAssetPath), { recursive: true });
copyFileSync(builtFile, skillAssetPath);

console.log(`built: ${builtFile}`);
console.log(`copied to skill: ${skillAssetPath}`);
