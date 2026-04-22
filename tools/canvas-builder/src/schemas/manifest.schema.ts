import { z } from "zod";

export const screenSchema = z.object({
    path: z.string().min(1),
    width: z.number().positive(),
    height: z.number().positive(),
    title: z.string(),
});

export const manifestSchema = z.array(screenSchema);

export type Screen = z.infer<typeof screenSchema>;
export type Manifest = z.infer<typeof manifestSchema>;
