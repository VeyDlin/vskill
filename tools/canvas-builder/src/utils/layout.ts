import type { Manifest, ManifestConfig, Screen } from "@/schemas/manifest.schema";

export const ROW_TARGET_WIDTH = 4000;
export const FRAME_GAP = 100;
export const TITLE_HEIGHT = 40;
export const GROUP_GAP = 200;
export const GROUP_HEADER_HEIGHT = 56;
export const DEFAULT_DEVICE = "default";
export const DEFAULT_GROUP = "default";

export interface PlacedFrame {
    screen: Screen;
    x: number;
    y: number;
}

export interface PlacedGroup {
    name: string;
    headerY: number;
    frames: PlacedFrame[];
    width: number;
    height: number;
}

export interface LayoutResult {
    groups: PlacedGroup[];
    frames: PlacedFrame[];
    totalWidth: number;
    totalHeight: number;
}

export interface DeviceBucket {
    device: string;
    screens: Screen[];
}

export function bucketByDevice(screens: Manifest, deviceOrder?: ReadonlyArray<string>): DeviceBucket[] {
    const map = new Map<string, Screen[]>();
    for (const screen of screens) {
        const device = screen.device ?? DEFAULT_DEVICE;
        let bucket = map.get(device);
        if (bucket === undefined) {
            bucket = [];
            map.set(device, bucket);
        }
        bucket.push(screen);
    }

    const ordered: string[] = [];
    if (deviceOrder !== undefined) {
        for (const name of deviceOrder) {
            if (map.has(name)) {
                ordered.push(name);
            }
        }
    }
    for (const name of map.keys()) {
        if (!ordered.includes(name)) {
            ordered.push(name);
        }
    }

    return ordered.map(device => ({ device, screens: map.get(device)! }));
}

export function packLayoutByGroups(screens: Screen[], config: ManifestConfig): LayoutResult {
    const perRow = config?.perRow;
    const groupOrder = config?.groups;

    const groupMap = new Map<string, Screen[]>();
    for (const screen of screens) {
        const group = screen.group ?? DEFAULT_GROUP;
        let bucket = groupMap.get(group);
        if (bucket === undefined) {
            bucket = [];
            groupMap.set(group, bucket);
        }
        bucket.push(screen);
    }

    const orderedGroups: string[] = [];
    if (groupOrder !== undefined) {
        for (const name of groupOrder) {
            if (groupMap.has(name)) {
                orderedGroups.push(name);
            }
        }
    }
    for (const name of groupMap.keys()) {
        if (!orderedGroups.includes(name)) {
            orderedGroups.push(name);
        }
    }

    const groups: PlacedGroup[] = [];
    const frames: PlacedFrame[] = [];
    let cursorY = 0;

    for (const groupName of orderedGroups) {
        const groupScreens = groupMap.get(groupName)!;
        const headerY = cursorY;
        const groupContentY = cursorY + GROUP_HEADER_HEIGHT;

        const groupFrames = layoutGroupFrames(groupScreens, groupContentY, perRow);
        let groupBottom = groupContentY;
        let groupRight = 0;
        for (const frame of groupFrames) {
            groupBottom = Math.max(groupBottom, frame.y + frame.screen.height + TITLE_HEIGHT);
            groupRight = Math.max(groupRight, frame.x + frame.screen.width);
        }

        groups.push({
            name: groupName,
            headerY,
            frames: groupFrames,
            width: groupRight,
            height: groupBottom - headerY,
        });
        frames.push(...groupFrames);

        cursorY = groupBottom + GROUP_GAP;
    }

    let totalWidth = 0;
    let totalHeight = 0;
    for (const group of groups) {
        totalWidth = Math.max(totalWidth, group.width);
        totalHeight = Math.max(totalHeight, group.headerY + group.height);
    }

    return { groups, frames, totalWidth, totalHeight };
}

function layoutGroupFrames(screens: Screen[], baseY: number, perRow: number | undefined): PlacedFrame[] {
    const frames: PlacedFrame[] = [];
    let rowX = 0;
    let rowY = baseY;
    let rowCount = 0;
    let rowMaxHeight = 0;

    for (const screen of screens) {
        const frameTotalHeight = screen.height + TITLE_HEIGHT;
        const wrapByCount = perRow !== undefined && rowCount >= perRow;
        const wrapByWidth = perRow === undefined && rowX > 0 && rowX + screen.width > ROW_TARGET_WIDTH;

        if (wrapByCount || wrapByWidth) {
            rowY += rowMaxHeight + FRAME_GAP;
            rowX = 0;
            rowCount = 0;
            rowMaxHeight = 0;
        }

        frames.push({ screen, x: rowX, y: rowY });
        rowX += screen.width + FRAME_GAP;
        rowCount += 1;
        rowMaxHeight = Math.max(rowMaxHeight, frameTotalHeight);
    }

    return frames;
}
