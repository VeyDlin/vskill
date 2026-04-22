import type { Manifest, Screen } from "@/schemas/manifest.schema";

export const ROW_TARGET_WIDTH = 4000;
export const FRAME_GAP = 100;
export const TITLE_HEIGHT = 40;

export interface PlacedFrame {
    screen: Screen;
    x: number;
    y: number;
}

export interface LayoutResult {
    frames: PlacedFrame[];
    totalWidth: number;
    totalHeight: number;
}

export function packLayout(screens: Manifest): LayoutResult {
    const frames: PlacedFrame[] = [];
    let rowX = 0;
    let rowY = 0;
    let rowMaxHeight = 0;

    for (const screen of screens) {
        const frameTotalHeight = screen.height + TITLE_HEIGHT;

        if (rowX > 0 && rowX + screen.width > ROW_TARGET_WIDTH) {
            rowY += rowMaxHeight + FRAME_GAP;
            rowX = 0;
            rowMaxHeight = 0;
        }

        frames.push({ screen, x: rowX, y: rowY });
        rowX += screen.width + FRAME_GAP;
        rowMaxHeight = Math.max(rowMaxHeight, frameTotalHeight);
    }

    let totalWidth = 0;
    let totalHeight = 0;
    for (const f of frames) {
        totalWidth = Math.max(totalWidth, f.x + f.screen.width);
        totalHeight = Math.max(totalHeight, f.y + f.screen.height + TITLE_HEIGHT);
    }

    return { frames, totalWidth, totalHeight };
}
