import { z } from "zod";

export const screenSchema = z.object({
    path: z.string().min(1),
    width: z.number().positive(),
    height: z.number().positive(),
    title: z.string(),
    device: z.string().optional(),
    group: z.string().optional(),
});

export const manifestSchema = z.array(screenSchema);

export const manifestConfigSchema = z
    .object({
        perRow: z.number().int().positive().optional(),
        devices: z.array(z.string()).optional(),
        groups: z.array(z.string()).optional(),
    })
    .optional();

export type Screen = z.infer<typeof screenSchema>;
export type Manifest = z.infer<typeof manifestSchema>;
export type ManifestConfig = z.infer<typeof manifestConfigSchema>;
